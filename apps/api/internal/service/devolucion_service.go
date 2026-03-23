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
	ErrDevolucionNotFound    = errors.New("devolucion not found")
	ErrDevolucionInvalidState = errors.New("invalid devolucion state transition")
)

type DevolucionService struct {
	db       *pgxpool.Pool
	queries  *repository.Queries
	stockSvc *StockService
}

func NewDevolucionService(db *pgxpool.Pool, stockSvc *StockService) *DevolucionService {
	return &DevolucionService{
		db:       db,
		queries:  repository.New(db),
		stockSvc: stockSvc,
	}
}

// --- DTOs ---

type DevolucionResponse struct {
	ID             string                       `json:"id"`
	Numero         string                       `json:"numero"`
	PedidoID       string                       `json:"pedido_id,omitempty"`
	PedidoNumero   string                       `json:"pedido_numero,omitempty"`
	ClienteID      string                       `json:"cliente_id"`
	ClienteNombre  string                       `json:"cliente_nombre"`
	SucursalID     string                       `json:"sucursal_id"`
	SucursalNombre string                       `json:"sucursal_nombre"`
	Motivo         string                       `json:"motivo"`
	Estado         string                       `json:"estado"`
	Fecha          string                       `json:"fecha"`
	Observaciones  string                       `json:"observaciones,omitempty"`
	Items          []DetalleDevolucionResponse   `json:"items"`
	CreatedAt      string                       `json:"created_at"`
}

type DetalleDevolucionResponse struct {
	ID              string `json:"id"`
	ProductoID      string `json:"producto_id"`
	ProductoNombre  string `json:"producto_nombre"`
	ProductoCodigo  string `json:"producto_codigo,omitempty"`
	ProductoUnidad  string `json:"producto_unidad"`
	Cantidad        int    `json:"cantidad"`
	MotivoItem      string `json:"motivo_item,omitempty"`
}

type CreateDevolucionInput struct {
	PedidoID      string                        `json:"pedido_id"`
	ClienteID     string                        `json:"cliente_id" validate:"required,uuid"`
	SucursalID    string                        `json:"sucursal_id" validate:"required,uuid"`
	Motivo        string                        `json:"motivo" validate:"required,min=5,max=500"`
	Fecha         string                        `json:"fecha" validate:"required"`
	Observaciones string                        `json:"observaciones"`
	Items         []CreateDetalleDevolucionInput `json:"items" validate:"required,min=1,dive"`
}

type CreateDetalleDevolucionInput struct {
	ProductoID string `json:"producto_id" validate:"required,uuid"`
	Cantidad   int    `json:"cantidad" validate:"required,gt=0"`
	MotivoItem string `json:"motivo_item"`
}

// --- Methods ---

func (s *DevolucionService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]DevolucionResponse, int, error) {
	items, err := s.queries.ListDevoluciones(ctx, repository.ListDevolucionesParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list devoluciones: %w", err)
	}

	count, err := s.queries.CountDevoluciones(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count devoluciones: %w", err)
	}

	result := make([]DevolucionResponse, 0, len(items))
	for _, d := range items {
		result = append(result, toDevolucionListResponse(d))
	}
	return result, int(count), nil
}

func (s *DevolucionService) Get(ctx context.Context, userID pgtype.UUID, id string) (*DevolucionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrDevolucionNotFound
	}

	d, err := s.queries.GetDevolucionByID(ctx, repository.GetDevolucionByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDevolucionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get devolucion: %w", err)
	}

	// Get items
	detalles, err := s.queries.ListDetallesByDevolucion(ctx, d.ID)
	if err != nil {
		return nil, fmt.Errorf("list detalles devolucion: %w", err)
	}

	items := make([]DetalleDevolucionResponse, 0, len(detalles))
	for _, det := range detalles {
		items = append(items, DetalleDevolucionResponse{
			ID:             uuidStrFromPg(det.ID),
			ProductoID:     uuidStrFromPg(det.ProductoID),
			ProductoNombre: det.ProductoNombre,
			ProductoCodigo: textFromPg(det.ProductoCodigo),
			ProductoUnidad: det.ProductoUnidad,
			Cantidad:       int(det.Cantidad),
			MotivoItem:     textFromPg(det.MotivoItem),
		})
	}

	resp := DevolucionResponse{
		ID:             uuidStrFromPg(d.ID),
		Numero:         d.Numero,
		PedidoID:       uuidStrFromPg(d.PedidoID),
		PedidoNumero:   d.PedidoNumero,
		ClienteID:      uuidStrFromPg(d.ClienteID),
		ClienteNombre:  d.ClienteNombre,
		SucursalID:     uuidStrFromPg(d.SucursalID),
		SucursalNombre: d.SucursalNombre,
		Motivo:         d.Motivo,
		Estado:         d.Estado,
		Fecha:          dateFromPg(d.Fecha),
		Observaciones:  textFromPg(d.Observaciones),
		Items:          items,
		CreatedAt:      d.CreatedAt.Time.Format(time.RFC3339),
	}
	return &resp, nil
}

