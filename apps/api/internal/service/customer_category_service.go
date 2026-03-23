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
	ErrCategoriaClienteNotFound = errors.New("categoria cliente not found")
)

type CustomerCategoryService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewCustomerCategoryService(db *pgxpool.Pool) *CustomerCategoryService {
	return &CustomerCategoryService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type CategoriaClienteResponse struct {
	ID                  string  `json:"id"`
	Nombre              string  `json:"nombre"`
	Descripcion         string  `json:"descripcion,omitempty"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
	CreatedAt           string  `json:"created_at"`
}

type CreateCategoriaClienteInput struct {
	Nombre              string  `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion         string  `json:"descripcion"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
}

// --- Methods ---

func (s *CustomerCategoryService) Create(ctx context.Context, userID pgtype.UUID, input CreateCategoriaClienteInput) (*CategoriaClienteResponse, error) {
	descPct := pgtype.Numeric{}
	descPct.Valid = true
	descPct.Int = big.NewInt(int64(input.DescuentoPorcentaje * 100))
	descPct.Exp = -2

	cc, err := s.queries.CreateCategoriaCliente(ctx, repository.CreateCategoriaClienteParams{
		Nombre:              input.Nombre,
		Descripcion:         pgText(input.Descripcion),
		DescuentoPorcentaje: descPct,
		UsuarioID:           userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create categoria cliente: %w", err)
	}

	return toCategoriaClienteResponse(cc), nil
}

func (s *CustomerCategoryService) Get(ctx context.Context, userID pgtype.UUID, id string) (*CategoriaClienteResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrCategoriaClienteNotFound
	}

	cc, err := s.queries.GetCategoriaClienteByID(ctx, repository.GetCategoriaClienteByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCategoriaClienteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get categoria cliente: %w", err)
	}

	return toCategoriaClienteResponse(cc), nil
}

func (s *CustomerCategoryService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]CategoriaClienteResponse, int, error) {
	items, err := s.queries.ListCategoriasCliente(ctx, repository.ListCategoriasClienteParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list categorias cliente: %w", err)
	}

	count, err := s.queries.CountCategoriasCliente(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count categorias cliente: %w", err)
	}

	result := make([]CategoriaClienteResponse, 0, len(items))
	for _, cc := range items {
		result = append(result, *toCategoriaClienteResponse(cc))
	}
	return result, int(count), nil
}

func (s *CustomerCategoryService) Update(ctx context.Context, userID pgtype.UUID, id string, input CreateCategoriaClienteInput) (*CategoriaClienteResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrCategoriaClienteNotFound
	}

	descPct := pgtype.Numeric{}
	descPct.Valid = true
	descPct.Int = big.NewInt(int64(input.DescuentoPorcentaje * 100))
	descPct.Exp = -2

	cc, err := s.queries.UpdateCategoriaCliente(ctx, repository.UpdateCategoriaClienteParams{
		ID:                  pgID,
		UsuarioID:           userID,
		Nombre:              input.Nombre,
		Descripcion:         pgText(input.Descripcion),
		DescuentoPorcentaje: descPct,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCategoriaClienteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update categoria cliente: %w", err)
	}

	return toCategoriaClienteResponse(cc), nil
}

func (s *CustomerCategoryService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrCategoriaClienteNotFound
	}
	return s.queries.SoftDeleteCategoriaCliente(ctx, repository.SoftDeleteCategoriaClienteParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toCategoriaClienteResponse(cc repository.CategoriaCliente) *CategoriaClienteResponse {
	return &CategoriaClienteResponse{
		ID:                  uuidStrFromPg(cc.ID),
		Nombre:              cc.Nombre,
		Descripcion:         textFromPg(cc.Descripcion),
		DescuentoPorcentaje: floatFromNumeric(cc.DescuentoPorcentaje),
		CreatedAt:           cc.CreatedAt.Time.Format(time.RFC3339),
	}
}
