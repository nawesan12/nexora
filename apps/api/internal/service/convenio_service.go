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
	ErrConvenioNotFound = errors.New("convenio not found")
)

type ConvenioService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewConvenioService(db *pgxpool.Pool) *ConvenioService {
	return &ConvenioService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type ConvenioResponse struct {
	ID              string `json:"id"`
	ProveedorID     string `json:"proveedor_id"`
	ProveedorNombre string `json:"proveedor_nombre,omitempty"`
	Nombre          string `json:"nombre"`
	FechaInicio     string `json:"fecha_inicio"`
	FechaFin        string `json:"fecha_fin,omitempty"`
	Activo          bool   `json:"activo"`
	CreatedAt       string `json:"created_at"`
}

type ConvenioDetailResponse struct {
	ConvenioResponse
	Items []DetalleConvenioResponse `json:"items"`
}

type DetalleConvenioResponse struct {
	ID                  string  `json:"id"`
	ProductoID          string  `json:"producto_id"`
	ProductoNombre      string  `json:"producto_nombre,omitempty"`
	ProductoCodigo      string  `json:"producto_codigo,omitempty"`
	PrecioConvenido     float64 `json:"precio_convenido"`
	CantidadMinima      int     `json:"cantidad_minima"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
}

type CreateConvenioInput struct {
	ProveedorID string                    `json:"proveedor_id" validate:"required,uuid"`
	Nombre      string                    `json:"nombre" validate:"required,min=2,max=300"`
	FechaInicio string                    `json:"fecha_inicio" validate:"required"`
	FechaFin    string                    `json:"fecha_fin"`
	Activo      *bool                     `json:"activo"`
	Items       []CreateDetalleConvenioIn `json:"items"`
}

type CreateDetalleConvenioIn struct {
	ProductoID          string  `json:"producto_id" validate:"required,uuid"`
	PrecioConvenido     float64 `json:"precio_convenido" validate:"gt=0"`
	CantidadMinima      int     `json:"cantidad_minima"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
}

// --- Methods ---

func (s *ConvenioService) Create(ctx context.Context, userID pgtype.UUID, input CreateConvenioInput) (*ConvenioDetailResponse, error) {
	proveedorID, err := pgUUID(input.ProveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}

	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio")
	}

	var fechaFin pgtype.Date
	if input.FechaFin != "" {
		fechaFin, err = pgDate(input.FechaFin)
		if err != nil {
			return nil, fmt.Errorf("invalid fecha_fin")
		}
	}

	activo := true
	if input.Activo != nil {
		activo = *input.Activo
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	conv, err := qtx.CreateConvenio(ctx, repository.CreateConvenioParams{
		ProveedorID: proveedorID,
		Nombre:      input.Nombre,
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
		Activo:      activo,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create convenio: %w", err)
	}

	for _, item := range input.Items {
		prodID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id in item")
		}

		cantMin := int32(1)
		if item.CantidadMinima > 0 {
			cantMin = int32(item.CantidadMinima)
		}

		_, err = qtx.CreateDetalleConvenio(ctx, repository.CreateDetalleConvenioParams{
			ConvenioID:          conv.ID,
			ProductoID:          prodID,
			PrecioConvenido:     numericFromFloat(item.PrecioConvenido),
			CantidadMinima:      pgtype.Int4{Int32: cantMin, Valid: true},
			DescuentoPorcentaje: numericFromFloat(item.DescuentoPorcentaje),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle convenio: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(conv.ID))
}

func (s *ConvenioService) Get(ctx context.Context, userID pgtype.UUID, id string) (*ConvenioDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConvenioNotFound
	}

	c, err := s.queries.GetConvenioByID(ctx, repository.GetConvenioByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConvenioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get convenio: %w", err)
	}

	detalles, err := s.queries.ListDetalleConvenio(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalle convenio: %w", err)
	}

	resp := &ConvenioDetailResponse{
		ConvenioResponse: ConvenioResponse{
			ID:              uuidStrFromPg(c.ID),
			ProveedorID:     uuidStrFromPg(c.ProveedorID),
			ProveedorNombre: c.ProveedorNombre,
			Nombre:          c.Nombre,
			FechaInicio:     dateStr(c.FechaInicio),
			FechaFin:        dateStr(c.FechaFin),
			Activo:          c.Activo,
			CreatedAt:       c.CreatedAt.Time.Format(time.RFC3339),
		},
	}

	resp.Items = make([]DetalleConvenioResponse, 0, len(detalles))
	for _, d := range detalles {
		resp.Items = append(resp.Items, DetalleConvenioResponse{
			ID:                  uuidStrFromPg(d.ID),
			ProductoID:          uuidStrFromPg(d.ProductoID),
			ProductoNombre:      d.ProductoNombre,
			ProductoCodigo:      textFromPg(d.ProductoCodigo),
			PrecioConvenido:     floatFromNumeric(d.PrecioConvenido),
			CantidadMinima:      int(d.CantidadMinima.Int32),
			DescuentoPorcentaje: floatFromNumeric(d.DescuentoPorcentaje),
		})
	}

	return resp, nil
}

func (s *ConvenioService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]ConvenioResponse, int, error) {
	items, err := s.queries.ListConvenios(ctx, repository.ListConveniosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list convenios: %w", err)
	}
	count, err := s.queries.CountConvenios(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count convenios: %w", err)
	}

	result := make([]ConvenioResponse, 0, len(items))
	for _, c := range items {
		result = append(result, ConvenioResponse{
			ID:              uuidStrFromPg(c.ID),
			ProveedorID:     uuidStrFromPg(c.ProveedorID),
			ProveedorNombre: c.ProveedorNombre,
			Nombre:          c.Nombre,
			FechaInicio:     dateStr(c.FechaInicio),
			FechaFin:        dateStr(c.FechaFin),
			Activo:          c.Activo,
			CreatedAt:       c.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, int(count), nil
}

func (s *ConvenioService) Update(ctx context.Context, userID pgtype.UUID, id string, input CreateConvenioInput) (*ConvenioDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConvenioNotFound
	}

	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio")
	}

	var fechaFin pgtype.Date
	if input.FechaFin != "" {
		fechaFin, err = pgDate(input.FechaFin)
		if err != nil {
			return nil, fmt.Errorf("invalid fecha_fin")
		}
	}

	activo := true
	if input.Activo != nil {
		activo = *input.Activo
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	_, err = qtx.UpdateConvenio(ctx, repository.UpdateConvenioParams{
		ID:          pgID,
		UsuarioID:   userID,
		Nombre:      input.Nombre,
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
		Activo:      activo,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConvenioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update convenio: %w", err)
	}

	// Replace items
	if err := qtx.DeleteDetallesByConvenio(ctx, pgID); err != nil {
		return nil, fmt.Errorf("delete detalle: %w", err)
	}

	for _, item := range input.Items {
		prodID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id in item")
		}

		cantMin := int32(1)
		if item.CantidadMinima > 0 {
			cantMin = int32(item.CantidadMinima)
		}

		_, err = qtx.CreateDetalleConvenio(ctx, repository.CreateDetalleConvenioParams{
			ConvenioID:          pgID,
			ProductoID:          prodID,
			PrecioConvenido:     numericFromFloat(item.PrecioConvenido),
			CantidadMinima:      pgtype.Int4{Int32: cantMin, Valid: true},
			DescuentoPorcentaje: numericFromFloat(item.DescuentoPorcentaje),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle convenio: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *ConvenioService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrConvenioNotFound
	}

	return s.queries.SoftDeleteConvenio(ctx, repository.SoftDeleteConvenioParams{
		ID: pgID, UsuarioID: userID,
	})
}

// helper
func dateStr(d pgtype.Date) string {
	if d.Valid {
		return d.Time.Format("2006-01-02")
	}
	return ""
}
