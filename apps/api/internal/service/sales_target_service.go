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

var ErrMetaVentaNotFound = errors.New("meta de venta not found")

type SalesTargetService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewSalesTargetService(db *pgxpool.Pool) *SalesTargetService {
	return &SalesTargetService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type MetaVentaResponse struct {
	ID            string  `json:"id"`
	Nombre        string  `json:"nombre"`
	Tipo          string  `json:"tipo"`
	EmpleadoID    string  `json:"empleado_id,omitempty"`
	SucursalID    string  `json:"sucursal_id,omitempty"`
	MontoObjetivo float64 `json:"monto_objetivo"`
	MontoActual   float64 `json:"monto_actual"`
	Progreso      float64 `json:"progreso"`
	FechaInicio   string  `json:"fecha_inicio"`
	FechaFin      string  `json:"fecha_fin"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
}

type CreateMetaVentaInput struct {
	Nombre        string  `json:"nombre" validate:"required,min=2,max=200"`
	Tipo          string  `json:"tipo" validate:"required,oneof=EMPLEADO SUCURSAL"`
	EmpleadoID    string  `json:"empleado_id"`
	SucursalID    string  `json:"sucursal_id"`
	MontoObjetivo float64 `json:"monto_objetivo" validate:"required,gt=0"`
	FechaInicio   string  `json:"fecha_inicio" validate:"required"`
	FechaFin      string  `json:"fecha_fin" validate:"required"`
}

type UpdateMetaVentaInput struct {
	Nombre        string  `json:"nombre" validate:"required,min=2,max=200"`
	Tipo          string  `json:"tipo" validate:"required,oneof=EMPLEADO SUCURSAL"`
	EmpleadoID    string  `json:"empleado_id"`
	SucursalID    string  `json:"sucursal_id"`
	MontoObjetivo float64 `json:"monto_objetivo" validate:"required,gt=0"`
	FechaInicio   string  `json:"fecha_inicio" validate:"required"`
	FechaFin      string  `json:"fecha_fin" validate:"required"`
}

// --- Methods ---

func (s *SalesTargetService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]MetaVentaResponse, int, error) {
	items, err := s.queries.ListMetasVenta(ctx, repository.ListMetasVentaParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list metas venta: %w", err)
	}

	count, err := s.queries.CountMetasVenta(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count metas venta: %w", err)
	}

	result := make([]MetaVentaResponse, 0, len(items))
	for _, m := range items {
		result = append(result, toMetaVentaResponse(m))
	}
	return result, int(count), nil
}

func (s *SalesTargetService) Get(ctx context.Context, userID pgtype.UUID, id string) (*MetaVentaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrMetaVentaNotFound
	}

	m, err := s.queries.GetMetaVentaByID(ctx, repository.GetMetaVentaByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMetaVentaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get meta venta: %w", err)
	}

	resp := toMetaVentaResponse(m)
	return &resp, nil
}

func (s *SalesTargetService) Create(ctx context.Context, userID pgtype.UUID, input CreateMetaVentaInput) (*MetaVentaResponse, error) {
	var empleadoID pgtype.UUID
	if input.EmpleadoID != "" {
		var err error
		empleadoID, err = pgUUID(input.EmpleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		var err error
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio: %w", err)
	}
	fechaFin, err := pgDate(input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin: %w", err)
	}

	m, err := s.queries.CreateMetaVenta(ctx, repository.CreateMetaVentaParams{
		Nombre:        input.Nombre,
		Tipo:          input.Tipo,
		EmpleadoID:    empleadoID,
		SucursalID:    sucursalID,
		MontoObjetivo: numericFromFloat(input.MontoObjetivo),
		FechaInicio:   fechaInicio,
		FechaFin:      fechaFin,
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create meta venta: %w", err)
	}

	resp := toMetaVentaResponse(m)
	return &resp, nil
}

func (s *SalesTargetService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateMetaVentaInput) (*MetaVentaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrMetaVentaNotFound
	}

	var empleadoID pgtype.UUID
	if input.EmpleadoID != "" {
		empleadoID, err = pgUUID(input.EmpleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	fechaInicio, err := pgDate(input.FechaInicio)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_inicio: %w", err)
	}
	fechaFin, err := pgDate(input.FechaFin)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fin: %w", err)
	}

	m, err := s.queries.UpdateMetaVenta(ctx, repository.UpdateMetaVentaParams{
		ID:            pgID,
		UsuarioID:     userID,
		Nombre:        input.Nombre,
		Tipo:          input.Tipo,
		EmpleadoID:    empleadoID,
		SucursalID:    sucursalID,
		MontoObjetivo: numericFromFloat(input.MontoObjetivo),
		FechaInicio:   fechaInicio,
		FechaFin:      fechaFin,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMetaVentaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update meta venta: %w", err)
	}

	resp := toMetaVentaResponse(m)
	return &resp, nil
}

func (s *SalesTargetService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrMetaVentaNotFound
	}

	return s.queries.SoftDeleteMetaVenta(ctx, repository.SoftDeleteMetaVentaParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func (s *SalesTargetService) UpdateProgress(ctx context.Context, userID pgtype.UUID, empleadoID, sucursalID string, monto float64) error {
	// Find active metas matching the criteria
	items, err := s.queries.ListMetasVenta(ctx, repository.ListMetasVentaParams{
		UsuarioID:   userID,
		QueryLimit:  100,
		QueryOffset: 0,
	})
	if err != nil {
		return fmt.Errorf("list metas: %w", err)
	}

	now := time.Now()
	for _, m := range items {
		if !m.FechaInicio.Valid || !m.FechaFin.Valid {
			continue
		}
		if now.Before(m.FechaInicio.Time) || now.After(m.FechaFin.Time) {
			continue
		}

		match := false
		if m.Tipo == "EMPLEADO" && empleadoID != "" {
			empID := uuidStrFromPg(m.EmpleadoID)
			if empID == empleadoID {
				match = true
			}
		}
		if m.Tipo == "SUCURSAL" && sucursalID != "" {
			sucID := uuidStrFromPg(m.SucursalID)
			if sucID == sucursalID {
				match = true
			}
		}

		if match {
			_, err := s.queries.UpdateMetaMontoActual(ctx, repository.UpdateMetaMontoActualParams{
				ID:    m.ID,
				Monto: numericFromFloat(monto),
			})
			if err != nil {
				return fmt.Errorf("update meta monto: %w", err)
			}
		}
	}
	return nil
}

func toMetaVentaResponse(m repository.MetaVenta) MetaVentaResponse {
	objetivo := floatFromNumeric(m.MontoObjetivo)
	actual := floatFromNumeric(m.MontoActual)
	var progreso float64
	if objetivo > 0 {
		progreso = (actual / objetivo) * 100
	}

	return MetaVentaResponse{
		ID:            uuidStrFromPg(m.ID),
		Nombre:        m.Nombre,
		Tipo:          m.Tipo,
		EmpleadoID:    uuidStrFromPg(m.EmpleadoID),
		SucursalID:    uuidStrFromPg(m.SucursalID),
		MontoObjetivo: objetivo,
		MontoActual:   actual,
		Progreso:      progreso,
		FechaInicio:   dateFromPg(m.FechaInicio),
		FechaFin:      dateFromPg(m.FechaFin),
		CreatedAt:     m.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:     m.UpdatedAt.Time.Format(time.RFC3339),
	}
}
