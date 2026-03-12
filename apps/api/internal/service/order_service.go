package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrPedidoNotFound          = errors.New("pedido not found")
	ErrInvalidTransition       = errors.New("invalid state transition")
	ErrUnauthorizedTransition  = errors.New("unauthorized state transition")
	ErrPedidoNotEditable       = errors.New("pedido is not in editable state")
	ErrInsufficientStock       = errors.New("insufficient stock")
)

type OrderService struct {
	db       *pgxpool.Pool
	queries  *repository.Queries
	stockSvc *StockService
}

func NewOrderService(db *pgxpool.Pool, stockSvc *StockService) *OrderService {
	return &OrderService{
		db:       db,
		queries:  repository.New(db),
		stockSvc: stockSvc,
	}
}

// --- Response DTOs ---

type PedidoListResponse struct {
	ID                  string  `json:"id"`
	Numero              string  `json:"numero"`
	ClienteID           string  `json:"cliente_id"`
	ClienteNombre       string  `json:"cliente_nombre"`
	SucursalID          string  `json:"sucursal_id"`
	SucursalNombre      string  `json:"sucursal_nombre"`
	Estado              string  `json:"estado"`
	CondicionPago       string  `json:"condicion_pago"`
	FechaPedido         string  `json:"fecha_pedido"`
	FechaEntregaEstimada string `json:"fecha_entrega_estimada,omitempty"`
	Subtotal            float64 `json:"subtotal"`
	Total               float64 `json:"total"`
}

type PedidoDetailResponse struct {
	ID                    string                `json:"id"`
	Numero                string                `json:"numero"`
	ClienteID             string                `json:"cliente_id"`
	ClienteNombre         string                `json:"cliente_nombre"`
	ClienteApellido       string                `json:"cliente_apellido,omitempty"`
	ClienteCuit           string                `json:"cliente_cuit,omitempty"`
	DireccionID           string                `json:"direccion_id,omitempty"`
	SucursalID            string                `json:"sucursal_id"`
	SucursalNombre        string                `json:"sucursal_nombre"`
	EmpleadoID            string                `json:"empleado_id,omitempty"`
	EmpleadoNombre        string                `json:"empleado_nombre,omitempty"`
	Estado                string                `json:"estado"`
	CondicionPago         string                `json:"condicion_pago"`
	FechaPedido           string                `json:"fecha_pedido"`
	FechaEntregaEstimada  string                `json:"fecha_entrega_estimada,omitempty"`
	FechaEntregaReal      string                `json:"fecha_entrega_real,omitempty"`
	Subtotal              float64               `json:"subtotal"`
	DescuentoPorcentaje   float64               `json:"descuento_porcentaje"`
	DescuentoMonto        float64               `json:"descuento_monto"`
	BaseImponible         float64               `json:"base_imponible"`
	TotalImpuestos        float64               `json:"total_impuestos"`
	Total                 float64               `json:"total"`
	Observaciones         string                `json:"observaciones,omitempty"`
	ObservacionesInternas string                `json:"observaciones_internas,omitempty"`
	Items                 []DetalleResponse     `json:"items"`
	Impuestos             []ImpuestoResponse    `json:"impuestos"`
	Historial             []HistorialResponse   `json:"historial"`
}

