package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/pkg/cuit"
	"github.com/pronto-erp/pronto/internal/repository"
)

var ErrEmpresaNotFound = errors.New("company settings not found")

type CompanyService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewCompanyService(db *pgxpool.Pool) *CompanyService {
	return &CompanyService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type EmpresaResponse struct {
	ID           string `json:"id"`
	RazonSocial  string `json:"razon_social"`
	Cuit         string `json:"cuit,omitempty"`
	CondicionIva string `json:"condicion_iva,omitempty"`
	Direccion    string `json:"direccion,omitempty"`
	Telefono     string `json:"telefono,omitempty"`
	Email        string `json:"email,omitempty"`
	LogoUrl      string `json:"logo_url,omitempty"`
	PieFactura   string `json:"pie_factura,omitempty"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

type UpsertEmpresaInput struct {
	RazonSocial  string `json:"razon_social" validate:"required,min=2,max=300"`
	Cuit         string `json:"cuit"`
	CondicionIva string `json:"condicion_iva"`
	Direccion    string `json:"direccion"`
	Telefono     string `json:"telefono"`
	Email        string `json:"email"`
	LogoUrl      string `json:"logo_url"`
	PieFactura   string `json:"pie_factura"`
}

// --- Methods ---

func (s *CompanyService) Get(ctx context.Context, userID pgtype.UUID) (*EmpresaResponse, error) {
	e, err := s.queries.GetConfiguracionEmpresaByUsuario(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrEmpresaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get empresa: %w", err)
	}

	resp := toEmpresaResponse(e)
	return &resp, nil
}

func (s *CompanyService) Upsert(ctx context.Context, userID pgtype.UUID, input UpsertEmpresaInput) (*EmpresaResponse, error) {
	if err := cuit.Validate(input.Cuit); err != nil {
		return nil, fmt.Errorf("CUIT invalido: %w", err)
	}
	e, err := s.queries.UpsertConfiguracionEmpresa(ctx, repository.UpsertConfiguracionEmpresaParams{
		RazonSocial:  input.RazonSocial,
		Cuit:         pgText(input.Cuit),
		CondicionIva: pgText(input.CondicionIva),
		Direccion:    pgText(input.Direccion),
		Telefono:     pgText(input.Telefono),
		Email:        pgText(input.Email),
		LogoUrl:      pgText(input.LogoUrl),
		PieFactura:   pgText(input.PieFactura),
		UsuarioID:    userID,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert empresa: %w", err)
	}

	resp := toEmpresaResponse(e)
	return &resp, nil
}

func toEmpresaResponse(e repository.ConfiguracionEmpresa) EmpresaResponse {
	return EmpresaResponse{
		ID:           uuidStrFromPg(e.ID),
		RazonSocial:  e.RazonSocial,
		Cuit:         textFromPg(e.Cuit),
		CondicionIva: textFromPg(e.CondicionIva),
		Direccion:    textFromPg(e.Direccion),
		Telefono:     textFromPg(e.Telefono),
		Email:        textFromPg(e.Email),
		LogoUrl:      textFromPg(e.LogoUrl),
		PieFactura:   textFromPg(e.PieFactura),
		CreatedAt:    e.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:    e.UpdatedAt.Time.Format(time.RFC3339),
	}
}
