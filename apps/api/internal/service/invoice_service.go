package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrComprobanteNotFound      = errors.New("comprobante not found")
	ErrPedidoNotInvoiceable     = errors.New("pedido is not in invoiceable state")
	ErrComprobanteAlreadyExists = errors.New("an active invoice already exists for this order")
	ErrInvalidComprobanteTransition = errors.New("invalid comprobante state transition")
)

type InvoiceService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewInvoiceService(db *pgxpool.Pool) *InvoiceService {
	return &InvoiceService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type ComprobanteListResponse struct {
	ID            string  `json:"id"`
	Tipo          string  `json:"tipo"`
	Letra         string  `json:"letra"`
	Numero        string  `json:"numero"`
	Estado        string  `json:"estado"`
	ClienteNombre string  `json:"cliente_nombre"`
	Total         float64 `json:"total"`
	FechaEmision  string  `json:"fecha_emision"`
}

type ComprobanteDetailResponse struct {
	ID                  string                     `json:"id"`
	Tipo                string                     `json:"tipo"`
	Letra               string                     `json:"letra"`
	Numero              string                     `json:"numero"`
	Estado              string                     `json:"estado"`
	PedidoID            string                     `json:"pedido_id,omitempty"`
	ClienteID           string                     `json:"cliente_id"`
	ClienteNombre       string                     `json:"cliente_nombre"`
	SucursalID          string                     `json:"sucursal_id"`
	SucursalNombre      string                     `json:"sucursal_nombre"`
	Subtotal            float64                    `json:"subtotal"`
	DescuentoMonto      float64                    `json:"descuento_monto"`
	BaseImponible       float64                    `json:"base_imponible"`
	TotalImpuestos      float64                    `json:"total_impuestos"`
	Total               float64                    `json:"total"`
	Impuestos           json.RawMessage            `json:"impuestos"`
	CAE                 string                     `json:"cae,omitempty"`
	FechaVencimientoCAE string                     `json:"fecha_vencimiento_cae,omitempty"`
	FechaEmision        string                     `json:"fecha_emision"`
	CondicionPago       string                     `json:"condicion_pago"`
	Observaciones       string                     `json:"observaciones,omitempty"`
	Items               []DetalleComprobanteResponse `json:"items"`
	CreatedAt           string                     `json:"created_at"`
}

type DetalleComprobanteResponse struct {
	ID                  string  `json:"id"`
	ProductoID          string  `json:"producto_id,omitempty"`
	ProductoNombre      string  `json:"producto_nombre"`
	ProductoCodigo      string  `json:"producto_codigo,omitempty"`
	ProductoUnidad      string  `json:"producto_unidad"`
	Cantidad            float64 `json:"cantidad"`
	PrecioUnitario      float64 `json:"precio_unitario"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
	DescuentoMonto      float64 `json:"descuento_monto"`
	Subtotal            float64 `json:"subtotal"`
	Orden               int32   `json:"orden"`
}

// --- Input DTOs ---

type CreateFromPedidoInput struct {
	PedidoID      string `json:"pedido_id" validate:"required,uuid"`
	Letra         string `json:"letra" validate:"omitempty,oneof=A B N X"`
	Observaciones string `json:"observaciones"`
}

type CreateManualInput struct {
	Tipo          string                    `json:"tipo" validate:"required,oneof=FACTURA NOTA_CREDITO NOTA_DEBITO"`
	Letra         string                    `json:"letra" validate:"required,oneof=A B N X"`
	ClienteID     string                    `json:"cliente_id" validate:"required,uuid"`
	SucursalID    string                    `json:"sucursal_id" validate:"required,uuid"`
	CondicionPago string                    `json:"condicion_pago" validate:"required,oneof=CONTADO CUENTA_CORRIENTE CHEQUE TRANSFERENCIA OTRO"`
	Observaciones string                    `json:"observaciones"`
	Items         []ComprobanteItemInput    `json:"items" validate:"required,min=1,dive"`
}

type ComprobanteItemInput struct {
	ProductoID          string  `json:"producto_id"`
	Nombre              string  `json:"nombre" validate:"required,min=1,max=300"`
	Codigo              string  `json:"codigo"`
	Unidad              string  `json:"unidad" validate:"required,min=1,max=20"`
	Cantidad            float64 `json:"cantidad" validate:"required,gt=0"`
	PrecioUnitario      float64 `json:"precio_unitario" validate:"gte=0"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
}

// --- CreateFromPedido ---

func (s *InvoiceService) CreateFromPedido(ctx context.Context, userID pgtype.UUID, input CreateFromPedidoInput) (*ComprobanteDetailResponse, error) {
	pedidoID, err := pgUUID(input.PedidoID)
	if err != nil {
		return nil, fmt.Errorf("invalid pedido_id")
	}

	// Fetch pedido
	pedido, err := s.queries.GetPedidoByID(ctx, repository.GetPedidoByIDParams{
		ID: pedidoID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPedidoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get pedido: %w", err)
	}

	// Validate pedido state
	estado := string(pedido.Estado)
	if estado != "ENTREGADO" && estado != "APROBADO" {
		return nil, ErrPedidoNotInvoiceable
	}

	// Check no existing active comprobante for this pedido
	_, err = s.queries.GetComprobanteByPedido(ctx, repository.GetComprobanteByPedidoParams{
		PedidoID: pedidoID, UsuarioID: userID,
	})
	if err == nil {
		return nil, ErrComprobanteAlreadyExists
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("check existing comprobante: %w", err)
	}

	// Determine letra from client's condicion_iva
	letra := input.Letra
	if letra == "" {
		clienteRow, err := s.queries.GetClienteByID(ctx, repository.GetClienteByIDParams{
			ID: pedido.ClienteID, UsuarioID: userID,
		})
		if err != nil {
			return nil, fmt.Errorf("get cliente: %w", err)
		}
		letra = determinaLetra(string(clienteRow.CondicionIva.CondicionIva))
	}

	// Get order items
	items, err := s.queries.ListDetallePedido(ctx, pedidoID)
	if err != nil {
		return nil, fmt.Errorf("list detalle pedido: %w", err)
	}

	// Get order taxes
	impuestos, err := s.queries.ListImpuestosPedido(ctx, pedidoID)
	if err != nil {
		return nil, fmt.Errorf("list impuestos pedido: %w", err)
	}

	// Build tax JSON
	taxJSON, err := buildTaxJSON(impuestos)
	if err != nil {
		return nil, fmt.Errorf("build tax json: %w", err)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// Generate numero
	seq, err := qtx.GetNextComprobanteNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next comprobante numero: %w", err)
	}
	numero := fmt.Sprintf("0001-%08d", seq)

	comprobante, err := qtx.CreateComprobante(ctx, repository.CreateComprobanteParams{
		Tipo:           repository.TipoComprobanteFACTURA,
		Letra:          repository.LetraComprobante(letra),
		Numero:         numero,
		Estado:         repository.EstadoComprobanteBORRADOR,
		PedidoID:       pedidoID,
		ClienteID:      pedido.ClienteID,
		SucursalID:     pedido.SucursalID,
		Subtotal:       pedido.Subtotal,
		DescuentoMonto: pedido.DescuentoMonto,
		BaseImponible:  pedido.BaseImponible,
		TotalImpuestos: pedido.TotalImpuestos,
		Total:          pedido.Total,
		Impuestos:      taxJSON,
		FechaEmision:   pgtype.Date{Time: time.Now(), Valid: true},
		CondicionPago:  pedido.CondicionPago,
		Observaciones:  pgText(input.Observaciones),
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create comprobante: %w", err)
	}

	// Snapshot line items from order
	for _, item := range items {
		_, err = qtx.CreateDetalleComprobante(ctx, repository.CreateDetalleComprobanteParams{
			ComprobanteID:       comprobante.ID,
			ProductoID:          item.ProductoID,
			ProductoNombre:      item.ProductoNombre,
			ProductoCodigo:      item.ProductoCodigo,
			ProductoUnidad:      item.ProductoUnidad,
			Cantidad:            item.Cantidad,
			PrecioUnitario:      item.PrecioUnitario,
			DescuentoPorcentaje: item.DescuentoPorcentaje,
			DescuentoMonto:      item.DescuentoMonto,
			Subtotal:            item.Subtotal,
			Orden:               item.Orden,
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle comprobante: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(comprobante.ID))
}

// --- CreateManual ---

func (s *InvoiceService) CreateManual(ctx context.Context, userID pgtype.UUID, input CreateManualInput) (*ComprobanteDetailResponse, error) {
	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	// Calculate totals
	var subtotal float64
	for _, item := range input.Items {
		lineTotal := item.Cantidad * item.PrecioUnitario
		lineDiscount := lineTotal * (item.DescuentoPorcentaje / 100)
		subtotal += lineTotal - lineDiscount
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	seq, err := qtx.GetNextComprobanteNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next comprobante numero: %w", err)
	}
	numero := fmt.Sprintf("0001-%08d", seq)

	comprobante, err := qtx.CreateComprobante(ctx, repository.CreateComprobanteParams{
		Tipo:           repository.TipoComprobante(input.Tipo),
		Letra:          repository.LetraComprobante(input.Letra),
		Numero:         numero,
		Estado:         repository.EstadoComprobanteBORRADOR,
		ClienteID:      clienteID,
		SucursalID:     sucursalID,
		Subtotal:       numericFromFloat(subtotal),
		DescuentoMonto: numericFromFloat(0),
		BaseImponible:  numericFromFloat(subtotal),
		TotalImpuestos: numericFromFloat(0),
		Total:          numericFromFloat(subtotal),
		Impuestos:      []byte("[]"),
		FechaEmision:   pgtype.Date{Time: time.Now(), Valid: true},
		CondicionPago:  repository.CondicionPago(input.CondicionPago),
		Observaciones:  pgText(input.Observaciones),
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create comprobante: %w", err)
	}

	for i, item := range input.Items {
		var prodID pgtype.UUID
		if item.ProductoID != "" {
			prodID, err = pgUUID(item.ProductoID)
			if err != nil {
				return nil, fmt.Errorf("invalid producto_id")
			}
		}

		lineTotal := item.Cantidad * item.PrecioUnitario
		lineDiscount := lineTotal * (item.DescuentoPorcentaje / 100)
		lineSubtotal := lineTotal - lineDiscount

		_, err = qtx.CreateDetalleComprobante(ctx, repository.CreateDetalleComprobanteParams{
			ComprobanteID:       comprobante.ID,
			ProductoID:          prodID,
			ProductoNombre:      item.Nombre,
			ProductoCodigo:      pgText(item.Codigo),
			ProductoUnidad:      item.Unidad,
			Cantidad:            numericFromFloat(item.Cantidad),
			PrecioUnitario:      numericFromFloat(item.PrecioUnitario),
			DescuentoPorcentaje: numericFromFloat(item.DescuentoPorcentaje),
			DescuentoMonto:      numericFromFloat(lineDiscount),
			Subtotal:            numericFromFloat(lineSubtotal),
			Orden:               int32(i),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle comprobante: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(comprobante.ID))
}

// --- Get ---

func (s *InvoiceService) Get(ctx context.Context, userID pgtype.UUID, id string) (*ComprobanteDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrComprobanteNotFound
	}

	c, err := s.queries.GetComprobanteByID(ctx, repository.GetComprobanteByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrComprobanteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get comprobante: %w", err)
	}

	detalles, err := s.queries.ListDetallesByComprobante(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalles: %w", err)
	}

	resp := toComprobanteDetailResponse(c)

	for _, d := range detalles {
		resp.Items = append(resp.Items, DetalleComprobanteResponse{
			ID:                  uuidStrFromPg(d.ID),
			ProductoID:          uuidStrFromPg(d.ProductoID),
			ProductoNombre:      d.ProductoNombre,
			ProductoCodigo:      textFromPg(d.ProductoCodigo),
			ProductoUnidad:      d.ProductoUnidad,
			Cantidad:            floatFromNumeric(d.Cantidad),
			PrecioUnitario:      floatFromNumeric(d.PrecioUnitario),
			DescuentoPorcentaje: floatFromNumeric(d.DescuentoPorcentaje),
			DescuentoMonto:      floatFromNumeric(d.DescuentoMonto),
			Subtotal:            floatFromNumeric(d.Subtotal),
			Orden:               d.Orden,
		})
	}
	if resp.Items == nil {
		resp.Items = []DetalleComprobanteResponse{}
	}

	return resp, nil
}

// --- List ---

func (s *InvoiceService) List(ctx context.Context, userID pgtype.UUID, search, estado, clienteID string, limit, offset int32) ([]ComprobanteListResponse, int, error) {
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchComprobantes(ctx, repository.SearchComprobantesParams{
			UsuarioID: userID, Numero: searchPattern, Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search comprobantes: %w", err)
		}
		count, err := s.queries.CountSearchComprobantes(ctx, repository.CountSearchComprobantesParams{
			UsuarioID: userID, Numero: searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search comprobantes: %w", err)
		}
		result := make([]ComprobanteListResponse, 0, len(items))
		for _, c := range items {
			result = append(result, comprobanteListFromSearch(c))
		}
		return result, int(count), nil
	}

	if estado != "" {
		items, err := s.queries.ListComprobantesByEstado(ctx, repository.ListComprobantesByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoComprobante(estado), Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list comprobantes by estado: %w", err)
		}
		count, err := s.queries.CountComprobantesByEstado(ctx, repository.CountComprobantesByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoComprobante(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count comprobantes by estado: %w", err)
		}
		result := make([]ComprobanteListResponse, 0, len(items))
		for _, c := range items {
			result = append(result, comprobanteListFromEstado(c))
		}
		return result, int(count), nil
	}

	if clienteID != "" {
		cID, err := pgUUID(clienteID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid cliente_id")
		}
		items, err := s.queries.ListComprobantesByCliente(ctx, repository.ListComprobantesByClienteParams{
			UsuarioID: userID, ClienteID: cID, Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list comprobantes by cliente: %w", err)
		}
		count, err := s.queries.CountComprobantesByCliente(ctx, repository.CountComprobantesByClienteParams{
			UsuarioID: userID, ClienteID: cID,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count comprobantes by cliente: %w", err)
		}
		result := make([]ComprobanteListResponse, 0, len(items))
		for _, c := range items {
			result = append(result, comprobanteListFromCliente(c))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListComprobantes(ctx, repository.ListComprobantesParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list comprobantes: %w", err)
	}
	count, err := s.queries.CountComprobantes(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count comprobantes: %w", err)
	}
	result := make([]ComprobanteListResponse, 0, len(items))
	for _, c := range items {
		result = append(result, comprobanteListFromList(c))
	}
	return result, int(count), nil
}

// --- Emit ---

func (s *InvoiceService) Emit(ctx context.Context, userID pgtype.UUID, id string) (*ComprobanteDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrComprobanteNotFound
	}

	c, err := s.queries.GetComprobanteByID(ctx, repository.GetComprobanteByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrComprobanteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get comprobante: %w", err)
	}

	if c.Estado != repository.EstadoComprobanteBORRADOR {
		return nil, ErrInvalidComprobanteTransition
	}

	_, err = s.queries.UpdateComprobanteEstado(ctx, repository.UpdateComprobanteEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: repository.EstadoComprobanteEMITIDO,
	})
	if err != nil {
		return nil, fmt.Errorf("update estado: %w", err)
	}

	return s.Get(ctx, userID, id)
}

// --- Void ---

func (s *InvoiceService) Void(ctx context.Context, userID pgtype.UUID, id string) (*ComprobanteDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrComprobanteNotFound
	}

	c, err := s.queries.GetComprobanteByID(ctx, repository.GetComprobanteByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrComprobanteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get comprobante: %w", err)
	}

	if c.Estado != repository.EstadoComprobanteEMITIDO {
		return nil, ErrInvalidComprobanteTransition
	}

	_, err = s.queries.UpdateComprobanteEstado(ctx, repository.UpdateComprobanteEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: repository.EstadoComprobanteANULADO,
	})
	if err != nil {
		return nil, fmt.Errorf("update estado: %w", err)
	}

	return s.Get(ctx, userID, id)
}

// --- Delete ---

func (s *InvoiceService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrComprobanteNotFound
	}
	return s.queries.SoftDeleteComprobante(ctx, repository.SoftDeleteComprobanteParams{
		ID: pgID, UsuarioID: userID,
	})
}

// --- Helpers ---

func determinaLetra(condicionIVA string) string {
	switch condicionIVA {
	case "RESPONSABLE_INSCRIPTO":
		return "A"
	case "MONOTRIBUTO", "CONSUMIDOR_FINAL":
		return "B"
	case "EXENTO":
		return "N"
	default:
		return "B"
	}
}

type taxJSONItem struct {
	Tipo          string  `json:"tipo"`
	Nombre        string  `json:"nombre"`
	Porcentaje    float64 `json:"porcentaje"`
	BaseImponible float64 `json:"base_imponible"`
	Monto         float64 `json:"monto"`
}

func buildTaxJSON(impuestos []repository.ImpuestosPedido) ([]byte, error) {
	items := make([]taxJSONItem, 0, len(impuestos))
	for _, imp := range impuestos {
		items = append(items, taxJSONItem{
			Tipo:          string(imp.Tipo),
			Nombre:        imp.Nombre,
			Porcentaje:    floatFromNumeric(imp.Porcentaje),
			BaseImponible: floatFromNumeric(imp.BaseImponible),
			Monto:         floatFromNumeric(imp.Monto),
		})
	}
	return json.Marshal(items)
}

func toComprobanteDetailResponse(c repository.GetComprobanteByIDRow) *ComprobanteDetailResponse {
	clienteNombre := c.ClienteNombre
	if c.ClienteApellido.Valid && c.ClienteApellido.String != "" {
		clienteNombre = c.ClienteApellido.String + ", " + c.ClienteNombre
	}

	resp := &ComprobanteDetailResponse{
		ID:             uuidStrFromPg(c.ID),
		Tipo:           string(c.Tipo),
		Letra:          string(c.Letra),
		Numero:         c.Numero,
		Estado:         string(c.Estado),
		PedidoID:       uuidStrFromPg(c.PedidoID),
		ClienteID:      uuidStrFromPg(c.ClienteID),
		ClienteNombre:  clienteNombre,
		SucursalID:     uuidStrFromPg(c.SucursalID),
		SucursalNombre: c.SucursalNombre,
		Subtotal:       floatFromNumeric(c.Subtotal),
		DescuentoMonto: floatFromNumeric(c.DescuentoMonto),
		BaseImponible:  floatFromNumeric(c.BaseImponible),
		TotalImpuestos: floatFromNumeric(c.TotalImpuestos),
		Total:          floatFromNumeric(c.Total),
		Impuestos:      c.Impuestos,
		FechaEmision:   c.FechaEmision.Time.Format("2006-01-02"),
		CondicionPago:  string(c.CondicionPago),
		Observaciones:  textFromPg(c.Observaciones),
		CreatedAt:      c.CreatedAt.Time.Format(time.RFC3339),
	}
	if c.Cae.Valid {
		resp.CAE = c.Cae.String
	}
	if c.FechaVencimientoCae.Valid {
		resp.FechaVencimientoCAE = c.FechaVencimientoCae.Time.Format("2006-01-02")
	}
	return resp
}

func comprobanteListBase(id pgtype.UUID, tipo repository.TipoComprobante, letra repository.LetraComprobante, numero string, estado repository.EstadoComprobante, clienteNombre string, clienteApellido pgtype.Text, total pgtype.Numeric, fechaEmision pgtype.Date) ComprobanteListResponse {
	cn := clienteNombre
	if clienteApellido.Valid && clienteApellido.String != "" {
		cn = clienteApellido.String + ", " + clienteNombre
	}
	return ComprobanteListResponse{
		ID:            uuidStrFromPg(id),
		Tipo:          string(tipo),
		Letra:         string(letra),
		Numero:        numero,
		Estado:        string(estado),
		ClienteNombre: cn,
		Total:         floatFromNumeric(total),
		FechaEmision:  fechaEmision.Time.Format("2006-01-02"),
	}
}

func comprobanteListFromList(c repository.ListComprobantesRow) ComprobanteListResponse {
	return comprobanteListBase(c.ID, c.Tipo, c.Letra, c.Numero, c.Estado, c.ClienteNombre, c.ClienteApellido, c.Total, c.FechaEmision)
}

func comprobanteListFromEstado(c repository.ListComprobantesByEstadoRow) ComprobanteListResponse {
	return comprobanteListBase(c.ID, c.Tipo, c.Letra, c.Numero, c.Estado, c.ClienteNombre, c.ClienteApellido, c.Total, c.FechaEmision)
}

func comprobanteListFromCliente(c repository.ListComprobantesByClienteRow) ComprobanteListResponse {
	return comprobanteListBase(c.ID, c.Tipo, c.Letra, c.Numero, c.Estado, c.ClienteNombre, c.ClienteApellido, c.Total, c.FechaEmision)
}

func comprobanteListFromSearch(c repository.SearchComprobantesRow) ComprobanteListResponse {
	return comprobanteListBase(c.ID, c.Tipo, c.Letra, c.Numero, c.Estado, c.ClienteNombre, c.ClienteApellido, c.Total, c.FechaEmision)
}
