package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

var (
	ErrOrdenCompraNotFound          = errors.New("orden de compra not found")
	ErrOrdenCompraNotEditable       = errors.New("orden de compra is not in editable state")
	ErrInvalidOrdenCompraTransition = errors.New("invalid orden de compra state transition")
)

// State machine for purchase orders
var ordenCompraTransitions = map[repository.EstadoOrdenCompra][]repository.EstadoOrdenCompra{
	repository.EstadoOrdenCompraBORRADOR:              {repository.EstadoOrdenCompraAPROBADA, repository.EstadoOrdenCompraCANCELADA},
	repository.EstadoOrdenCompraAPROBADA:              {repository.EstadoOrdenCompraENRECEPCION, repository.EstadoOrdenCompraCANCELADA},
	repository.EstadoOrdenCompraENRECEPCION:           {repository.EstadoOrdenCompraRECIBIDA, repository.EstadoOrdenCompraRECIBIDAPARCIALMENTE, repository.EstadoOrdenCompraCANCELADA},
	repository.EstadoOrdenCompraRECIBIDAPARCIALMENTE:  {repository.EstadoOrdenCompraENRECEPCION, repository.EstadoOrdenCompraRECIBIDA},
	repository.EstadoOrdenCompraRECIBIDA:              {},
	repository.EstadoOrdenCompraCANCELADA:             {},
}

type PurchaseService struct {
	db       *pgxpool.Pool
	queries  *repository.Queries
	stockSvc *StockService
}

func NewPurchaseService(db *pgxpool.Pool, stockSvc *StockService) *PurchaseService {
	return &PurchaseService{
		db:       db,
		queries:  repository.New(db),
		stockSvc: stockSvc,
	}
}

// --- Response DTOs ---

type OrdenCompraListResponse struct {
	ID                   string  `json:"id"`
	Numero               string  `json:"numero"`
	ProveedorID          string  `json:"proveedor_id"`
	ProveedorNombre      string  `json:"proveedor_nombre"`
	SucursalID           string  `json:"sucursal_id"`
	SucursalNombre       string  `json:"sucursal_nombre"`
	Estado               string  `json:"estado"`
	CondicionPago        string  `json:"condicion_pago"`
	FechaOrden           string  `json:"fecha_orden"`
	FechaEntregaEstimada string  `json:"fecha_entrega_estimada,omitempty"`
	Subtotal             float64 `json:"subtotal"`
	Total                float64 `json:"total"`
	CreatedAt            string  `json:"created_at"`
}

type OrdenCompraDetailResponse struct {
	ID                   string                          `json:"id"`
	Numero               string                          `json:"numero"`
	ProveedorID          string                          `json:"proveedor_id"`
	ProveedorNombre      string                          `json:"proveedor_nombre"`
	SucursalID           string                          `json:"sucursal_id"`
	SucursalNombre       string                          `json:"sucursal_nombre"`
	Estado               string                          `json:"estado"`
	CondicionPago        string                          `json:"condicion_pago"`
	FechaOrden           string                          `json:"fecha_orden"`
	FechaEntregaEstimada string                          `json:"fecha_entrega_estimada,omitempty"`
	Subtotal             float64                         `json:"subtotal"`
	DescuentoPorcentaje  float64                         `json:"descuento_porcentaje"`
	DescuentoMonto       float64                         `json:"descuento_monto"`
	BaseImponible        float64                         `json:"base_imponible"`
	TotalImpuestos       float64                         `json:"total_impuestos"`
	Total                float64                         `json:"total"`
	Observaciones        string                          `json:"observaciones,omitempty"`
	CreatedAt            string                          `json:"created_at"`
	Items                []DetalleOrdenCompraResponse    `json:"items"`
	Impuestos            []ImpuestoOrdenCompraResponse   `json:"impuestos"`
	Historial            []HistorialOrdenCompraResponse  `json:"historial"`
}

