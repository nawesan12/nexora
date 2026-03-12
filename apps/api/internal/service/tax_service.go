package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrConfigImpuestoNotFound = errors.New("configuracion impuesto not found")
)

type TaxService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewTaxService(db *pgxpool.Pool) *TaxService {
	return &TaxService{
		db:      db,
		queries: repository.New(db),
	}
}

type ConfigImpuestoResponse struct {
	ID                string  `json:"id"`
	Nombre            string  `json:"nombre"`
	Tipo              string  `json:"tipo"`
	Porcentaje        float64 `json:"porcentaje"`
	AplicarPorDefecto bool    `json:"aplicar_por_defecto"`
}

type CreateConfigImpuestoInput struct {
	Nombre            string  `json:"nombre" validate:"required,min=1,max=100"`
	Tipo              string  `json:"tipo" validate:"required,oneof=IVA IIBB PERCEPCION_IVA PERCEPCION_IIBB OTRO"`
	Porcentaje        float64 `json:"porcentaje" validate:"gte=0"`
	AplicarPorDefecto bool    `json:"aplicar_por_defecto"`
}

type UpdateConfigImpuestoInput struct {
	Nombre            string  `json:"nombre" validate:"required,min=1,max=100"`
	Tipo              string  `json:"tipo" validate:"required,oneof=IVA IIBB PERCEPCION_IVA PERCEPCION_IIBB OTRO"`
	Porcentaje        float64 `json:"porcentaje" validate:"gte=0"`
	AplicarPorDefecto bool    `json:"aplicar_por_defecto"`
}

func (s *TaxService) ListConfigImpuestos(ctx context.Context, userID pgtype.UUID) ([]ConfigImpuestoResponse, error) {
	items, err := s.queries.ListConfiguracionImpuestos(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list config impuestos: %w", err)
	}
	result := make([]ConfigImpuestoResponse, 0, len(items))
	for _, c := range items {
		result = append(result, toConfigImpuestoResponse(c))
	}
	return result, nil
}

func (s *TaxService) ListDefaultImpuestos(ctx context.Context, userID pgtype.UUID) ([]ConfigImpuestoResponse, error) {
	items, err := s.queries.ListConfiguracionImpuestosDefault(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list default impuestos: %w", err)
	}
	result := make([]ConfigImpuestoResponse, 0, len(items))
	for _, c := range items {
		result = append(result, toConfigImpuestoResponse(c))
	}
	return result, nil
}

func (s *TaxService) CreateConfigImpuesto(ctx context.Context, userID pgtype.UUID, input CreateConfigImpuestoInput) (*ConfigImpuestoResponse, error) {
	c, err := s.queries.CreateConfiguracionImpuesto(ctx, repository.CreateConfiguracionImpuestoParams{
		Nombre:            input.Nombre,
		Tipo:              repository.TipoImpuesto(input.Tipo),
		Porcentaje:        numericFromFloat(input.Porcentaje),
		AplicarPorDefecto: input.AplicarPorDefecto,
		UsuarioID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create config impuesto: %w", err)
	}
	resp := toConfigImpuestoResponse(c)
	return &resp, nil
}

func (s *TaxService) UpdateConfigImpuesto(ctx context.Context, userID pgtype.UUID, id string, input UpdateConfigImpuestoInput) (*ConfigImpuestoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConfigImpuestoNotFound
	}
	c, err := s.queries.UpdateConfiguracionImpuesto(ctx, repository.UpdateConfiguracionImpuestoParams{
		ID:                pgID,
		UsuarioID:         userID,
		Nombre:            input.Nombre,
		Tipo:              repository.TipoImpuesto(input.Tipo),
		Porcentaje:        numericFromFloat(input.Porcentaje),
		AplicarPorDefecto: input.AplicarPorDefecto,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConfigImpuestoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update config impuesto: %w", err)
	}
	resp := toConfigImpuestoResponse(c)
	return &resp, nil
}

func (s *TaxService) DeleteConfigImpuesto(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrConfigImpuestoNotFound
	}
	return s.queries.SoftDeleteConfiguracionImpuesto(ctx, repository.SoftDeleteConfiguracionImpuestoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toConfigImpuestoResponse(c repository.ConfiguracionImpuesto) ConfigImpuestoResponse {
	return ConfigImpuestoResponse{
		ID:                uuidStrFromPg(c.ID),
		Nombre:            c.Nombre,
		Tipo:              string(c.Tipo),
		Porcentaje:        floatFromNumeric(c.Porcentaje),
		AplicarPorDefecto: c.AplicarPorDefecto,
	}
}