type DetalleResponse struct {
	ID                  string  `json:"id"`
	ProductoID          string  `json:"producto_id"`
	ProductoNombre      string  `json:"producto_nombre"`
	ProductoCodigo      string  `json:"producto_codigo,omitempty"`
	ProductoUnidad      string  `json:"producto_unidad"`
	Cantidad            float64 `json:"cantidad"`
	PrecioUnitario      float64 `json:"precio_unitario"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
	DescuentoMonto      float64 `json:"descuento_monto"`
	Subtotal            float64 `json:"subtotal"`
	CantidadEntregada   float64 `json:"cantidad_entregada"`
	Orden               int32   `json:"orden"`
}

type ImpuestoResponse struct {
	ID            string  `json:"id"`
	Tipo          string  `json:"tipo"`
	Nombre        string  `json:"nombre"`
	Porcentaje    float64 `json:"porcentaje"`
	BaseImponible float64 `json:"base_imponible"`
	Monto         float64 `json:"monto"`
}

type HistorialResponse struct {
	ID               string `json:"id"`
	EstadoAnterior   string `json:"estado_anterior,omitempty"`
	EstadoNuevo      string `json:"estado_nuevo"`
	EmpleadoID       string `json:"empleado_id,omitempty"`
	EmpleadoNombre   string `json:"empleado_nombre,omitempty"`
	Comentario       string `json:"comentario,omitempty"`
	CreatedAt        string `json:"created_at"`
}

// --- Input DTOs ---

type CreatePedidoInput struct {
	ClienteID           string             `json:"cliente_id" validate:"required,uuid"`
	DireccionID         string             `json:"direccion_id"`
	SucursalID          string             `json:"sucursal_id" validate:"required,uuid"`
	EmpleadoID          string             `json:"empleado_id"`
	CondicionPago       string             `json:"condicion_pago" validate:"required,oneof=CONTADO CUENTA_CORRIENTE CHEQUE TRANSFERENCIA OTRO"`
	FechaEntregaEstimada string            `json:"fecha_entrega_estimada"`
	DescuentoPorcentaje float64            `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
	Observaciones       string             `json:"observaciones"`
	ObservacionesInternas string           `json:"observaciones_internas"`
	Items               []CreateDetalleInput `json:"items" validate:"required,min=1,dive"`
	Impuestos           []CreateImpuestoInput `json:"impuestos" validate:"dive"`
}

