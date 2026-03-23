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
	ErrDevolucionProveedorNotFound        = errors.New("supplier return not found")
	ErrInvalidDevolucionProveedorTransition = errors.New("invalid supplier return state transition")
)

type SupplierReturnService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewSupplierReturnService(db *pgxpool.Pool) *SupplierReturnService {
	return &SupplierReturnService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type DevolucionProveedorResponse struct {
	ID              string                                `json:"id"`
	Numero          string                                `json:"numero"`
	ProveedorID     string                                `json:"proveedor_id"`
	ProveedorNombre string                                `json:"proveedor_nombre"`
	OrdenCompraID   string                                `json:"orden_compra_id,omitempty"`
	OrdenCompraNum  string                                `json:"orden_compra_numero,omitempty"`
	SucursalID      string                                `json:"sucursal_id"`
	SucursalNombre  string                                `json:"sucursal_nombre"`
	Motivo          string                                `json:"motivo"`
	Estado          string                                `json:"estado"`
	Fecha           string                                `json:"fecha"`
	Observaciones   string                                `json:"observaciones,omitempty"`
	Items           []DetalleDevolucionProveedorResponse   `json:"items"`
	CreatedAt       string                                `json:"created_at"`
}

type DetalleDevolucionProveedorResponse struct {
	ID             string `json:"id"`
	ProductoID     string `json:"producto_id"`
	ProductoNombre string `json:"producto_nombre"`
	ProductoCodigo string `json:"producto_codigo,omitempty"`
	Cantidad       int    `json:"cantidad"`
	MotivoItem     string `json:"motivo_item,omitempty"`
}

type DevolucionProveedorListResponse struct {
	ID              string `json:"id"`
	Numero          string `json:"numero"`
	ProveedorNombre string `json:"proveedor_nombre"`
	Motivo          string `json:"motivo"`
	Estado          string `json:"estado"`
	Fecha           string `json:"fecha"`
	CreatedAt       string `json:"created_at"`
}

// --- Input DTOs ---

type CreateDevolucionProveedorInput struct {
	ProveedorID   string                                  `json:"proveedor_id" validate:"required,uuid"`
	OrdenCompraID string                                  `json:"orden_compra_id"`
	SucursalID    string                                  `json:"sucursal_id" validate:"required,uuid"`
	Motivo        string                                  `json:"motivo" validate:"required,min=1,max=500"`
	Fecha         string                                  `json:"fecha" validate:"required"`
	Observaciones string                                  `json:"observaciones"`
	Items         []CreateDetalleDevolucionProveedorInput  `json:"items" validate:"required,min=1,dive"`
}

type CreateDetalleDevolucionProveedorInput struct {
	ProductoID string `json:"producto_id" validate:"required,uuid"`
	Cantidad   int    `json:"cantidad" validate:"required,gt=0"`
	MotivoItem string `json:"motivo_item"`
}

type TransitionDevolucionProveedorInput struct {
	Estado string `json:"estado" validate:"required,oneof=APROBADA ENVIADA COMPLETADA RECHAZADA"`
}

// valid transitions
var devolucionTransitions = map[string][]string{
	"PENDIENTE": {"APROBADA", "RECHAZADA"},
	"APROBADA":  {"ENVIADA", "RECHAZADA"},
	"ENVIADA":   {"COMPLETADA"},
}

// --- Methods ---

func (s *SupplierReturnService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]DevolucionProveedorListResponse, int, error) {
	items, err := s.queries.ListDevolucionesProveedor(ctx, repository.ListDevolucionesProveedorParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list devoluciones proveedor: %w", err)
	}

	count, err := s.queries.CountDevolucionesProveedor(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count devoluciones proveedor: %w", err)
	}

	result := make([]DevolucionProveedorListResponse, 0, len(items))
	for _, d := range items {
		result = append(result, DevolucionProveedorListResponse{
			ID:              uuidStrFromPg(d.ID),
			Numero:          d.Numero,
			ProveedorNombre: d.ProveedorNombre,
			Motivo:          d.Motivo,
			Estado:          d.Estado,
			Fecha:           dateFromPg(d.Fecha),
			CreatedAt:       d.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, int(count), nil
}

func (s *SupplierReturnService) Get(ctx context.Context, userID pgtype.UUID, id string) (*DevolucionProveedorResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrDevolucionProveedorNotFound
	}

	d, err := s.queries.GetDevolucionProveedorByID(ctx, repository.GetDevolucionProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDevolucionProveedorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get devolucion proveedor: %w", err)
	}

	detalles, err := s.queries.ListDetallesByDevolucionProveedor(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalles devolucion proveedor: %w", err)
	}

	resp := &DevolucionProveedorResponse{
		ID:              uuidStrFromPg(d.ID),
		Numero:          d.Numero,
		ProveedorID:     uuidStrFromPg(d.ProveedorID),
		ProveedorNombre: d.ProveedorNombre,
		OrdenCompraID:   uuidStrFromPg(d.OrdenCompraID),
		OrdenCompraNum:  textFromPg(d.OrdenCompraNum),
		SucursalID:      uuidStrFromPg(d.SucursalID),
		SucursalNombre:  d.SucursalNombre,
		Motivo:          d.Motivo,
		Estado:          d.Estado,
		Fecha:           dateFromPg(d.Fecha),
		Observaciones:   textFromPg(d.Observaciones),
		CreatedAt:       d.CreatedAt.Time.Format(time.RFC3339),
	}

	resp.Items = make([]DetalleDevolucionProveedorResponse, 0, len(detalles))
	for _, det := range detalles {
		resp.Items = append(resp.Items, DetalleDevolucionProveedorResponse{
			ID:             uuidStrFromPg(det.ID),
			ProductoID:     uuidStrFromPg(det.ProductoID),
			ProductoNombre: det.ProductoNombre,
			ProductoCodigo: textFromPg(det.ProductoCodigo),
			Cantidad:       int(det.Cantidad),
			MotivoItem:     textFromPg(det.MotivoItem),
		})
	}

	return resp, nil
}

func (s *SupplierReturnService) Create(ctx context.Context, userID pgtype.UUID, input CreateDevolucionProveedorInput) (*DevolucionProveedorResponse, error) {
	proveedorID, err := pgUUID(input.ProveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha")
	}

	var ordenCompraID pgtype.UUID
	if input.OrdenCompraID != "" {
		ordenCompraID, err = pgUUID(input.OrdenCompraID)
		if err != nil {
			return nil, fmt.Errorf("invalid orden_compra_id")
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	numero, err := qtx.GetNextDevolucionProveedorNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next devolucion numero: %w", err)
	}

	dev, err := qtx.CreateDevolucionProveedor(ctx, repository.CreateDevolucionProveedorParams{
		Numero:        fmt.Sprintf("DPR-%06d", numero),
		ProveedorID:   proveedorID,
		OrdenCompraID: ordenCompraID,
		SucursalID:    sucursalID,
		Motivo:        input.Motivo,
		Fecha:         fecha,
		Observaciones: pgText(input.Observaciones),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create devolucion proveedor: %w", err)
	}

	for _, item := range input.Items {
		prodID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id")
		}
		_, err = qtx.CreateDetalleDevolucionProveedor(ctx, repository.CreateDetalleDevolucionProveedorParams{
			DevolucionID: dev.ID,
			ProductoID:   prodID,
			Cantidad:     int32(item.Cantidad),
			MotivoItem:   pgText(item.MotivoItem),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle devolucion proveedor: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(dev.ID))
}

func (s *SupplierReturnService) Transition(ctx context.Context, userID pgtype.UUID, id string, input TransitionDevolucionProveedorInput) (*DevolucionProveedorResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrDevolucionProveedorNotFound
	}

	d, err := s.queries.GetDevolucionProveedorByID(ctx, repository.GetDevolucionProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDevolucionProveedorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get devolucion proveedor: %w", err)
	}

	allowed, ok := devolucionTransitions[d.Estado]
	if !ok {
		return nil, fmt.Errorf("%w: estado actual %s no permite transiciones", ErrInvalidDevolucionProveedorTransition, d.Estado)
	}

	valid := false
	for _, a := range allowed {
		if a == input.Estado {
			valid = true
			break
		}
	}
	if !valid {
		return nil, fmt.Errorf("%w: no se puede transicionar de %s a %s", ErrInvalidDevolucionProveedorTransition, d.Estado, input.Estado)
	}

	err = s.queries.UpdateDevolucionProveedorEstado(ctx, repository.UpdateDevolucionProveedorEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: input.Estado,
	})
	if err != nil {
		return nil, fmt.Errorf("update devolucion estado: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *SupplierReturnService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrDevolucionProveedorNotFound
	}

	_, err = s.queries.GetDevolucionProveedorByID(ctx, repository.GetDevolucionProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrDevolucionProveedorNotFound
	}
	if err != nil {
		return fmt.Errorf("get devolucion proveedor: %w", err)
	}

	return s.queries.SoftDeleteDevolucionProveedor(ctx, repository.SoftDeleteDevolucionProveedorParams{
		ID: pgID, UsuarioID: userID,
	})
}
