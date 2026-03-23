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

var ErrContratoNotFound = errors.New("contrato not found")

type ContractService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewContractService(db *pgxpool.Pool) *ContractService {
	return &ContractService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type ContratoResponse struct {
	ID          string  `json:"id"`
	EmpleadoID  string  `json:"empleado_id"`
	Tipo        string  `json:"tipo"`
	Salario     float64 `json:"salario,omitempty"`
	FechaInicio string  `json:"fecha_inicio"`
	FechaFin    string  `json:"fecha_fin,omitempty"`
	Descripcion string  `json:"descripcion,omitempty"`
	CreatedAt   string  `json:"created_at"`
}

type CreateContratoInput struct {
	Tipo        string  `json:"tipo" validate:"required,oneof=RELACION_DEPENDENCIA MONOTRIBUTO EVENTUAL PASANTE"`
	Salario     float64 `json:"salario"`
	FechaInicio string  `json:"fecha_inicio" validate:"required"`
	FechaFin    string  `json:"fecha_fin"`
	Descripcion string  `json:"descripcion"`
}

type UpdateContratoInput struct {
	Tipo        string  `json:"tipo" validate:"required,oneof=RELACION_DEPENDENCIA MONOTRIBUTO EVENTUAL PASANTE"`
	Salario     float64 `json:"salario"`
	FechaInicio string  `json:"fecha_inicio" validate:"required"`
	FechaFin    string  `json:"fecha_fin"`
	Descripcion string  `json:"descripcion"`
}

// --- Methods ---

func (s *ContractService) List(ctx context.Context, userID pgtype.UUID, empleadoID string, limit, offset int32) ([]ContratoResponse, int, error) {
	pgEmpID, err := pgUUID(empleadoID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid empleado_id")
	}

	items, err := s.queries.ListContratosByEmpleado(ctx, repository.ListContratosByEmpleadoParams{
		EmpleadoID:  pgEmpID,
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list contratos: %w", err)
	}

	count, err := s.queries.CountContratosByEmpleado(ctx, repository.CountContratosByEmpleadoParams{
		EmpleadoID: pgEmpID,
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count contratos: %w", err)
	}

	result := make([]ContratoResponse, 0, len(items))
	for _, c := range items {
		result = append(result, toContratoResponse(c))
	}
	return result, int(count), nil
}

func (s *ContractService) Get(ctx context.Context, userID pgtype.UUID, id string) (*ContratoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrContratoNotFound
	}

	c, err := s.queries.GetContratoByID(ctx, repository.GetContratoByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrContratoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get contrato: %w", err)
	}

	resp := toContratoResponse(c)
	return &resp, nil
}

func (s *ContractService) Create(ctx context.Context, userID pgtype.UUID, empleadoID string, input CreateContratoInput) (*ContratoResponse, error) {
	pgEmpID, err := pgUUID(empleadoID)
	if err != nil {
		return nil, fmt.Errorf("invalid empleado_id")
	}

	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio: %w", err)
	}

	fechaFin, err := pgDate(input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin: %w", err)
	}

	c, err := s.queries.CreateContrato(ctx, repository.CreateContratoParams{
		EmpleadoID:  pgEmpID,
		Tipo:        input.Tipo,
		Salario:     numericFromFloat(input.Salario),
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
		Descripcion: pgText(input.Descripcion),
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create contrato: %w", err)
	}

	resp := toContratoResponse(c)
	return &resp, nil
}

func (s *ContractService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateContratoInput) (*ContratoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrContratoNotFound
	}

	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio: %w", err)
	}

	fechaFin, err := pgDate(input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin: %w", err)
	}

	c, err := s.queries.UpdateContrato(ctx, repository.UpdateContratoParams{
		ID:          pgID,
		UsuarioID:   userID,
		Tipo:        input.Tipo,
		Salario:     numericFromFloat(input.Salario),
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
		Descripcion: pgText(input.Descripcion),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrContratoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update contrato: %w", err)
	}

	resp := toContratoResponse(c)
	return &resp, nil
}

func (s *ContractService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrContratoNotFound
	}

	return s.queries.SoftDeleteContrato(ctx, repository.SoftDeleteContratoParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func toContratoResponse(c repository.Contrato) ContratoResponse {
	return ContratoResponse{
		ID:          uuidStrFromPg(c.ID),
		EmpleadoID:  uuidStrFromPg(c.EmpleadoID),
		Tipo:        c.Tipo,
		Salario:     floatFromNumeric(c.Salario),
		FechaInicio: dateFromPg(c.FechaInicio),
		FechaFin:    dateFromPg(c.FechaFin),
		Descripcion: textFromPg(c.Descripcion),
		CreatedAt:   c.CreatedAt.Time.Format(time.RFC3339),
	}
}
