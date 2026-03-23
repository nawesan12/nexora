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
	ErrMovimientoStockNotFound = errors.New("movimiento de stock not found")
	ErrStockInsuficiente       = errors.New("insufficient stock for movement")
	ErrTipoAjusteInvalido      = errors.New("invalid adjustment type")
)

type StockService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewStockService(db *pgxpool.Pool) *StockService {
	return &StockService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Input DTOs ---

type RecordMovementInput struct {
	ProductoID     string `json:"producto_id" validate:"required,uuid"`
	SucursalID     string `json:"sucursal_id" validate:"required,uuid"`
	Tipo           string `json:"tipo" validate:"required,oneof=VENTA COMPRA AJUSTE TRANSFERENCIA QUIEBRE DEVOLUCION"`
	Cantidad       int    `json:"cantidad" validate:"required"`
	Motivo         string `json:"motivo"`
	ReferenciaID   string `json:"referencia_id"`
	ReferenciaTipo string `json:"referencia_tipo"`
	EmpleadoID     string `json:"empleado_id"`
}

type AdjustStockInput struct {
	ProductoID string `json:"producto_id" validate:"required,uuid"`
	SucursalID string `json:"sucursal_id" validate:"required,uuid"`
	Tipo       string `json:"tipo" validate:"required,oneof=AJUSTE QUIEBRE DEVOLUCION"`
	Cantidad   int    `json:"cantidad" validate:"required"`
	Motivo     string `json:"motivo" validate:"required,min=3"`
}

type ListMovimientosFilters struct {
	ProductoID string `json:"producto_id"`
	SucursalID string `json:"sucursal_id"`
	Tipo       string `json:"tipo"`
	FechaDesde string `json:"fecha_desde"`
	FechaHasta string `json:"fecha_hasta"`
}

// --- Response DTOs ---

type MovimientoStockResponse struct {
	ID              string `json:"id"`
	ProductoID      string `json:"producto_id"`
	ProductoNombre  string `json:"producto_nombre,omitempty"`
	SucursalID      string `json:"sucursal_id"`
	SucursalNombre  string `json:"sucursal_nombre,omitempty"`
	Tipo            string `json:"tipo"`
	Cantidad        int    `json:"cantidad"`
	StockAnterior   int    `json:"stock_anterior"`
	StockNuevo      int    `json:"stock_nuevo"`
	Motivo          string `json:"motivo,omitempty"`
	ReferenciaID    string `json:"referencia_id,omitempty"`
	ReferenciaTipo  string `json:"referencia_tipo,omitempty"`
	EmpleadoID      string `json:"empleado_id,omitempty"`
	EmpleadoNombre  string `json:"empleado_nombre,omitempty"`
	CreatedAt       string `json:"created_at"`
}

// --- Methods ---

func (s *StockService) RecordMovement(ctx context.Context, userID pgtype.UUID, input RecordMovementInput) (*MovimientoStockResponse, error) {
	productoID, err := pgUUID(input.ProductoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	var empleadoID pgtype.UUID
	if input.EmpleadoID != "" {
		empleadoID, err = pgUUID(input.EmpleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	var referenciaID pgtype.UUID
	if input.ReferenciaID != "" {
		referenciaID, err = pgUUID(input.ReferenciaID)
		if err != nil {
			return nil, fmt.Errorf("invalid referencia_id")
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	// Get current stock from catalogo_productos
	catalogo, err := qtx.GetCatalogoProducto(ctx, repository.GetCatalogoProductoParams{
		ProductoID: productoID,
		SucursalID: sucursalID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCatalogoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get catalogo: %w", err)
	}

	stockAnterior := int(catalogo.Stock)
	stockNuevo := stockAnterior + input.Cantidad

	if stockNuevo < 0 {
		return nil, ErrStockInsuficiente
	}

	// Create movimiento_stock row
	mov, err := qtx.CreateMovimientoStock(ctx, repository.CreateMovimientoStockParams{
		ProductoID:     productoID,
		SucursalID:     sucursalID,
		Tipo:           repository.TipoMovimientoStock(input.Tipo),
		Cantidad:       int32(input.Cantidad),
		StockAnterior:  int32(stockAnterior),
		StockNuevo:     int32(stockNuevo),
		Motivo:         pgText(input.Motivo),
		ReferenciaID:   referenciaID,
		ReferenciaTipo: pgText(input.ReferenciaTipo),
		EmpleadoID:     empleadoID,
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create movimiento stock: %w", err)
	}

	// Update catalogo_productos stock
	_, err = qtx.UpdateCatalogoStock(ctx, repository.UpdateCatalogoStockParams{
		ProductoID: productoID,
		SucursalID: sucursalID,
		Stock:      int32(stockNuevo),
	})
	if err != nil {
		return nil, fmt.Errorf("update catalogo stock: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return &MovimientoStockResponse{
		ID:             uuidStrFromPg(mov.ID),
		ProductoID:     uuidStrFromPg(mov.ProductoID),
		SucursalID:     uuidStrFromPg(mov.SucursalID),
		Tipo:           string(mov.Tipo),
		Cantidad:       int(mov.Cantidad),
		StockAnterior:  int(mov.StockAnterior),
		StockNuevo:     int(mov.StockNuevo),
		Motivo:         textFromPg(mov.Motivo),
		ReferenciaID:   uuidStrFromPg(mov.ReferenciaID),
		ReferenciaTipo: textFromPg(mov.ReferenciaTipo),
		EmpleadoID:     uuidStrFromPg(mov.EmpleadoID),
		CreatedAt:      mov.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *StockService) AdjustStock(ctx context.Context, userID pgtype.UUID, input AdjustStockInput) (*MovimientoStockResponse, error) {
	validTypes := map[string]bool{
		"AJUSTE":     true,
		"QUIEBRE":    true,
		"DEVOLUCION": true,
	}
	if !validTypes[input.Tipo] {
		return nil, ErrTipoAjusteInvalido
	}

	return s.RecordMovement(ctx, userID, RecordMovementInput{
		ProductoID: input.ProductoID,
		SucursalID: input.SucursalID,
		Tipo:       input.Tipo,
		Cantidad:   input.Cantidad,
		Motivo:     input.Motivo,
	})
}

func (s *StockService) ListMovimientos(ctx context.Context, userID pgtype.UUID, filters ListMovimientosFilters, limit, offset int32) ([]MovimientoStockResponse, int, error) {
	var productoID pgtype.UUID
	if filters.ProductoID != "" {
		var err error
		productoID, err = pgUUID(filters.ProductoID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid producto_id filter")
		}
	}

	var sucursalID pgtype.UUID
	if filters.SucursalID != "" {
		var err error
		sucursalID, err = pgUUID(filters.SucursalID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid sucursal_id filter")
		}
	}

	var fechaDesde, fechaHasta pgtype.Timestamptz
	if filters.FechaDesde != "" {
		t, err := time.Parse("2006-01-02", filters.FechaDesde)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid fecha_desde format")
		}
		fechaDesde = pgtype.Timestamptz{Time: t, Valid: true}
	}
	if filters.FechaHasta != "" {
		t, err := time.Parse("2006-01-02", filters.FechaHasta)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid fecha_hasta format")
		}
		fechaHasta = pgtype.Timestamptz{Time: t.Add(24 * time.Hour), Valid: true}
	}

	items, err := s.queries.ListMovimientosStockFiltered(ctx, repository.ListMovimientosStockFilteredParams{
		UsuarioID:   userID,
		ProductoID:  productoID,
		SucursalID:  sucursalID,
		Tipo:        pgText(filters.Tipo),
		FechaDesde:  fechaDesde,
		FechaHasta:  fechaHasta,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list movimientos stock: %w", err)
	}

	count, err := s.queries.CountMovimientosStockFiltered(ctx, repository.CountMovimientosStockFilteredParams{
		UsuarioID:  userID,
		ProductoID: productoID,
		SucursalID: sucursalID,
		Tipo:       pgText(filters.Tipo),
		FechaDesde: fechaDesde,
		FechaHasta: fechaHasta,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count movimientos stock: %w", err)
	}

	result := make([]MovimientoStockResponse, 0, len(items))
	for _, m := range items {
		result = append(result, MovimientoStockResponse{
			ID:             uuidStrFromPg(m.ID),
			ProductoID:     uuidStrFromPg(m.ProductoID),
			ProductoNombre: m.ProductoNombre,
			SucursalID:     uuidStrFromPg(m.SucursalID),
			SucursalNombre: m.SucursalNombre,
			Tipo:           string(m.Tipo),
			Cantidad:       int(m.Cantidad),
			StockAnterior:  int(m.StockAnterior),
			StockNuevo:     int(m.StockNuevo),
			Motivo:         textFromPg(m.Motivo),
			ReferenciaID:   uuidStrFromPg(m.ReferenciaID),
			ReferenciaTipo: textFromPg(m.ReferenciaTipo),
			EmpleadoID:     uuidStrFromPg(m.EmpleadoID),
			EmpleadoNombre: textFromPg(m.EmpleadoNombre),
			CreatedAt:      m.CreatedAt.Time.Format(time.RFC3339),
		})
	}

	return result, int(count), nil
}

// RecordMovementInTx records a stock movement within an existing transaction.
// Used by TransferService and other services that manage their own transactions.
func (s *StockService) RecordMovementInTx(ctx context.Context, qtx *repository.Queries, userID pgtype.UUID, input RecordMovementInput) (*MovimientoStockResponse, error) {
	productoID, err := pgUUID(input.ProductoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	var empleadoID pgtype.UUID
	if input.EmpleadoID != "" {
		empleadoID, err = pgUUID(input.EmpleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	var referenciaID pgtype.UUID
	if input.ReferenciaID != "" {
		referenciaID, err = pgUUID(input.ReferenciaID)
		if err != nil {
			return nil, fmt.Errorf("invalid referencia_id")
		}
	}

	catalogo, err := qtx.GetCatalogoProducto(ctx, repository.GetCatalogoProductoParams{
		ProductoID: productoID,
		SucursalID: sucursalID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCatalogoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get catalogo: %w", err)
	}

	stockAnterior := int(catalogo.Stock)
	stockNuevo := stockAnterior + input.Cantidad

	if stockNuevo < 0 {
		return nil, ErrStockInsuficiente
	}

	mov, err := qtx.CreateMovimientoStock(ctx, repository.CreateMovimientoStockParams{
		ProductoID:     productoID,
		SucursalID:     sucursalID,
		Tipo:           repository.TipoMovimientoStock(input.Tipo),
		Cantidad:       int32(input.Cantidad),
		StockAnterior:  int32(stockAnterior),
		StockNuevo:     int32(stockNuevo),
		Motivo:         pgText(input.Motivo),
		ReferenciaID:   referenciaID,
		ReferenciaTipo: pgText(input.ReferenciaTipo),
		EmpleadoID:     empleadoID,
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create movimiento stock: %w", err)
	}

	_, err = qtx.UpdateCatalogoStock(ctx, repository.UpdateCatalogoStockParams{
		ProductoID: productoID,
		SucursalID: sucursalID,
		Stock:      int32(stockNuevo),
	})
	if err != nil {
		return nil, fmt.Errorf("update catalogo stock: %w", err)
	}

	return &MovimientoStockResponse{
		ID:             uuidStrFromPg(mov.ID),
		ProductoID:     uuidStrFromPg(mov.ProductoID),
		SucursalID:     uuidStrFromPg(mov.SucursalID),
		Tipo:           string(mov.Tipo),
		Cantidad:       int(mov.Cantidad),
		StockAnterior:  int(mov.StockAnterior),
		StockNuevo:     int(mov.StockNuevo),
		Motivo:         textFromPg(mov.Motivo),
		ReferenciaID:   uuidStrFromPg(mov.ReferenciaID),
		ReferenciaTipo: textFromPg(mov.ReferenciaTipo),
		EmpleadoID:     uuidStrFromPg(mov.EmpleadoID),
		CreatedAt:      mov.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}
