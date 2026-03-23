package service

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

var (
	ErrPromocionNotFound = errors.New("promocion not found")
)

type PromotionService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewPromotionService(db *pgxpool.Pool) *PromotionService {
	return &PromotionService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type PromocionResponse struct {
	ID             string  `json:"id"`
	Nombre         string  `json:"nombre"`
	Tipo           string  `json:"tipo"`
	Valor          float64 `json:"valor"`
	CantidadMinima *int    `json:"cantidad_minima,omitempty"`
	ProductoID     string  `json:"producto_id,omitempty"`
	ProductoNombre string  `json:"producto_nombre,omitempty"`
	CategoriaID    string  `json:"categoria_id,omitempty"`
	CategoriaNombre string `json:"categoria_nombre,omitempty"`
	FechaInicio    string  `json:"fecha_inicio"`
	FechaFin       string  `json:"fecha_fin"`
	Activa         bool    `json:"activa"`
	SucursalID     string  `json:"sucursal_id,omitempty"`
	SucursalNombre string  `json:"sucursal_nombre,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type CreatePromocionInput struct {
	Nombre         string `json:"nombre" validate:"required,min=2,max=300"`
	Tipo           string `json:"tipo" validate:"required,oneof=PORCENTAJE MONTO_FIJO CANTIDAD_MINIMA COMBO"`
	Valor          float64 `json:"valor" validate:"required,gt=0"`
	CantidadMinima *int   `json:"cantidad_minima"`
	ProductoID     string `json:"producto_id"`
	CategoriaID    string `json:"categoria_id"`
	FechaInicio    string `json:"fecha_inicio" validate:"required"`
	FechaFin       string `json:"fecha_fin" validate:"required"`
	Activa         bool   `json:"activa"`
	SucursalID     string `json:"sucursal_id"`
}

// --- Methods ---

func (s *PromotionService) Create(ctx context.Context, userID pgtype.UUID, input CreatePromocionInput) (*PromocionResponse, error) {
	fechaInicio, err := time.Parse("2006-01-02", input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio format")
	}
	fechaFin, err := time.Parse("2006-01-02", input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin format")
	}

	var productoID pgtype.UUID
	if input.ProductoID != "" {
		productoID, err = pgUUID(input.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id")
		}
	}

	var categoriaID pgtype.UUID
	if input.CategoriaID != "" {
		categoriaID, err = pgUUID(input.CategoriaID)
		if err != nil {
			return nil, fmt.Errorf("invalid categoria_id")
		}
	}

	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	var cantidadMinima pgtype.Int4
	if input.CantidadMinima != nil {
		cantidadMinima = pgtype.Int4{Int32: int32(*input.CantidadMinima), Valid: true}
	}

	valorNum := pgtype.Numeric{}
	valorNum.Valid = true
	valorNum.Int = big.NewInt(int64(input.Valor * 100))
	valorNum.Exp = -2

	p, err := s.queries.CreatePromocion(ctx, repository.CreatePromocionParams{
		Nombre:         input.Nombre,
		Tipo:           repository.TipoPromocion(input.Tipo),
		Valor:          valorNum,
		CantidadMinima: cantidadMinima,
		ProductoID:     productoID,
		CategoriaID:    categoriaID,
		FechaInicio:    pgtype.Date{Time: fechaInicio, Valid: true},
		FechaFin:       pgtype.Date{Time: fechaFin, Valid: true},
		Activa:         input.Activa,
		SucursalID:     sucursalID,
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create promocion: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(p.ID))
}

func (s *PromotionService) Get(ctx context.Context, userID pgtype.UUID, id string) (*PromocionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPromocionNotFound
	}

	p, err := s.queries.GetPromocionByID(ctx, repository.GetPromocionByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPromocionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get promocion: %w", err)
	}

	return toPromocionResponse(p), nil
}

func (s *PromotionService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]PromocionResponse, int, error) {
	items, err := s.queries.ListPromociones(ctx, repository.ListPromocionesParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list promociones: %w", err)
	}

	count, err := s.queries.CountPromociones(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count promociones: %w", err)
	}

	result := make([]PromocionResponse, 0, len(items))
	for _, p := range items {
		r := PromocionResponse{
			ID:              uuidStrFromPg(p.ID),
			Nombre:          p.Nombre,
			Tipo:            string(p.Tipo),
			Valor:           floatFromNumeric(p.Valor),
			FechaInicio:     p.FechaInicio.Time.Format("2006-01-02"),
			FechaFin:        p.FechaFin.Time.Format("2006-01-02"),
			Activa:          p.Activa,
			ProductoID:      uuidStrFromPg(p.ProductoID),
			ProductoNombre:  textFromPg(p.ProductoNombre),
			CategoriaID:     uuidStrFromPg(p.CategoriaID),
			CategoriaNombre: textFromPg(p.CategoriaNombre),
			SucursalID:      uuidStrFromPg(p.SucursalID),
			SucursalNombre:  textFromPg(p.SucursalNombre),
			CreatedAt:       p.CreatedAt.Time.Format(time.RFC3339),
		}
		if p.CantidadMinima.Valid {
			v := int(p.CantidadMinima.Int32)
			r.CantidadMinima = &v
		}
		result = append(result, r)
	}
	return result, int(count), nil
}

func (s *PromotionService) Update(ctx context.Context, userID pgtype.UUID, id string, input CreatePromocionInput) (*PromocionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPromocionNotFound
	}

	fechaInicio, err := time.Parse("2006-01-02", input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio format")
	}
	fechaFin, err := time.Parse("2006-01-02", input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin format")
	}

	var productoID pgtype.UUID
	if input.ProductoID != "" {
		productoID, err = pgUUID(input.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id")
		}
	}

	var categoriaID pgtype.UUID
	if input.CategoriaID != "" {
		categoriaID, err = pgUUID(input.CategoriaID)
		if err != nil {
			return nil, fmt.Errorf("invalid categoria_id")
		}
	}

	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	var cantidadMinima pgtype.Int4
	if input.CantidadMinima != nil {
		cantidadMinima = pgtype.Int4{Int32: int32(*input.CantidadMinima), Valid: true}
	}

	valorNum := pgtype.Numeric{}
	valorNum.Valid = true
	valorNum.Int = big.NewInt(int64(input.Valor * 100))
	valorNum.Exp = -2

	_, err = s.queries.UpdatePromocion(ctx, repository.UpdatePromocionParams{
		ID:             pgID,
		UsuarioID:      userID,
		Nombre:         input.Nombre,
		Tipo:           repository.TipoPromocion(input.Tipo),
		Valor:          valorNum,
		CantidadMinima: cantidadMinima,
		ProductoID:     productoID,
		CategoriaID:    categoriaID,
		FechaInicio:    pgtype.Date{Time: fechaInicio, Valid: true},
		FechaFin:       pgtype.Date{Time: fechaFin, Valid: true},
		Activa:         input.Activa,
		SucursalID:     sucursalID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPromocionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update promocion: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *PromotionService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrPromocionNotFound
	}
	return s.queries.SoftDeletePromocion(ctx, repository.SoftDeletePromocionParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toPromocionResponse(p repository.GetPromocionByIDRow) *PromocionResponse {
	r := &PromocionResponse{
		ID:              uuidStrFromPg(p.ID),
		Nombre:          p.Nombre,
		Tipo:            string(p.Tipo),
		Valor:           floatFromNumeric(p.Valor),
		FechaInicio:     p.FechaInicio.Time.Format("2006-01-02"),
		FechaFin:        p.FechaFin.Time.Format("2006-01-02"),
		Activa:          p.Activa,
		ProductoID:      uuidStrFromPg(p.ProductoID),
		ProductoNombre:  textFromPg(p.ProductoNombre),
		CategoriaID:     uuidStrFromPg(p.CategoriaID),
		CategoriaNombre: textFromPg(p.CategoriaNombre),
		SucursalID:      uuidStrFromPg(p.SucursalID),
		SucursalNombre:  textFromPg(p.SucursalNombre),
		CreatedAt:       p.CreatedAt.Time.Format(time.RFC3339),
	}
	if p.CantidadMinima.Valid {
		v := int(p.CantidadMinima.Int32)
		r.CantidadMinima = &v
	}
	return r
}
