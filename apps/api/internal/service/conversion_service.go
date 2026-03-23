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

var ErrConversionNotFound = errors.New("conversion not found")

var validUnits = map[string]bool{
	"KG": true, "UNIDAD": true, "LITRO": true, "METRO": true,
	"CAJA": true, "BOLSA": true, "PACK": true,
}

type ConversionService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewConversionService(db *pgxpool.Pool) *ConversionService {
	return &ConversionService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type ConversionResponse struct {
	ID        string  `json:"id"`
	FromUnit  string  `json:"from_unit"`
	ToUnit    string  `json:"to_unit"`
	Factor    float64 `json:"factor"`
	CreatedAt string  `json:"created_at"`
}

type CreateConversionInput struct {
	FromUnit string  `json:"from_unit" validate:"required"`
	ToUnit   string  `json:"to_unit" validate:"required"`
	Factor   float64 `json:"factor" validate:"required,gt=0"`
}

type UpdateConversionInput struct {
	Factor float64 `json:"factor" validate:"required,gt=0"`
}

type ConvertResult struct {
	FromUnit     string  `json:"from_unit"`
	ToUnit       string  `json:"to_unit"`
	Factor       float64 `json:"factor"`
	OriginalQty  float64 `json:"original_qty"`
	ConvertedQty float64 `json:"converted_qty"`
}

// --- Methods ---

func (s *ConversionService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]ConversionResponse, int, error) {
	items, err := s.queries.ListConversions(ctx, repository.ListConversionsParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list conversions: %w", err)
	}

	count, err := s.queries.CountConversions(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count conversions: %w", err)
	}

	result := make([]ConversionResponse, 0, len(items))
	for _, c := range items {
		result = append(result, toConversionResponse(c))
	}
	return result, int(count), nil
}

func (s *ConversionService) Create(ctx context.Context, userID pgtype.UUID, input CreateConversionInput) (*ConversionResponse, error) {
	if !validUnits[input.FromUnit] {
		return nil, fmt.Errorf("invalid from_unit: %s", input.FromUnit)
	}
	if !validUnits[input.ToUnit] {
		return nil, fmt.Errorf("invalid to_unit: %s", input.ToUnit)
	}
	if input.FromUnit == input.ToUnit {
		return nil, fmt.Errorf("from_unit and to_unit must be different")
	}

	c, err := s.queries.CreateConversion(ctx, repository.CreateConversionParams{
		FromUnit:  input.FromUnit,
		ToUnit:    input.ToUnit,
		Factor:    numericFromFloat(input.Factor),
		UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create conversion: %w", err)
	}

	resp := toConversionResponse(c)
	return &resp, nil
}

func (s *ConversionService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateConversionInput) (*ConversionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConversionNotFound
	}

	c, err := s.queries.UpdateConversion(ctx, repository.UpdateConversionParams{
		ID:        pgID,
		UsuarioID: userID,
		Factor:    numericFromFloat(input.Factor),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConversionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update conversion: %w", err)
	}

	resp := toConversionResponse(c)
	return &resp, nil
}

func (s *ConversionService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrConversionNotFound
	}

	return s.queries.SoftDeleteConversion(ctx, repository.SoftDeleteConversionParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func (s *ConversionService) Convert(ctx context.Context, userID pgtype.UUID, fromUnit, toUnit string, qty float64) (*ConvertResult, error) {
	if !validUnits[fromUnit] {
		return nil, fmt.Errorf("invalid from_unit: %s", fromUnit)
	}
	if !validUnits[toUnit] {
		return nil, fmt.Errorf("invalid to_unit: %s", toUnit)
	}

	if fromUnit == toUnit {
		return &ConvertResult{
			FromUnit:     fromUnit,
			ToUnit:       toUnit,
			Factor:       1,
			OriginalQty:  qty,
			ConvertedQty: qty,
		}, nil
	}

	factor, err := s.queries.ConvertUnits(ctx, repository.ConvertUnitsParams{
		FromUnit:  fromUnit,
		ToUnit:    toUnit,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConversionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("convert units: %w", err)
	}

	factorFloat := floatFromNumeric(factor)

	return &ConvertResult{
		FromUnit:     fromUnit,
		ToUnit:       toUnit,
		Factor:       factorFloat,
		OriginalQty:  qty,
		ConvertedQty: qty * factorFloat,
	}, nil
}

func toConversionResponse(c repository.ConversionUnidad) ConversionResponse {
	return ConversionResponse{
		ID:        uuidStrFromPg(c.ID),
		FromUnit:  c.FromUnit,
		ToUnit:    c.ToUnit,
		Factor:    floatFromNumeric(c.Factor),
		CreatedAt: c.CreatedAt.Time.Format(time.RFC3339),
	}
}