type DetalleOrdenCompraResponse struct {
	ID                  string  `json:"id"`
	ProductoID          string  `json:"producto_id"`
	ProductoNombre      string  `json:"producto_nombre"`
	ProductoCodigo      string  `json:"producto_codigo,omitempty"`
	ProductoUnidad      string  `json:"producto_unidad"`
	Cantidad            float64 `json:"cantidad"`
	CantidadRecibida    float64 `json:"cantidad_recibida"`
	PrecioUnitario      float64 `json:"precio_unitario"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
	DescuentoMonto      float64 `json:"descuento_monto"`
	Subtotal            float64 `json:"subtotal"`
	Orden               int32   `json:"orden"`
}

type ImpuestoOrdenCompraResponse struct {
	ID            string  `json:"id"`
	Tipo          string  `json:"tipo"`
	Nombre        string  `json:"nombre"`
	Porcentaje    float64 `json:"porcentaje"`
	BaseImponible float64 `json:"base_imponible"`
	Monto         float64 `json:"monto"`
}

type HistorialOrdenCompraResponse struct {
	ID             string `json:"id"`
	EstadoAnterior string `json:"estado_anterior,omitempty"`
	EstadoNuevo    string `json:"estado_nuevo"`
	EmpleadoID     string `json:"empleado_id,omitempty"`
	EmpleadoNombre string `json:"empleado_nombre,omitempty"`
	Comentario     string `json:"comentario,omitempty"`
	CreatedAt      string `json:"created_at"`
}

// --- Input DTOs ---

type CreateOrdenCompraInput struct {
	ProveedorID          string                   `json:"proveedor_id" validate:"required,uuid"`
	SucursalID           string                   `json:"sucursal_id" validate:"required,uuid"`
	CondicionPago        string                   `json:"condicion_pago" validate:"required,oneof=CONTADO CUENTA_CORRIENTE CHEQUE TRANSFERENCIA OTRO"`
	FechaEntregaEstimada string                   `json:"fecha_entrega_estimada"`
	DescuentoPorcentaje  float64                  `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
	Observaciones        string                   `json:"observaciones"`
	Items                []OrdenCompraItemInput   `json:"items" validate:"required,min=1,dive"`
	Impuestos            []PurchaseImpuestoInput  `json:"impuestos" validate:"dive"`
}

