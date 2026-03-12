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
	ErrPresupuestoNotFound = errors.New("presupuesto not found")
)

type PresupuestoService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewPresupuestoService(db *pgxpool.Pool) *PresupuestoService {
	return &PresupuestoService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type PresupuestoResponse struct {
	ID             string  `json:"id"`
	Nombre         string  `json:"nombre"`
	MontoAsignado  float64 `json:"monto_asignado"`
	MontoUtilizado float64 `json:"monto_utilizado"`
	Periodo        string  `json:"periodo,omitempty"`
	FechaInicio    string  `json:"fecha_inicio"`
	FechaFin       string  `json:"fecha_fin"`
	Estado         string  `json:"estado"`
	SucursalID     string  `json:"sucursal_id"`
	Active         bool    `json:"active"`
}

// --- Input DTOs ---

type CreatePresupuestoInput struct {
	Nombre        string  `json:"nombre" validate:"required,min=2,max=200"`
	MontoAsignado float64 `json:"monto_asignado" validate:"required,gt=0"`
	Periodo       string  `json:"periodo"`
	FechaInicio   string  `json:"fecha_inicio" validate:"required"`
	FechaFin      string  `json:"fecha_fin" validate:"required"`
	SucursalID    string  `json:"sucursal_id" validate:"required,uuid"`
}

type UpdatePresupuestoInput struct {
	Nombre        string  `json:"nombre" validate:"required,min=2,max=200"`
	MontoAsignado float64 `json:"monto_asignado" validate:"required,gt=0"`
	Periodo       string  `json:"periodo"`
	FechaInicio   string  `json:"fecha_inicio" validate:"required"`
	FechaFin      string  `json:"fecha_fin" validate:"required"`
	Estado        string  `json:"estado" validate:"required"`
	SucursalID    string  `json:"sucursal_id" validate:"required,uuid"`
}

// --- Presupuestos ---

func (s *PresupuestoService) CreatePresupuesto(ctx context.Context, userID pgtype.UUID, input CreatePresupuestoInput) (*PresupuestoResponse, error) {
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio: %w", err)
	}
	fechaFin, err := pgDate(input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin: %w", err)
	}

	p, err := s.queries.CreatePresupuesto(ctx, repository.CreatePresupuestoParams{
		Nombre:         input.Nombre,
		MontoAsignado:  numericFromFloat(input.MontoAsignado),
		MontoUtilizado: numericFromFloat(0),
		Periodo:        pgText(input.Periodo),
		FechaInicio:    fechaInicio,
		FechaFin:       fechaFin,
		Estado:         repository.EstadoPresupuesto("BORRADOR"),
		SucursalID:     sucID,
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create presupuesto: %w", err)
	}
	return toPresupuestoResponse(p), nil
}

func (s *PresupuestoService) GetPresupuesto(ctx context.Context, userID pgtype.UUID, id string) (*PresupuestoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPresupuestoNotFound
	}
	p, err := s.queries.GetPresupuestoByID(ctx, repository.GetPresupuestoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPresupuestoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get presupuesto: %w", err)
	}
	return toPresupuestoResponse(p), nil
}

func (s *PresupuestoService) ListPresupuestos(ctx context.Context, userID pgtype.UUID, estado string, limit, offset int32) ([]PresupuestoResponse, int, error) {
	if estado != "" {
		items, err := s.queries.ListPresupuestosByEstado(ctx, repository.ListPresupuestosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoPresupuesto(estado),
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list presupuestos by estado: %w", err)
		}
		count, err := s.queries.CountPresupuestosByEstado(ctx, repository.CountPresupuestosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoPresupuesto(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count presupuestos by estado: %w", err)
		}
		result := make([]PresupuestoResponse, 0, len(items))
		for _, p := range items {
			result = append(result, *toPresupuestoResponse(p))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListPresupuestos(ctx, repository.ListPresupuestosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list presupuestos: %w", err)
	}
	count, err := s.queries.CountPresupuestos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count presupuestos: %w", err)
	}
	result := make([]PresupuestoResponse, 0, len(items))
	for _, p := range items {
		result = append(result, *toPresupuestoResponse(p))
	}
	return result, int(count), nil
}

func (s *PresupuestoService) UpdatePresupuesto(ctx context.Context, userID pgtype.UUID, id string, input UpdatePresupuestoInput) (*PresupuestoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPresupuestoNotFound
	}
	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio: %w", err)
	}
	fechaFin, err := pgDate(input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin: %w", err)
	}

	sucID, err2 := pgUUID(input.SucursalID)
	if err2 != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	p, err := s.queries.UpdatePresupuesto(ctx, repository.UpdatePresupuestoParams{
		ID: pgID, UsuarioID: userID,
		Nombre:        input.Nombre,
		MontoAsignado: numericFromFloat(input.MontoAsignado),
		Periodo:       pgText(input.Periodo),
		FechaInicio:   fechaInicio,
		FechaFin:      fechaFin,
		Estado:        repository.EstadoPresupuesto(input.Estado),
		SucursalID:    sucID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPresupuestoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update presupuesto: %w", err)
	}
	return toPresupuestoResponse(p), nil
}

func (s *PresupuestoService) DeletePresupuesto(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrPresupuestoNotFound
	}
	return s.queries.SoftDeletePresupuesto(ctx, repository.SoftDeletePresupuestoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toPresupuestoResponse(p repository.Presupuesto) *PresupuestoResponse {
	return &PresupuestoResponse{
		ID:             uuidStrFromPg(p.ID),
		Nombre:         p.Nombre,
		MontoAsignado:  floatFromNumeric(p.MontoAsignado),
		MontoUtilizado: floatFromNumeric(p.MontoUtilizado),
		Periodo:        textFromPg(p.Periodo),
		FechaInicio:    dateFromPg(p.FechaInicio),
		FechaFin:       dateFromPg(p.FechaFin),
		Estado:         string(p.Estado),
		SucursalID:     uuidStrFromPg(p.SucursalID),
		Active:         p.Active,
	}
}
