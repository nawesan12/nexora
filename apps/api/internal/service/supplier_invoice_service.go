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
	ErrFacturaProveedorNotFound = errors.New("supplier invoice not found")
)

type SupplierInvoiceService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewSupplierInvoiceService(db *pgxpool.Pool) *SupplierInvoiceService {
	return &SupplierInvoiceService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type FacturaProveedorResponse struct {
	ID               string                            `json:"id"`
	Numero           string                            `json:"numero"`
	ProveedorID      string                            `json:"proveedor_id"`
	ProveedorNombre  string                            `json:"proveedor_nombre"`
	OrdenCompraID    string                            `json:"orden_compra_id,omitempty"`
	OrdenCompraNum   string                            `json:"orden_compra_numero,omitempty"`
	SucursalID       string                            `json:"sucursal_id"`
	SucursalNombre   string                            `json:"sucursal_nombre"`
	Tipo             string                            `json:"tipo"`
	FechaEmision     string                            `json:"fecha_emision"`
	FechaVencimiento string                            `json:"fecha_vencimiento,omitempty"`
	Subtotal         float64                           `json:"subtotal"`
	Impuestos        float64                           `json:"impuestos"`
	Total            float64                           `json:"total"`
	Estado           string                            `json:"estado"`
	Observaciones    string                            `json:"observaciones,omitempty"`
	Items            []DetalleFacturaProveedorResponse `json:"items"`
	CreatedAt        string                            `json:"created_at"`
}

type DetalleFacturaProveedorResponse struct {
	ID             string  `json:"id"`
	ProductoID     string  `json:"producto_id,omitempty"`
	Descripcion    string  `json:"descripcion"`
	Cantidad       float64 `json:"cantidad"`
	PrecioUnitario float64 `json:"precio_unitario"`
	Subtotal       float64 `json:"subtotal"`
}

type FacturaProveedorListResponse struct {
	ID              string  `json:"id"`
	Numero          string  `json:"numero"`
	ProveedorNombre string  `json:"proveedor_nombre"`
	Tipo            string  `json:"tipo"`
	FechaEmision    string  `json:"fecha_emision"`
	Total           float64 `json:"total"`
	Estado          string  `json:"estado"`
	CreatedAt       string  `json:"created_at"`
}

// --- Input DTOs ---

type CreateFacturaProveedorInput struct {
	Numero           string                               `json:"numero" validate:"required,min=1,max=50"`
	ProveedorID      string                               `json:"proveedor_id" validate:"required,uuid"`
	OrdenCompraID    string                               `json:"orden_compra_id"`
	SucursalID       string                               `json:"sucursal_id" validate:"required,uuid"`
	Tipo             string                               `json:"tipo" validate:"required,oneof=FACTURA_A FACTURA_B FACTURA_C NOTA_CREDITO NOTA_DEBITO"`
	FechaEmision     string                               `json:"fecha_emision" validate:"required"`
	FechaVencimiento string                               `json:"fecha_vencimiento"`
	Observaciones    string                               `json:"observaciones"`
	Items            []CreateDetalleFacturaProveedorInput  `json:"items" validate:"required,min=1,dive"`
}

type CreateDetalleFacturaProveedorInput struct {
	ProductoID     string  `json:"producto_id"`
	Descripcion    string  `json:"descripcion" validate:"required,min=1,max=300"`
	Cantidad       float64 `json:"cantidad" validate:"required,gt=0"`
	PrecioUnitario float64 `json:"precio_unitario" validate:"required,gte=0"`
}

// --- Methods ---

func (s *SupplierInvoiceService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]FacturaProveedorListResponse, int, error) {
	items, err := s.queries.ListFacturasProveedor(ctx, repository.ListFacturasProveedorParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list facturas proveedor: %w", err)
	}

	count, err := s.queries.CountFacturasProveedor(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count facturas proveedor: %w", err)
	}

	result := make([]FacturaProveedorListResponse, 0, len(items))
	for _, f := range items {
		result = append(result, FacturaProveedorListResponse{
			ID:              uuidStrFromPg(f.ID),
			Numero:          f.Numero,
			ProveedorNombre: f.ProveedorNombre,
			Tipo:            f.Tipo,
			FechaEmision:    dateFromPg(f.FechaEmision),
			Total:           floatFromNumeric(f.Total),
			Estado:          f.Estado,
			CreatedAt:       f.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, int(count), nil
}

func (s *SupplierInvoiceService) Get(ctx context.Context, userID pgtype.UUID, id string) (*FacturaProveedorResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrFacturaProveedorNotFound
	}

	f, err := s.queries.GetFacturaProveedorByID(ctx, repository.GetFacturaProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrFacturaProveedorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get factura proveedor: %w", err)
	}

	detalles, err := s.queries.ListDetallesByFacturaProveedor(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalles factura proveedor: %w", err)
	}

	resp := &FacturaProveedorResponse{
		ID:               uuidStrFromPg(f.ID),
		Numero:           f.Numero,
		ProveedorID:      uuidStrFromPg(f.ProveedorID),
		ProveedorNombre:  f.ProveedorNombre,
		OrdenCompraID:    uuidStrFromPg(f.OrdenCompraID),
		OrdenCompraNum:   textFromPg(f.OrdenCompraNum),
		SucursalID:       uuidStrFromPg(f.SucursalID),
		SucursalNombre:   f.SucursalNombre,
		Tipo:             f.Tipo,
		FechaEmision:     dateFromPg(f.FechaEmision),
		FechaVencimiento: dateFromPg(f.FechaVencimiento),
		Subtotal:         floatFromNumeric(f.Subtotal),
		Impuestos:        floatFromNumeric(f.Impuestos),
		Total:            floatFromNumeric(f.Total),
		Estado:           f.Estado,
		Observaciones:    textFromPg(f.Observaciones),
		CreatedAt:        f.CreatedAt.Time.Format(time.RFC3339),
	}

	resp.Items = make([]DetalleFacturaProveedorResponse, 0, len(detalles))
	for _, d := range detalles {
		resp.Items = append(resp.Items, DetalleFacturaProveedorResponse{
			ID:             uuidStrFromPg(d.ID),
			ProductoID:     uuidStrFromPg(d.ProductoID),
			Descripcion:    d.Descripcion,
			Cantidad:       floatFromNumeric(d.Cantidad),
			PrecioUnitario: floatFromNumeric(d.PrecioUnitario),
			Subtotal:       floatFromNumeric(d.Subtotal),
		})
	}

	return resp, nil
}

func (s *SupplierInvoiceService) Create(ctx context.Context, userID pgtype.UUID, input CreateFacturaProveedorInput) (*FacturaProveedorResponse, error) {
	proveedorID, err := pgUUID(input.ProveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	fechaEmision, err := pgDate(input.FechaEmision)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_emision")
	}

	fechaVencimiento, _ := pgDate(input.FechaVencimiento)

	var ordenCompraID pgtype.UUID
	if input.OrdenCompraID != "" {
		ordenCompraID, err = pgUUID(input.OrdenCompraID)
		if err != nil {
			return nil, fmt.Errorf("invalid orden_compra_id")
		}
	}

	// Calculate totals
	var subtotal float64
	for _, item := range input.Items {
		subtotal += item.Cantidad * item.PrecioUnitario
	}
	impuestos := 0.0 // Could be extended later
	total := subtotal + impuestos

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	factura, err := qtx.CreateFacturaProveedor(ctx, repository.CreateFacturaProveedorParams{
		Numero:           input.Numero,
		ProveedorID:      proveedorID,
		OrdenCompraID:    ordenCompraID,
		SucursalID:       sucursalID,
		Tipo:             input.Tipo,
		FechaEmision:     fechaEmision,
		FechaVencimiento: fechaVencimiento,
		Subtotal:         numericFromFloat(subtotal),
		Impuestos:        numericFromFloat(impuestos),
		Total:            numericFromFloat(total),
		Observaciones:    pgText(input.Observaciones),
		UsuarioID:        userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create factura proveedor: %w", err)
	}

	for _, item := range input.Items {
		var prodID pgtype.UUID
		if item.ProductoID != "" {
			prodID, _ = pgUUID(item.ProductoID)
		}
		itemSubtotal := item.Cantidad * item.PrecioUnitario
		_, err = qtx.CreateDetalleFacturaProveedor(ctx, repository.CreateDetalleFacturaProveedorParams{
			FacturaID:      factura.ID,
			ProductoID:     prodID,
			Descripcion:    item.Descripcion,
			Cantidad:       numericFromFloat(item.Cantidad),
			PrecioUnitario: numericFromFloat(item.PrecioUnitario),
			Subtotal:       numericFromFloat(itemSubtotal),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle factura proveedor: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(factura.ID))
}

func (s *SupplierInvoiceService) Anular(ctx context.Context, userID pgtype.UUID, id string) (*FacturaProveedorResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrFacturaProveedorNotFound
	}

	f, err := s.queries.GetFacturaProveedorByID(ctx, repository.GetFacturaProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrFacturaProveedorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get factura proveedor: %w", err)
	}

	if f.Estado == "ANULADA" {
		return nil, fmt.Errorf("la factura ya esta anulada")
	}

	err = s.queries.UpdateFacturaProveedorEstado(ctx, repository.UpdateFacturaProveedorEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: "ANULADA",
	})
	if err != nil {
		return nil, fmt.Errorf("update estado: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *SupplierInvoiceService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrFacturaProveedorNotFound
	}

	_, err = s.queries.GetFacturaProveedorByID(ctx, repository.GetFacturaProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrFacturaProveedorNotFound
	}
	if err != nil {
		return fmt.Errorf("get factura proveedor: %w", err)
	}

	return s.queries.SoftDeleteFacturaProveedor(ctx, repository.SoftDeleteFacturaProveedorParams{
		ID: pgID, UsuarioID: userID,
	})
}