type CreateDetalleInput struct {
	ProductoID          string  `json:"producto_id" validate:"required,uuid"`
	Cantidad            float64 `json:"cantidad" validate:"required,gt=0"`
	PrecioUnitario      float64 `json:"precio_unitario" validate:"gte=0"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
}

type CreateImpuestoInput struct {
	Tipo       string  `json:"tipo" validate:"required,oneof=IVA IIBB PERCEPCION_IVA PERCEPCION_IIBB OTRO"`
	Nombre     string  `json:"nombre" validate:"required,min=1,max=100"`
	Porcentaje float64 `json:"porcentaje" validate:"gte=0"`
}

type UpdateEstadoInput struct {
	Estado     string `json:"estado" validate:"required"`
	EmpleadoID string `json:"empleado_id"`
	Comentario string `json:"comentario"`
}

// --- Order CRUD ---

func (s *OrderService) CreatePedido(ctx context.Context, userID pgtype.UUID, role string, input CreatePedidoInput) (*PedidoDetailResponse, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// Generate order number
	seq, err := qtx.NextPedidoNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next pedido numero: %w", err)
	}
	numero := fmt.Sprintf("P-%06d", seq)

	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	var direccionID pgtype.UUID
	if input.DireccionID != "" {
		direccionID, err = pgUUID(input.DireccionID)
		if err != nil {
			return nil, fmt.Errorf("invalid direccion_id")
		}
	}

	var empleadoID pgtype.UUID
	if input.EmpleadoID != "" {
		empleadoID, err = pgUUID(input.EmpleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	var fechaEntrega pgtype.Date
	if input.FechaEntregaEstimada != "" {
		t, err := time.Parse("2006-01-02", input.FechaEntregaEstimada)
		if err != nil {
			return nil, fmt.Errorf("invalid fecha_entrega_estimada format")
		}
		fechaEntrega = pgtype.Date{Time: t, Valid: true}
	}

	// Calculate totals from items
	var subtotal float64
	for _, item := range input.Items {
		lineTotal := item.Cantidad * item.PrecioUnitario
		lineDiscount := lineTotal * (item.DescuentoPorcentaje / 100)
		subtotal += lineTotal - lineDiscount
	}

	orderDiscount := subtotal * (input.DescuentoPorcentaje / 100)
	baseImponible := subtotal - orderDiscount

	// Calculate taxes
	var totalImpuestos float64
	for _, imp := range input.Impuestos {
		totalImpuestos += baseImponible * (imp.Porcentaje / 100)
	}

	total := baseImponible + totalImpuestos

	pedido, err := qtx.CreatePedido(ctx, repository.CreatePedidoParams{
		Numero:               numero,
		ClienteID:            clienteID,
		DireccionID:          direccionID,
		SucursalID:           sucursalID,
		EmpleadoID:           empleadoID,
		Estado:               repository.EstadoPedidoPENDIENTEAPROBACION,
		CondicionPago:        repository.CondicionPago(input.CondicionPago),
		FechaEntregaEstimada: fechaEntrega,
		Subtotal:             numericFromFloat(subtotal),
		DescuentoPorcentaje:  numericFromFloat(input.DescuentoPorcentaje),
		DescuentoMonto:       numericFromFloat(orderDiscount),
		BaseImponible:        numericFromFloat(baseImponible),
		TotalImpuestos:       numericFromFloat(totalImpuestos),
		Total:                numericFromFloat(total),
		Observaciones:        pgText(input.Observaciones),
		ObservacionesInternas: pgText(input.ObservacionesInternas),
		UsuarioID:            userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create pedido: %w", err)
	}

	// Create line items with product snapshots
	for i, item := range input.Items {
		prodID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id")
		}

		// Get product snapshot
		prod, err := s.queries.GetProductoByID(ctx, repository.GetProductoByIDParams{
			ID: prodID, UsuarioID: userID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, fmt.Errorf("producto %s not found", item.ProductoID)
			}
			return nil, fmt.Errorf("get producto: %w", err)
		}

		lineTotal := item.Cantidad * item.PrecioUnitario
		lineDiscount := lineTotal * (item.DescuentoPorcentaje / 100)
		lineSubtotal := lineTotal - lineDiscount

		_, err = qtx.CreateDetallePedido(ctx, repository.CreateDetallePedidoParams{
			PedidoID:            pedido.ID,
			ProductoID:          prodID,
			ProductoNombre:      prod.Nombre,
			ProductoCodigo:      prod.Codigo,
			ProductoUnidad:      string(prod.Unidad),
			Cantidad:            numericFromFloat(item.Cantidad),
			PrecioUnitario:      numericFromFloat(item.PrecioUnitario),
			DescuentoPorcentaje: numericFromFloat(item.DescuentoPorcentaje),
			DescuentoMonto:      numericFromFloat(lineDiscount),
			Subtotal:            numericFromFloat(lineSubtotal),
			CantidadEntregada:   numericFromFloat(0),
			Orden:               int32(i),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle: %w", err)
		}
	}

	// Create tax lines
	for _, imp := range input.Impuestos {
		monto := baseImponible * (imp.Porcentaje / 100)
		_, err = qtx.CreateImpuestoPedido(ctx, repository.CreateImpuestoPedidoParams{
			PedidoID:      pedido.ID,
			Tipo:          repository.TipoImpuesto(imp.Tipo),
			Nombre:        imp.Nombre,
			Porcentaje:    numericFromFloat(imp.Porcentaje),
			BaseImponible: numericFromFloat(baseImponible),
			Monto:         numericFromFloat(monto),
		})
		if err != nil {
			return nil, fmt.Errorf("create impuesto: %w", err)
		}
	}

	// Create initial history entry
	_, err = qtx.CreateHistorialPedido(ctx, repository.CreateHistorialPedidoParams{
		PedidoID:       pedido.ID,
		EstadoAnterior: repository.NullEstadoPedido{Valid: false},
		EstadoNuevo:    repository.EstadoPedidoPENDIENTEAPROBACION,
		EmpleadoID:     empleadoID,
		Comentario:     pgText("Pedido creado"),
	})
	if err != nil {
		return nil, fmt.Errorf("create historial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetPedido(ctx, userID, uuidStrFromPg(pedido.ID))
}

func (s *OrderService) GetPedido(ctx context.Context, userID pgtype.UUID, id string) (*PedidoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPedidoNotFound
	}

	p, err := s.queries.GetPedidoByID(ctx, repository.GetPedidoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPedidoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get pedido: %w", err)
	}

	items, err := s.queries.ListDetallePedido(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalle: %w", err)
	}

	impuestos, err := s.queries.ListImpuestosPedido(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list impuestos: %w", err)
	}

	historial, err := s.queries.ListHistorialPedido(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list historial: %w", err)
	}

	resp := toPedidoDetailResponse(p)

	for _, item := range items {
		resp.Items = append(resp.Items, DetalleResponse{
			ID:                  uuidStrFromPg(item.ID),
			ProductoID:          uuidStrFromPg(item.ProductoID),
			ProductoNombre:      item.ProductoNombre,
			ProductoCodigo:      textFromPg(item.ProductoCodigo),
			ProductoUnidad:      item.ProductoUnidad,
			Cantidad:            floatFromNumeric(item.Cantidad),
			PrecioUnitario:      floatFromNumeric(item.PrecioUnitario),
			DescuentoPorcentaje: floatFromNumeric(item.DescuentoPorcentaje),
			DescuentoMonto:      floatFromNumeric(item.DescuentoMonto),
			Subtotal:            floatFromNumeric(item.Subtotal),
			CantidadEntregada:   floatFromNumeric(item.CantidadEntregada),
			Orden:               item.Orden,
		})
	}
	if resp.Items == nil {
		resp.Items = []DetalleResponse{}
	}

	for _, imp := range impuestos {
		resp.Impuestos = append(resp.Impuestos, ImpuestoResponse{
			ID:            uuidStrFromPg(imp.ID),
			Tipo:          string(imp.Tipo),
			Nombre:        imp.Nombre,
			Porcentaje:    floatFromNumeric(imp.Porcentaje),
			BaseImponible: floatFromNumeric(imp.BaseImponible),
			Monto:         floatFromNumeric(imp.Monto),
		})
	}
	if resp.Impuestos == nil {
		resp.Impuestos = []ImpuestoResponse{}
	}

	for _, h := range historial {
		hr := HistorialResponse{
			ID:             uuidStrFromPg(h.ID),
			EstadoNuevo:    string(h.EstadoNuevo),
			EmpleadoID:     uuidStrFromPg(h.EmpleadoID),
			EmpleadoNombre: textFromPg(h.EmpleadoNombre),
			Comentario:     textFromPg(h.Comentario),
			CreatedAt:      h.CreatedAt.Time.Format(time.RFC3339),
		}
		if h.EstadoAnterior.Valid {
			hr.EstadoAnterior = string(h.EstadoAnterior.EstadoPedido)
		}
		if h.EmpleadoNombre.Valid && h.EmpleadoApellido.Valid {
			hr.EmpleadoNombre = h.EmpleadoNombre.String + " " + h.EmpleadoApellido.String
		}
		resp.Historial = append(resp.Historial, hr)
	}
	if resp.Historial == nil {
		resp.Historial = []HistorialResponse{}
	}

	return resp, nil
}

func (s *OrderService) ListPedidos(ctx context.Context, userID pgtype.UUID, search, estado string, limit, offset int32) ([]PedidoListResponse, int, error) {
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchPedidos(ctx, repository.SearchPedidosParams{
			UsuarioID: userID, Numero: searchPattern, Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search pedidos: %w", err)
		}
		count, err := s.queries.CountSearchPedidos(ctx, repository.CountSearchPedidosParams{
			UsuarioID: userID, Numero: searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search pedidos: %w", err)
		}
		result := make([]PedidoListResponse, 0, len(items))
		for _, p := range items {
			result = append(result, toPedidoListFromSearch(p))
		}
		return result, int(count), nil
	}

	if estado != "" {
		items, err := s.queries.ListPedidosByEstado(ctx, repository.ListPedidosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoPedido(estado), Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list pedidos by estado: %w", err)
		}
		count, err := s.queries.CountPedidosByEstado(ctx, repository.CountPedidosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoPedido(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count pedidos by estado: %w", err)
		}
		result := make([]PedidoListResponse, 0, len(items))
		for _, p := range items {
			result = append(result, toPedidoListFromEstado(p))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListPedidos(ctx, repository.ListPedidosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list pedidos: %w", err)
	}
	count, err := s.queries.CountPedidos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count pedidos: %w", err)
	}
	result := make([]PedidoListResponse, 0, len(items))
	for _, p := range items {
		result = append(result, toPedidoListFromList(p))
	}
	return result, int(count), nil
}

func (s *OrderService) UpdatePedido(ctx context.Context, userID pgtype.UUID, id string, input CreatePedidoInput) (*PedidoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPedidoNotFound
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	var direccionID pgtype.UUID
	if input.DireccionID != "" {
		direccionID, err = pgUUID(input.DireccionID)
		if err != nil {
			return nil, fmt.Errorf("invalid direccion_id")
		}
	}

	var empleadoID pgtype.UUID
	if input.EmpleadoID != "" {
		empleadoID, err = pgUUID(input.EmpleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	var fechaEntrega pgtype.Date
	if input.FechaEntregaEstimada != "" {
		t, err := time.Parse("2006-01-02", input.FechaEntregaEstimada)
		if err != nil {
			return nil, fmt.Errorf("invalid fecha_entrega_estimada format")
		}
		fechaEntrega = pgtype.Date{Time: t, Valid: true}
	}

	// Recalculate totals
	var subtotal float64
	for _, item := range input.Items {
		lineTotal := item.Cantidad * item.PrecioUnitario
		lineDiscount := lineTotal * (item.DescuentoPorcentaje / 100)
		subtotal += lineTotal - lineDiscount
	}
	orderDiscount := subtotal * (input.DescuentoPorcentaje / 100)
	baseImponible := subtotal - orderDiscount

	var totalImpuestos float64
	for _, imp := range input.Impuestos {
		totalImpuestos += baseImponible * (imp.Porcentaje / 100)
	}
	total := baseImponible + totalImpuestos

	_, err = qtx.UpdatePedido(ctx, repository.UpdatePedidoParams{
		ID:                    pgID,
		UsuarioID:             userID,
		ClienteID:             clienteID,
		DireccionID:           direccionID,
		SucursalID:            sucursalID,
		EmpleadoID:            empleadoID,
		CondicionPago:         repository.CondicionPago(input.CondicionPago),
		FechaEntregaEstimada:  fechaEntrega,
		Subtotal:              numericFromFloat(subtotal),
		DescuentoPorcentaje:   numericFromFloat(input.DescuentoPorcentaje),
		DescuentoMonto:        numericFromFloat(orderDiscount),
		BaseImponible:         numericFromFloat(baseImponible),
		TotalImpuestos:        numericFromFloat(totalImpuestos),
		Total:                 numericFromFloat(total),
		Observaciones:         pgText(input.Observaciones),
		ObservacionesInternas: pgText(input.ObservacionesInternas),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPedidoNotEditable
	}
	if err != nil {
		return nil, fmt.Errorf("update pedido: %w", err)
	}

	// Replace items
	if err := qtx.DeleteDetallePedidoByPedido(ctx, pgID); err != nil {
		return nil, fmt.Errorf("delete detalle: %w", err)
	}
	for i, item := range input.Items {
		prodID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id")
		}
		prod, err := s.queries.GetProductoByID(ctx, repository.GetProductoByIDParams{
			ID: prodID, UsuarioID: userID,
		})
		if err != nil {
			return nil, fmt.Errorf("get producto: %w", err)
		}

		lineTotal := item.Cantidad * item.PrecioUnitario
		lineDiscount := lineTotal * (item.DescuentoPorcentaje / 100)
		lineSubtotal := lineTotal - lineDiscount

		_, err = qtx.CreateDetallePedido(ctx, repository.CreateDetallePedidoParams{
			PedidoID:            pgID,
			ProductoID:          prodID,
			ProductoNombre:      prod.Nombre,
			ProductoCodigo:      prod.Codigo,
			ProductoUnidad:      string(prod.Unidad),
			Cantidad:            numericFromFloat(item.Cantidad),
			PrecioUnitario:      numericFromFloat(item.PrecioUnitario),
			DescuentoPorcentaje: numericFromFloat(item.DescuentoPorcentaje),
			DescuentoMonto:      numericFromFloat(lineDiscount),
			Subtotal:            numericFromFloat(lineSubtotal),
			CantidadEntregada:   numericFromFloat(0),
			Orden:               int32(i),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle: %w", err)
		}
	}

	// Replace taxes
	if err := qtx.DeleteImpuestosPedidoByPedido(ctx, pgID); err != nil {
		return nil, fmt.Errorf("delete impuestos: %w", err)
	}
	for _, imp := range input.Impuestos {
		monto := baseImponible * (imp.Porcentaje / 100)
		_, err = qtx.CreateImpuestoPedido(ctx, repository.CreateImpuestoPedidoParams{
			PedidoID:      pgID,
			Tipo:          repository.TipoImpuesto(imp.Tipo),
			Nombre:        imp.Nombre,
			Porcentaje:    numericFromFloat(imp.Porcentaje),
			BaseImponible: numericFromFloat(baseImponible),
			Monto:         numericFromFloat(monto),
		})
		if err != nil {
			return nil, fmt.Errorf("create impuesto: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetPedido(ctx, userID, id)
}

func (s *OrderService) TransitionEstado(ctx context.Context, userID pgtype.UUID, id, role string, input UpdateEstadoInput) (*PedidoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPedidoNotFound
	}

	// Get current order
	pedido, err := s.queries.GetPedidoByID(ctx, repository.GetPedidoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPedidoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get pedido: %w", err)
	}

	currentState := string(pedido.Estado)
	newState := input.Estado

	if err := validateTransition(currentState, newState, role); err != nil {
		return nil, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	_, err = qtx.UpdatePedidoEstado(ctx, repository.UpdatePedidoEstadoParams{
		ID: pgID, UsuarioID: userID,
		Estado: repository.EstadoPedido(newState),
	})
	if err != nil {
		return nil, fmt.Errorf("update estado: %w", err)
	}

	// Set delivery date on ENTREGADO
	if newState == "ENTREGADO" {
		_ = qtx.UpdatePedidoFechaEntregaReal(ctx, repository.UpdatePedidoFechaEntregaRealParams{
			ID: pgID, UsuarioID: userID,
		})
	}

	var empID pgtype.UUID
	if input.EmpleadoID != "" {
		empID, _ = pgUUID(input.EmpleadoID)
	}

	_, err = qtx.CreateHistorialPedido(ctx, repository.CreateHistorialPedidoParams{
		PedidoID: pgID,
		EstadoAnterior: repository.NullEstadoPedido{
			EstadoPedido: repository.EstadoPedido(currentState),
			Valid:        true,
		},
		EstadoNuevo: repository.EstadoPedido(newState),
		EmpleadoID:  empID,
		Comentario:  pgText(input.Comentario),
	})
	if err != nil {
		return nil, fmt.Errorf("create historial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetPedido(ctx, userID, id)
}

func (s *OrderService) GetHistorial(ctx context.Context, userID pgtype.UUID, id string) ([]HistorialResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPedidoNotFound
	}

	// Verify order exists and belongs to user
	_, err = s.queries.GetPedidoByID(ctx, repository.GetPedidoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPedidoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get pedido: %w", err)
	}

	historial, err := s.queries.ListHistorialPedido(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list historial: %w", err)
	}

	result := make([]HistorialResponse, 0, len(historial))
	for _, h := range historial {
		hr := HistorialResponse{
			ID:             uuidStrFromPg(h.ID),
			EstadoNuevo:    string(h.EstadoNuevo),
			EmpleadoID:     uuidStrFromPg(h.EmpleadoID),
			EmpleadoNombre: textFromPg(h.EmpleadoNombre),
			Comentario:     textFromPg(h.Comentario),
			CreatedAt:      h.CreatedAt.Time.Format(time.RFC3339),
		}
		if h.EstadoAnterior.Valid {
			hr.EstadoAnterior = string(h.EstadoAnterior.EstadoPedido)
		}
		if h.EmpleadoNombre.Valid && h.EmpleadoApellido.Valid {
			hr.EmpleadoNombre = h.EmpleadoNombre.String + " " + h.EmpleadoApellido.String
		}
		result = append(result, hr)
	}
	return result, nil
}

func (s *OrderService) DeletePedido(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrPedidoNotFound
	}
	return s.queries.SoftDeletePedido(ctx, repository.SoftDeletePedidoParams{
		ID: pgID, UsuarioID: userID,
	})
}

// --- Mapping helpers ---

func toPedidoDetailResponse(p repository.GetPedidoByIDRow) *PedidoDetailResponse {
	resp := &PedidoDetailResponse{
		ID:                    uuidStrFromPg(p.ID),
		Numero:                p.Numero,
		ClienteID:             uuidStrFromPg(p.ClienteID),
		ClienteNombre:         p.ClienteNombre,
		ClienteApellido:       textFromPg(p.ClienteApellido),
		ClienteCuit:           textFromPg(p.ClienteCuit),
		DireccionID:           uuidStrFromPg(p.DireccionID),
		SucursalID:            uuidStrFromPg(p.SucursalID),
		SucursalNombre:        p.SucursalNombre,
		EmpleadoID:            uuidStrFromPg(p.EmpleadoID),
		EmpleadoNombre:        textFromPg(p.EmpleadoNombre),
		Estado:                string(p.Estado),
		CondicionPago:         string(p.CondicionPago),
		FechaPedido:           p.FechaPedido.Time.Format(time.RFC3339),
		Subtotal:              floatFromNumeric(p.Subtotal),
		DescuentoPorcentaje:   floatFromNumeric(p.DescuentoPorcentaje),
		DescuentoMonto:        floatFromNumeric(p.DescuentoMonto),
		BaseImponible:         floatFromNumeric(p.BaseImponible),
		TotalImpuestos:        floatFromNumeric(p.TotalImpuestos),
		Total:                 floatFromNumeric(p.Total),
		Observaciones:         textFromPg(p.Observaciones),
		ObservacionesInternas: textFromPg(p.ObservacionesInternas),
	}
	if p.FechaEntregaEstimada.Valid {
		resp.FechaEntregaEstimada = p.FechaEntregaEstimada.Time.Format("2006-01-02")
	}
	if p.FechaEntregaReal.Valid {
		resp.FechaEntregaReal = p.FechaEntregaReal.Time.Format(time.RFC3339)
	}
	if p.EmpleadoNombre.Valid && p.EmpleadoApellido.Valid {
		resp.EmpleadoNombre = p.EmpleadoNombre.String + " " + p.EmpleadoApellido.String
	}
	return resp
}

func pedidoListBase(numero string, clienteID pgtype.UUID, clienteNombre string, clienteApellido pgtype.Text, sucursalID pgtype.UUID, sucursalNombre string, estado repository.EstadoPedido, condicionPago repository.CondicionPago, fechaPedido pgtype.Timestamptz, fechaEntregaEstimada pgtype.Date, subtotal, total pgtype.Numeric) PedidoListResponse {
	r := PedidoListResponse{
		Numero:         numero,
		ClienteID:      uuidStrFromPg(clienteID),
		ClienteNombre:  clienteNombre,
		SucursalID:     uuidStrFromPg(sucursalID),
		SucursalNombre: sucursalNombre,
		Estado:         string(estado),
		CondicionPago:  string(condicionPago),
		FechaPedido:    fechaPedido.Time.Format(time.RFC3339),
		Subtotal:       floatFromNumeric(subtotal),
		Total:          floatFromNumeric(total),
	}
	if clienteApellido.Valid && clienteApellido.String != "" {
		r.ClienteNombre = clienteApellido.String + ", " + clienteNombre
	}
	if fechaEntregaEstimada.Valid {
		r.FechaEntregaEstimada = fechaEntregaEstimada.Time.Format("2006-01-02")
	}
	return r
}

func toPedidoListFromList(p repository.ListPedidosRow) PedidoListResponse {
	r := pedidoListBase(p.Numero, p.ClienteID, p.ClienteNombre, p.ClienteApellido, p.SucursalID, p.SucursalNombre, p.Estado, p.CondicionPago, p.FechaPedido, p.FechaEntregaEstimada, p.Subtotal, p.Total)
	r.ID = uuidStrFromPg(p.ID)
	return r
}

func toPedidoListFromSearch(p repository.SearchPedidosRow) PedidoListResponse {
	r := pedidoListBase(p.Numero, p.ClienteID, p.ClienteNombre, p.ClienteApellido, p.SucursalID, p.SucursalNombre, p.Estado, p.CondicionPago, p.FechaPedido, p.FechaEntregaEstimada, p.Subtotal, p.Total)
	r.ID = uuidStrFromPg(p.ID)
	return r
}

func toPedidoListFromEstado(p repository.ListPedidosByEstadoRow) PedidoListResponse {
	r := pedidoListBase(p.Numero, p.ClienteID, p.ClienteNombre, p.ClienteApellido, p.SucursalID, p.SucursalNombre, p.Estado, p.CondicionPago, p.FechaPedido, p.FechaEntregaEstimada, p.Subtotal, p.Total)
	r.ID = uuidStrFromPg(p.ID)
	return r
}