func (s *DevolucionService) Create(ctx context.Context, userID pgtype.UUID, input CreateDevolucionInput) (*DevolucionResponse, error) {
	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha: %w", err)
	}

	var pedidoID pgtype.UUID
	if input.PedidoID != "" {
		pedidoID, err = pgUUID(input.PedidoID)
		if err != nil {
			return nil, fmt.Errorf("invalid pedido_id")
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	// Generate numero
	nextNum, err := qtx.GetNextDevolucionNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("get next devolucion numero: %w", err)
	}
	numero := fmt.Sprintf("DEV-%06d", nextNum)

	d, err := qtx.CreateDevolucion(ctx, repository.CreateDevolucionParams{
		Numero:        numero,
		PedidoID:      pedidoID,
		ClienteID:     clienteID,
		SucursalID:    sucursalID,
		Motivo:        input.Motivo,
		Estado:        "PENDIENTE",
		Fecha:         fecha,
		Observaciones: pgText(input.Observaciones),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create devolucion: %w", err)
	}

	// Create items
	items := make([]DetalleDevolucionResponse, 0, len(input.Items))
	for _, item := range input.Items {
		prodID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id in item")
		}

		det, err := qtx.CreateDetalleDevolucion(ctx, repository.CreateDetalleDevolucionParams{
			DevolucionID: d.ID,
			ProductoID:   prodID,
			Cantidad:     int32(item.Cantidad),
			MotivoItem:   pgText(item.MotivoItem),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle devolucion: %w", err)
		}

		items = append(items, DetalleDevolucionResponse{
			ID:         uuidStrFromPg(det.ID),
			ProductoID: item.ProductoID,
			Cantidad:   item.Cantidad,
			MotivoItem: item.MotivoItem,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	resp := DevolucionResponse{
		ID:        uuidStrFromPg(d.ID),
		Numero:    d.Numero,
		PedidoID:  uuidStrFromPg(d.PedidoID),
		ClienteID: uuidStrFromPg(d.ClienteID),
		SucursalID: uuidStrFromPg(d.SucursalID),
		Motivo:    d.Motivo,
		Estado:    d.Estado,
		Fecha:     dateFromPg(d.Fecha),
		Observaciones: textFromPg(d.Observaciones),
		Items:     items,
		CreatedAt: d.CreatedAt.Time.Format(time.RFC3339),
	}
	return &resp, nil
}

func (s *DevolucionService) Approve(ctx context.Context, userID pgtype.UUID, id string) (*DevolucionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrDevolucionNotFound
	}

	// Get current state
	d, err := s.queries.GetDevolucionByID(ctx, repository.GetDevolucionByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDevolucionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get devolucion: %w", err)
	}
	if d.Estado != "PENDIENTE" {
		return nil, ErrDevolucionInvalidState
	}

	// Update estado
	_, err = s.queries.UpdateDevolucionEstado(ctx, repository.UpdateDevolucionEstadoParams{
		ID:        pgID,
		UsuarioID: userID,
		Estado:    "APROBADA",
	})
	if err != nil {
		return nil, fmt.Errorf("update devolucion estado: %w", err)
	}

	// Get detalles and record stock movements
	detalles, err := s.queries.ListDetallesByDevolucion(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalles: %w", err)
	}

	devolucionIDStr := uuidStrFromPg(pgID)
	sucursalIDStr := uuidStrFromPg(d.SucursalID)

	for _, det := range detalles {
		_, err := s.stockSvc.RecordMovement(ctx, userID, RecordMovementInput{
			ProductoID:     uuidStrFromPg(det.ProductoID),
			SucursalID:     sucursalIDStr,
			Tipo:           "DEVOLUCION",
			Cantidad:       int(det.Cantidad),
			Motivo:         fmt.Sprintf("Devolucion %s aprobada", d.Numero),
			ReferenciaID:   devolucionIDStr,
			ReferenciaTipo: "DEVOLUCION",
		})
		if err != nil {
			return nil, fmt.Errorf("record stock movement: %w", err)
		}
	}

	return s.Get(ctx, userID, id)
}

func (s *DevolucionService) Reject(ctx context.Context, userID pgtype.UUID, id string) (*DevolucionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrDevolucionNotFound
	}

	d, err := s.queries.GetDevolucionByID(ctx, repository.GetDevolucionByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDevolucionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get devolucion: %w", err)
	}
	if d.Estado != "PENDIENTE" {
		return nil, ErrDevolucionInvalidState
	}

	_, err = s.queries.UpdateDevolucionEstado(ctx, repository.UpdateDevolucionEstadoParams{
		ID:        pgID,
		UsuarioID: userID,
		Estado:    "RECHAZADA",
	})
	if err != nil {
		return nil, fmt.Errorf("update devolucion estado: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *DevolucionService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrDevolucionNotFound
	}

	return s.queries.SoftDeleteDevolucion(ctx, repository.SoftDeleteDevolucionParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

// --- Helpers ---

func toDevolucionListResponse(d repository.ListDevolucionesRow) DevolucionResponse {
	return DevolucionResponse{
		ID:             uuidStrFromPg(d.ID),
		Numero:         d.Numero,
		PedidoID:       uuidStrFromPg(d.PedidoID),
		PedidoNumero:   d.PedidoNumero,
		ClienteID:      uuidStrFromPg(d.ClienteID),
		ClienteNombre:  d.ClienteNombre,
		SucursalID:     uuidStrFromPg(d.SucursalID),
		SucursalNombre: d.SucursalNombre,
		Motivo:         d.Motivo,
		Estado:         d.Estado,
		Fecha:          dateFromPg(d.Fecha),
		Observaciones:  textFromPg(d.Observaciones),
		CreatedAt:      d.CreatedAt.Time.Format(time.RFC3339),
	}
}
