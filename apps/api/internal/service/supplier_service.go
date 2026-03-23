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

var (
	ErrProveedorNotFound      = errors.New("proveedor not found")
	ErrProveedorDuplicateCuit = errors.New("cuit already exists for another proveedor")
)

type ProveedorService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewProveedorService(db *pgxpool.Pool) *ProveedorService {
	return &ProveedorService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Input DTOs ---

type CreateProveedorInput struct {
	Nombre       string `json:"nombre" validate:"required,min=2,max=200"`
	Cuit         string `json:"cuit" validate:"max=20"`
	CondicionIva string `json:"condicion_iva" validate:"omitempty,oneof=RESPONSABLE_INSCRIPTO MONOTRIBUTO EXENTO NO_RESPONSABLE CONSUMIDOR_FINAL"`
	Email        string `json:"email"`
	Telefono     string `json:"telefono"`
	Direccion    string `json:"direccion"`
	Contacto     string `json:"contacto"`
	Banco        string `json:"banco"`
	Cbu          string `json:"cbu"`
	Alias        string `json:"alias"`
	Notas        string `json:"notas"`
}

type UpdateProveedorInput struct {
	Nombre       string `json:"nombre" validate:"required,min=2,max=200"`
	Cuit         string `json:"cuit" validate:"max=20"`
	CondicionIva string `json:"condicion_iva" validate:"omitempty,oneof=RESPONSABLE_INSCRIPTO MONOTRIBUTO EXENTO NO_RESPONSABLE CONSUMIDOR_FINAL"`
	Email        string `json:"email"`
	Telefono     string `json:"telefono"`
	Direccion    string `json:"direccion"`
	Contacto     string `json:"contacto"`
	Banco        string `json:"banco"`
	Cbu          string `json:"cbu"`
	Alias        string `json:"alias"`
	Notas        string `json:"notas"`
}

// --- Response DTO ---

type ProveedorResponse struct {
	ID           string `json:"id"`
	Nombre       string `json:"nombre"`
	Cuit         string `json:"cuit,omitempty"`
	CondicionIva string `json:"condicion_iva,omitempty"`
	Email        string `json:"email,omitempty"`
	Telefono     string `json:"telefono,omitempty"`
	Direccion    string `json:"direccion,omitempty"`
	Contacto     string `json:"contacto,omitempty"`
	Banco        string `json:"banco,omitempty"`
	Cbu          string `json:"cbu,omitempty"`
	Alias        string `json:"alias,omitempty"`
	Notas        string `json:"notas,omitempty"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

// --- Methods ---

func (s *ProveedorService) CreateProveedor(ctx context.Context, userID pgtype.UUID, input CreateProveedorInput) (*ProveedorResponse, error) {
	if err := cuit.Validate(input.Cuit); err != nil {
		return nil, fmt.Errorf("CUIT invalido: %w", err)
	}
	if input.Cuit != "" {
		existing, err := s.queries.GetProveedorByCuit(ctx, repository.GetProveedorByCuitParams{
			Cuit:      pgText(input.Cuit),
			UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid {
			return nil, ErrProveedorDuplicateCuit
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check cuit: %w", err)
		}
	}

	p, err := s.queries.CreateProveedor(ctx, repository.CreateProveedorParams{
		Nombre:       input.Nombre,
		Cuit:         pgText(input.Cuit),
		CondicionIva: repository.NullCondicionIva{CondicionIva: repository.CondicionIva(input.CondicionIva), Valid: input.CondicionIva != ""},
		Email:        pgText(input.Email),
		Telefono:     pgText(input.Telefono),
		Direccion:    pgText(input.Direccion),
		Contacto:     pgText(input.Contacto),
		Banco:        pgText(input.Banco),
		Cbu:          pgText(input.Cbu),
		Alias:        pgText(input.Alias),
		Notas:        pgText(input.Notas),
		UsuarioID:    userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create proveedor: %w", err)
	}
	return toProveedorResponse(p), nil
}

func (s *ProveedorService) GetProveedor(ctx context.Context, userID pgtype.UUID, id string) (*ProveedorResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrProveedorNotFound
	}
	p, err := s.queries.GetProveedorByID(ctx, repository.GetProveedorByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProveedorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get proveedor: %w", err)
	}
	return toProveedorResponse(p), nil
}

func (s *ProveedorService) UpdateProveedor(ctx context.Context, userID pgtype.UUID, id string, input UpdateProveedorInput) (*ProveedorResponse, error) {
	if err := cuit.Validate(input.Cuit); err != nil {
		return nil, fmt.Errorf("CUIT invalido: %w", err)
	}
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrProveedorNotFound
	}

	if input.Cuit != "" {
		existing, err := s.queries.GetProveedorByCuit(ctx, repository.GetProveedorByCuitParams{
			Cuit:      pgText(input.Cuit),
			UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid && uuidStrFromPg(existing.ID) != id {
			return nil, ErrProveedorDuplicateCuit
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check cuit: %w", err)
		}
	}

	p, err := s.queries.UpdateProveedor(ctx, repository.UpdateProveedorParams{
		ID:           pgID,
		UsuarioID:    userID,
		Nombre:       input.Nombre,
		Cuit:         pgText(input.Cuit),
		CondicionIva: repository.NullCondicionIva{CondicionIva: repository.CondicionIva(input.CondicionIva), Valid: input.CondicionIva != ""},
		Email:        pgText(input.Email),
		Telefono:     pgText(input.Telefono),
		Direccion:    pgText(input.Direccion),
		Contacto:     pgText(input.Contacto),
		Banco:        pgText(input.Banco),
		Cbu:          pgText(input.Cbu),
		Alias:        pgText(input.Alias),
		Notas:        pgText(input.Notas),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProveedorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update proveedor: %w", err)
	}
	return toProveedorResponse(p), nil
}

func (s *ProveedorService) DeleteProveedor(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrProveedorNotFound
	}
	return s.queries.SoftDeleteProveedor(ctx, repository.SoftDeleteProveedorParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func (s *ProveedorService) ListProveedores(ctx context.Context, userID pgtype.UUID, search string, limit, offset int32) ([]ProveedorResponse, int, error) {
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchProveedores(ctx, repository.SearchProveedoresParams{
			UsuarioID: userID,
			Nombre:    searchPattern,
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search proveedores: %w", err)
		}
		count, err := s.queries.CountSearchProveedores(ctx, repository.CountSearchProveedoresParams{
			UsuarioID: userID,
			Nombre:    searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search proveedores: %w", err)
		}
		return toProveedorResponses(items), int(count), nil
	}

	items, err := s.queries.ListProveedores(ctx, repository.ListProveedoresParams{
		UsuarioID: userID,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list proveedores: %w", err)
	}
	count, err := s.queries.CountProveedores(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count proveedores: %w", err)
	}
	return toProveedorResponses(items), int(count), nil
}

// --- Mapper ---

func toProveedorResponse(p repository.Proveedore) *ProveedorResponse {
	resp := &ProveedorResponse{
		ID:        uuidStrFromPg(p.ID),
		Nombre:    p.Nombre,
		Cuit:      textFromPg(p.Cuit),
		Email:     textFromPg(p.Email),
		Telefono:  textFromPg(p.Telefono),
		Direccion: textFromPg(p.Direccion),
		Contacto:  textFromPg(p.Contacto),
		Banco:     textFromPg(p.Banco),
		Cbu:       textFromPg(p.Cbu),
		Alias:     textFromPg(p.Alias),
		Notas:     textFromPg(p.Notas),
		CreatedAt: p.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt: p.UpdatedAt.Time.Format(time.RFC3339),
	}
	if p.CondicionIva.Valid {
		resp.CondicionIva = string(p.CondicionIva.CondicionIva)
	}
	return resp
}

func toProveedorResponses(items []repository.Proveedore) []ProveedorResponse {
	result := make([]ProveedorResponse, 0, len(items))
	for _, p := range items {
		result = append(result, *toProveedorResponse(p))
	}
	return result
}