type OrdenCompraItemInput struct {
	ProductoID          string  `json:"producto_id" validate:"required,uuid"`
	Cantidad            float64 `json:"cantidad" validate:"required,gt=0"`
	PrecioUnitario      float64 `json:"precio_unitario" validate:"gte=0"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
}

type PurchaseImpuestoInput struct {
	Tipo       string  `json:"tipo" validate:"required,oneof=IVA IIBB PERCEPCION_IVA PERCEPCION_IIBB OTRO"`
	Nombre     string  `json:"nombre" validate:"required,min=1,max=100"`
	Porcentaje float64 `json:"porcentaje" validate:"gte=0"`
}

type UpdateOrdenCompraEstadoInput struct {
	Estado     string `json:"estado" validate:"required"`
	EmpleadoID string `json:"empleado_id"`
	Comentario string `json:"comentario"`
}

type ReceiveInput struct {
	Items []ReceiveItemInput `json:"items" validate:"required,min=1,dive"`
}

type ReceiveItemInput struct {
	DetalleID        string  `json:"detalle_id" validate:"required,uuid"`
	CantidadRecibida float64 `json:"cantidad_recibida" validate:"required,gte=0"`
}

// --- Purchase Order CRUD ---

func (s *PurchaseService) CreateOrdenCompra(ctx context.Context, userID pgtype.UUID, input CreateOrdenCompraInput) (*OrdenCompraDetailResponse, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// Generate order number
	seq, err := qtx.NextOrdenCompraNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next orden compra numero: %w", err)
	}
	numero := fmt.Sprintf("OC-%06d", seq)

	proveedorID, err := pgUUID(input.ProveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
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

	orden, err := qtx.CreateOrdenCompra(ctx, repository.CreateOrdenCompraParams{
		Numero:               numero,
		ProveedorID:          proveedorID,
		SucursalID:           sucursalID,
		Estado:               repository.EstadoOrdenCompraBORRADOR,
		CondicionPago:        repository.CondicionPago(input.CondicionPago),
		FechaEntregaEstimada: fechaEntrega,
		Subtotal:             numericFromFloat(subtotal),
		DescuentoPorcentaje:  numericFromFloat(input.DescuentoPorcentaje),
		DescuentoMonto:       numericFromFloat(orderDiscount),
		BaseImponible:        numericFromFloat(baseImponible),
		TotalImpuestos:       numericFromFloat(totalImpuestos),
		Total:                numericFromFloat(total),
		Observaciones:        pgText(input.Observaciones),
		UsuarioID:            userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create orden compra: %w", err)
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

		_, err = qtx.CreateDetalleOrdenCompra(ctx, repository.CreateDetalleOrdenCompraParams{
			OrdenCompraID:       orden.ID,
			ProductoID:          prodID,
			ProductoNombre:      prod.Nombre,
			ProductoCodigo:      prod.Codigo,
			Cantidad:            numericFromFloat(item.Cantidad),
			CantidadRecibida:    numericFromFloat(0),
			PrecioUnitario:      numericFromFloat(item.PrecioUnitario),
			DescuentoPorcentaje: numericFromFloat(item.DescuentoPorcentaje),
			DescuentoMonto:      numericFromFloat(lineDiscount),
			Subtotal:            numericFromFloat(lineSubtotal),
			Orden:               int32(i),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle: %w", err)
		}
	}

	// Create tax lines
	for _, imp := range input.Impuestos {
		monto := baseImponible * (imp.Porcentaje / 100)
		_, err = qtx.CreateImpuestoOrdenCompra(ctx, repository.CreateImpuestoOrdenCompraParams{
			OrdenCompraID: orden.ID,
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
	_, err = qtx.CreateHistorialOrdenCompra(ctx, repository.CreateHistorialOrdenCompraParams{
		OrdenCompraID:  orden.ID,
		EstadoAnterior: repository.NullEstadoOrdenCompra{Valid: false},
		EstadoNuevo:    repository.EstadoOrdenCompraBORRADOR,
		EmpleadoID:     pgtype.UUID{},
		Comentario:     pgText("Orden de compra creada"),
	})
	if err != nil {
		return nil, fmt.Errorf("create historial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetOrdenCompra(ctx, userID, uuidStrFromPg(orden.ID))
}

func (s *PurchaseService) GetOrdenCompra(ctx context.Context, userID pgtype.UUID, id string) (*OrdenCompraDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrOrdenCompraNotFound
	}

	oc, err := s.queries.GetOrdenCompraByID(ctx, repository.GetOrdenCompraByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOrdenCompraNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get orden compra: %w", err)
	}

	items, err := s.queries.ListDetalleOrdenCompra(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalle: %w", err)
	}

	impuestos, err := s.queries.ListImpuestosOrdenCompra(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list impuestos: %w", err)
	}

	historial, err := s.queries.ListHistorialOrdenCompra(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list historial: %w", err)
	}

	resp := toOrdenCompraDetailResponse(oc)

	for _, item := range items {
		resp.Items = append(resp.Items, DetalleOrdenCompraResponse{
			ID:                  uuidStrFromPg(item.ID),
			ProductoID:          uuidStrFromPg(item.ProductoID),
			ProductoNombre:      item.ProductoNombre,
			ProductoCodigo:      textFromPg(item.ProductoCodigo),
			ProductoUnidad:      string(item.ProductoUnidad),
			Cantidad:            floatFromNumeric(item.Cantidad),
			CantidadRecibida:    floatFromNumeric(item.CantidadRecibida),
			PrecioUnitario:      floatFromNumeric(item.PrecioUnitario),
			DescuentoPorcentaje: floatFromNumeric(item.DescuentoPorcentaje),
			DescuentoMonto:      floatFromNumeric(item.DescuentoMonto),
			Subtotal:            floatFromNumeric(item.Subtotal),
			Orden:               item.Orden,
		})
	}
	if resp.Items == nil {
		resp.Items = []DetalleOrdenCompraResponse{}
	}

	for _, imp := range impuestos {
		resp.Impuestos = append(resp.Impuestos, ImpuestoOrdenCompraResponse{
			ID:            uuidStrFromPg(imp.ID),
			Tipo:          string(imp.Tipo),
			Nombre:        imp.Nombre,
			Porcentaje:    floatFromNumeric(imp.Porcentaje),
			BaseImponible: floatFromNumeric(imp.BaseImponible),
			Monto:         floatFromNumeric(imp.Monto),
		})
	}
	if resp.Impuestos == nil {
		resp.Impuestos = []ImpuestoOrdenCompraResponse{}
	}

	for _, h := range historial {
		hr := HistorialOrdenCompraResponse{
			ID:             uuidStrFromPg(h.ID),
			EstadoNuevo:    string(h.EstadoNuevo),
			EmpleadoID:     uuidStrFromPg(h.EmpleadoID),
			EmpleadoNombre: textFromPg(h.EmpleadoNombre),
			Comentario:     textFromPg(h.Comentario),
			CreatedAt:      h.CreatedAt.Time.Format(time.RFC3339),
		}
		if h.EstadoAnterior.Valid {
			hr.EstadoAnterior = string(h.EstadoAnterior.EstadoOrdenCompra)
		}
		if h.EmpleadoNombre.Valid && h.EmpleadoApellido.Valid {
			hr.EmpleadoNombre = h.EmpleadoNombre.String + " " + h.EmpleadoApellido.String
		}
		resp.Historial = append(resp.Historial, hr)
	}
	if resp.Historial == nil {
		resp.Historial = []HistorialOrdenCompraResponse{}
	}

	return resp, nil
}

func (s *PurchaseService) ListOrdenesCompra(ctx context.Context, userID pgtype.UUID, search, estado string, limit, offset int32) ([]OrdenCompraListResponse, int, error) {
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchOrdenesCompra(ctx, repository.SearchOrdenesCompraParams{
			UsuarioID: userID, Numero: searchPattern, Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search ordenes compra: %w", err)
		}
		count, err := s.queries.CountSearchOrdenesCompra(ctx, repository.CountSearchOrdenesCompraParams{
			UsuarioID: userID, Numero: searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search ordenes compra: %w", err)
		}
		result := make([]OrdenCompraListResponse, 0, len(items))
		for _, p := range items {
			result = append(result, toOrdenCompraListFromSearch(p))
		}
		return result, int(count), nil
	}

	if estado != "" {
		items, err := s.queries.ListOrdenesCompraByEstado(ctx, repository.ListOrdenesCompraByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoOrdenCompra(estado), Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list ordenes compra by estado: %w", err)
		}
		count, err := s.queries.CountOrdenesCompraByEstado(ctx, repository.CountOrdenesCompraByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoOrdenCompra(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count ordenes compra by estado: %w", err)
		}
		result := make([]OrdenCompraListResponse, 0, len(items))
		for _, p := range items {
			result = append(result, toOrdenCompraListFromEstado(p))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListOrdenesCompra(ctx, repository.ListOrdenesCompraParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list ordenes compra: %w", err)
	}
	count, err := s.queries.CountOrdenesCompra(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count ordenes compra: %w", err)
	}
	result := make([]OrdenCompraListResponse, 0, len(items))
	for _, p := range items {
		result = append(result, toOrdenCompraListFromList(p))
	}
	return result, int(count), nil
}

func (s *PurchaseService) UpdateOrdenCompra(ctx context.Context, userID pgtype.UUID, id string, input CreateOrdenCompraInput) (*OrdenCompraDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrOrdenCompraNotFound
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	proveedorID, err := pgUUID(input.ProveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
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

	_, err = qtx.UpdateOrdenCompra(ctx, repository.UpdateOrdenCompraParams{
		ID:                   pgID,
		UsuarioID:            userID,
		ProveedorID:          proveedorID,
		SucursalID:           sucursalID,
		CondicionPago:        repository.CondicionPago(input.CondicionPago),
		FechaEntregaEstimada: fechaEntrega,
		Subtotal:             numericFromFloat(subtotal),
		DescuentoPorcentaje:  numericFromFloat(input.DescuentoPorcentaje),
		DescuentoMonto:       numericFromFloat(orderDiscount),
		BaseImponible:        numericFromFloat(baseImponible),
		TotalImpuestos:       numericFromFloat(totalImpuestos),
		Total:                numericFromFloat(total),
		Observaciones:        pgText(input.Observaciones),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOrdenCompraNotEditable
	}
	if err != nil {
		return nil, fmt.Errorf("update orden compra: %w", err)
	}

	// Replace items
	if err := qtx.DeleteDetalleOrdenCompra(ctx, pgID); err != nil {
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

		_, err = qtx.CreateDetalleOrdenCompra(ctx, repository.CreateDetalleOrdenCompraParams{
			OrdenCompraID:       pgID,
			ProductoID:          prodID,
			ProductoNombre:      prod.Nombre,
			ProductoCodigo:      prod.Codigo,
			Cantidad:            numericFromFloat(item.Cantidad),
			CantidadRecibida:    numericFromFloat(0),
			PrecioUnitario:      numericFromFloat(item.PrecioUnitario),
			DescuentoPorcentaje: numericFromFloat(item.DescuentoPorcentaje),
			DescuentoMonto:      numericFromFloat(lineDiscount),
			Subtotal:            numericFromFloat(lineSubtotal),
			Orden:               int32(i),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle: %w", err)
		}
	}

	// Replace taxes
	if err := qtx.DeleteImpuestosOrdenCompra(ctx, pgID); err != nil {
		return nil, fmt.Errorf("delete impuestos: %w", err)
	}
	for _, imp := range input.Impuestos {
		monto := baseImponible * (imp.Porcentaje / 100)
		_, err = qtx.CreateImpuestoOrdenCompra(ctx, repository.CreateImpuestoOrdenCompraParams{
			OrdenCompraID: pgID,
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

	return s.GetOrdenCompra(ctx, userID, id)
}

func (s *PurchaseService) DeleteOrdenCompra(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrOrdenCompraNotFound
	}
	return s.queries.SoftDeleteOrdenCompra(ctx, repository.SoftDeleteOrdenCompraParams{
		ID: pgID, UsuarioID: userID,
	})
}

func (s *PurchaseService) TransitionEstado(ctx context.Context, userID pgtype.UUID, id string, input UpdateOrdenCompraEstadoInput) (*OrdenCompraDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrOrdenCompraNotFound
	}

	// Get current order
	orden, err := s.queries.GetOrdenCompraByID(ctx, repository.GetOrdenCompraByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOrdenCompraNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get orden compra: %w", err)
	}

	currentState := repository.EstadoOrdenCompra(orden.Estado)
	newState := repository.EstadoOrdenCompra(input.Estado)

	// Validate transition using state machine
	allowed, ok := ordenCompraTransitions[currentState]
	if !ok {
		return nil, ErrInvalidOrdenCompraTransition
	}
	valid := false
	for _, s := range allowed {
		if s == newState {
			valid = true
			break
		}
	}
	if !valid {
		return nil, ErrInvalidOrdenCompraTransition
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	_, err = qtx.UpdateOrdenCompraEstado(ctx, repository.UpdateOrdenCompraEstadoParams{
		ID:        pgID,
		UsuarioID: userID,
		Estado:    newState,
	})
	if err != nil {
		return nil, fmt.Errorf("update estado: %w", err)
	}

	var empID pgtype.UUID
	if input.EmpleadoID != "" {
		empID, _ = pgUUID(input.EmpleadoID)
	}

	_, err = qtx.CreateHistorialOrdenCompra(ctx, repository.CreateHistorialOrdenCompraParams{
		OrdenCompraID: pgID,
		EstadoAnterior: repository.NullEstadoOrdenCompra{
			EstadoOrdenCompra: currentState,
			Valid:             true,
		},
		EstadoNuevo: newState,
		EmpleadoID:  empID,
		Comentario:  pgText(input.Comentario),
	})
	if err != nil {
		return nil, fmt.Errorf("create historial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetOrdenCompra(ctx, userID, id)
}

func (s *PurchaseService) ReceiveOrdenCompra(ctx context.Context, userID pgtype.UUID, id string, input ReceiveInput) (*OrdenCompraDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrOrdenCompraNotFound
	}

	// Get current order
	orden, err := s.queries.GetOrdenCompraByID(ctx, repository.GetOrdenCompraByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOrdenCompraNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get orden compra: %w", err)
	}

	// Validate order is in a receivable state
	currentState := repository.EstadoOrdenCompra(orden.Estado)
	if currentState != repository.EstadoOrdenCompraAPROBADA && currentState != repository.EstadoOrdenCompraENRECEPCION {
		return nil, ErrInvalidOrdenCompraTransition
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// Load current line items
	items, err := qtx.ListDetalleOrdenCompra(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalle: %w", err)
	}

	// Build map of detalle_id -> line item for quick lookup
	type lineItem struct {
		ID               pgtype.UUID
		ProductoID       pgtype.UUID
		Cantidad         float64
		CantidadRecibida float64
	}
	lineMap := make(map[string]lineItem, len(items))
	for _, item := range items {
		lineMap[uuidStrFromPg(item.ID)] = lineItem{
			ID:               item.ID,
			ProductoID:       item.ProductoID,
			Cantidad:         floatFromNumeric(item.Cantidad),
			CantidadRecibida: floatFromNumeric(item.CantidadRecibida),
		}
	}

	orderIDStr := uuidStrFromPg(pgID)
	sucursalIDStr := uuidStrFromPg(orden.SucursalID)

	// Process each receive item
	for _, ri := range input.Items {
		line, ok := lineMap[ri.DetalleID]
		if !ok {
			return nil, fmt.Errorf("detalle %s not found in orden compra", ri.DetalleID)
		}

		// Calculate how much new quantity is being received
		newReceivedTotal := line.CantidadRecibida + ri.CantidadRecibida
		if newReceivedTotal > line.Cantidad {
			newReceivedTotal = line.Cantidad
		}

		// Update cantidad_recibida on the line item
		detalleID, _ := pgUUID(ri.DetalleID)
		err = qtx.UpdateDetalleRecibida(ctx, repository.UpdateDetalleRecibidaParams{
			ID:               detalleID,
			CantidadRecibida: numericFromFloat(newReceivedTotal),
		})
		if err != nil {
			return nil, fmt.Errorf("update cantidad recibida: %w", err)
		}

		// Create stock movement for the quantity being received
		if ri.CantidadRecibida > 0 {
			_, err = s.stockSvc.RecordMovementInTx(ctx, qtx, userID, RecordMovementInput{
				Tipo:           "COMPRA",
				Cantidad:       int(ri.CantidadRecibida),
				SucursalID:     sucursalIDStr,
				ProductoID:     uuidStrFromPg(line.ProductoID),
				ReferenciaID:   orderIDStr,
				ReferenciaTipo: "ORDEN_COMPRA",
				Motivo:         fmt.Sprintf("Recepción de compra %s", orden.Numero),
			})
			if err != nil {
				return nil, fmt.Errorf("record stock movement: %w", err)
			}
		}

		// Update local map for final state calculation
		lineMap[ri.DetalleID] = lineItem{
			ID:               line.ID,
			ProductoID:       line.ProductoID,
			Cantidad:         line.Cantidad,
			CantidadRecibida: newReceivedTotal,
		}
	}

	// Determine final state based on all line items
	allFullyReceived := true
	someReceived := false
	for _, line := range lineMap {
		if line.CantidadRecibida >= line.Cantidad {
			someReceived = true
		} else if line.CantidadRecibida > 0 {
			someReceived = true
			allFullyReceived = false
		} else {
			allFullyReceived = false
		}
	}

	var newState repository.EstadoOrdenCompra
	if allFullyReceived {
		newState = repository.EstadoOrdenCompraRECIBIDA
	} else if someReceived {
		newState = repository.EstadoOrdenCompraRECIBIDAPARCIALMENTE
	} else {
		newState = repository.EstadoOrdenCompraENRECEPCION
	}

	// Update estado
	_, err = qtx.UpdateOrdenCompraEstado(ctx, repository.UpdateOrdenCompraEstadoParams{
		ID:        pgID,
		UsuarioID: userID,
		Estado:    newState,
	})
	if err != nil {
		return nil, fmt.Errorf("update estado: %w", err)
	}

	// Create history entry
	_, err = qtx.CreateHistorialOrdenCompra(ctx, repository.CreateHistorialOrdenCompraParams{
		OrdenCompraID: pgID,
		EstadoAnterior: repository.NullEstadoOrdenCompra{
			EstadoOrdenCompra: currentState,
			Valid:             true,
		},
		EstadoNuevo: newState,
		EmpleadoID:  pgtype.UUID{},
		Comentario:  pgText("Recepción de mercadería registrada"),
	})
	if err != nil {
		return nil, fmt.Errorf("create historial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetOrdenCompra(ctx, userID, id)
}

func (s *PurchaseService) GetHistorial(ctx context.Context, userID pgtype.UUID, id string) ([]HistorialOrdenCompraResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrOrdenCompraNotFound
	}

	// Verify order exists and belongs to user
	_, err = s.queries.GetOrdenCompraByID(ctx, repository.GetOrdenCompraByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrOrdenCompraNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get orden compra: %w", err)
	}

	historial, err := s.queries.ListHistorialOrdenCompra(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list historial: %w", err)
	}

	result := make([]HistorialOrdenCompraResponse, 0, len(historial))
	for _, h := range historial {
		hr := HistorialOrdenCompraResponse{
			ID:             uuidStrFromPg(h.ID),
			EstadoNuevo:    string(h.EstadoNuevo),
			EmpleadoID:     uuidStrFromPg(h.EmpleadoID),
			EmpleadoNombre: textFromPg(h.EmpleadoNombre),
			Comentario:     textFromPg(h.Comentario),
			CreatedAt:      h.CreatedAt.Time.Format(time.RFC3339),
		}
		if h.EstadoAnterior.Valid {
			hr.EstadoAnterior = string(h.EstadoAnterior.EstadoOrdenCompra)
		}
		if h.EmpleadoNombre.Valid && h.EmpleadoApellido.Valid {
			hr.EmpleadoNombre = h.EmpleadoNombre.String + " " + h.EmpleadoApellido.String
		}
		result = append(result, hr)
	}
	return result, nil
}

// --- Mapping helpers ---

func toOrdenCompraDetailResponse(oc repository.GetOrdenCompraByIDRow) *OrdenCompraDetailResponse {
	resp := &OrdenCompraDetailResponse{
		ID:                  uuidStrFromPg(oc.ID),
		Numero:              oc.Numero,
		ProveedorID:         uuidStrFromPg(oc.ProveedorID),
		ProveedorNombre:     oc.ProveedorNombre,
		SucursalID:          uuidStrFromPg(oc.SucursalID),
		SucursalNombre:      oc.SucursalNombre,
		Estado:              string(oc.Estado),
		CondicionPago:       string(oc.CondicionPago),
		FechaOrden:          oc.FechaOrden.Time.Format("2006-01-02"),
		Subtotal:            floatFromNumeric(oc.Subtotal),
		DescuentoPorcentaje: floatFromNumeric(oc.DescuentoPorcentaje),
		DescuentoMonto:      floatFromNumeric(oc.DescuentoMonto),
		BaseImponible:       floatFromNumeric(oc.BaseImponible),
		TotalImpuestos:      floatFromNumeric(oc.TotalImpuestos),
		Total:               floatFromNumeric(oc.Total),
		Observaciones:       textFromPg(oc.Observaciones),
		CreatedAt:           oc.CreatedAt.Time.Format(time.RFC3339),
	}
	if oc.FechaEntregaEstimada.Valid {
		resp.FechaEntregaEstimada = oc.FechaEntregaEstimada.Time.Format("2006-01-02")
	}
	return resp
}

func ordenCompraListBase(id pgtype.UUID, numero string, proveedorID pgtype.UUID, proveedorNombre string, sucursalID pgtype.UUID, sucursalNombre string, estado repository.EstadoOrdenCompra, condicionPago repository.CondicionPago, fechaOrden pgtype.Date, fechaEntregaEstimada pgtype.Date, subtotal, total pgtype.Numeric, createdAt pgtype.Timestamptz) OrdenCompraListResponse {
	r := OrdenCompraListResponse{
		ID:              uuidStrFromPg(id),
		Numero:          numero,
		ProveedorID:     uuidStrFromPg(proveedorID),
		ProveedorNombre: proveedorNombre,
		SucursalID:      uuidStrFromPg(sucursalID),
		SucursalNombre:  sucursalNombre,
		Estado:          string(estado),
		CondicionPago:   string(condicionPago),
		FechaOrden:      fechaOrden.Time.Format("2006-01-02"),
		Subtotal:        floatFromNumeric(subtotal),
		Total:           floatFromNumeric(total),
		CreatedAt:       createdAt.Time.Format(time.RFC3339),
	}
	if fechaEntregaEstimada.Valid {
		r.FechaEntregaEstimada = fechaEntregaEstimada.Time.Format("2006-01-02")
	}
	return r
}

func toOrdenCompraListFromList(p repository.ListOrdenesCompraRow) OrdenCompraListResponse {
	return ordenCompraListBase(p.ID, p.Numero, p.ProveedorID, p.ProveedorNombre, p.SucursalID, p.SucursalNombre, p.Estado, p.CondicionPago, p.FechaOrden, p.FechaEntregaEstimada, p.Subtotal, p.Total, p.CreatedAt)
}

func toOrdenCompraListFromSearch(p repository.SearchOrdenesCompraRow) OrdenCompraListResponse {
	return ordenCompraListBase(p.ID, p.Numero, p.ProveedorID, p.ProveedorNombre, p.SucursalID, p.SucursalNombre, p.Estado, p.CondicionPago, p.FechaOrden, p.FechaEntregaEstimada, p.Subtotal, p.Total, p.CreatedAt)
}

func toOrdenCompraListFromEstado(p repository.ListOrdenesCompraByEstadoRow) OrdenCompraListResponse {
	return ordenCompraListBase(p.ID, p.Numero, p.ProveedorID, p.ProveedorNombre, p.SucursalID, p.SucursalNombre, p.Estado, p.CondicionPago, p.FechaOrden, p.FechaEntregaEstimada, p.Subtotal, p.Total, p.CreatedAt)
}
