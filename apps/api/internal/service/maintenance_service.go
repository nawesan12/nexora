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

var ErrMantenimientoNotFound = errors.New("maintenance record not found")

type MaintenanceService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewMaintenanceService(db *pgxpool.Pool) *MaintenanceService {
	return &MaintenanceService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type MantenimientoResponse struct {
	ID            string  `json:"id"`
	VehiculoID    string  `json:"vehiculo_id"`
	Tipo          string  `json:"tipo"`
	Descripcion   string  `json:"descripcion,omitempty"`
	Fecha         string  `json:"fecha"`
	ProximoFecha  string  `json:"proximo_fecha,omitempty"`
	ProximoKm     int     `json:"proximo_km,omitempty"`
	Costo         float64 `json:"costo,omitempty"`
	Proveedor     string  `json:"proveedor,omitempty"`
	NumeroFactura string  `json:"numero_factura,omitempty"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
}

type CreateMantenimientoInput struct {
	VehiculoID    string  `json:"vehiculo_id" validate:"required,uuid"`
	Tipo          string  `json:"tipo" validate:"required,min=2,max=100"`
	Descripcion   string  `json:"descripcion"`
	Fecha         string  `json:"fecha" validate:"required"`
	ProximoFecha  string  `json:"proximo_fecha"`
	ProximoKm     int     `json:"proximo_km"`
	Costo         float64 `json:"costo"`
	Proveedor     string  `json:"proveedor"`
	NumeroFactura string  `json:"numero_factura"`
}

type UpdateMantenimientoInput struct {
	Tipo          string  `json:"tipo" validate:"required,min=2,max=100"`
	Descripcion   string  `json:"descripcion"`
	Fecha         string  `json:"fecha" validate:"required"`
	ProximoFecha  string  `json:"proximo_fecha"`
	ProximoKm     int     `json:"proximo_km"`
	Costo         float64 `json:"costo"`
	Proveedor     string  `json:"proveedor"`
	NumeroFactura string  `json:"numero_factura"`
}

// --- Methods ---

func (s *MaintenanceService) List(ctx context.Context, userID pgtype.UUID, vehiculoID string, limit, offset int32) ([]MantenimientoResponse, int, error) {
	if vehiculoID != "" {
		pgVehiculoID, err := pgUUID(vehiculoID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid vehiculo_id")
		}

		items, err := s.queries.ListMantenimientosByVehiculo(ctx, repository.ListMantenimientosByVehiculoParams{
			VehiculoID:  pgVehiculoID,
			UsuarioID:   userID,
			QueryLimit:  limit,
			QueryOffset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list mantenimientos: %w", err)
		}

		count, err := s.queries.CountMantenimientosByVehiculo(ctx, repository.CountMantenimientosByVehiculoParams{
			VehiculoID: pgVehiculoID,
			UsuarioID:  userID,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count mantenimientos: %w", err)
		}

		result := make([]MantenimientoResponse, 0, len(items))
		for _, m := range items {
			result = append(result, toMantenimientoResponse(m))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListMantenimientos(ctx, repository.ListMantenimientosParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list mantenimientos: %w", err)
	}

	count, err := s.queries.CountMantenimientos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count mantenimientos: %w", err)
	}

	result := make([]MantenimientoResponse, 0, len(items))
	for _, m := range items {
		result = append(result, toMantenimientoResponse(m))
	}
	return result, int(count), nil
}

func (s *MaintenanceService) Get(ctx context.Context, userID pgtype.UUID, id string) (*MantenimientoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrMantenimientoNotFound
	}

	m, err := s.queries.GetMantenimientoVehiculoByID(ctx, repository.GetMantenimientoVehiculoByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMantenimientoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get mantenimiento: %w", err)
	}

	resp := toMantenimientoResponse(m)
	return &resp, nil
}

func (s *MaintenanceService) Create(ctx context.Context, userID pgtype.UUID, input CreateMantenimientoInput) (*MantenimientoResponse, error) {
	vehiculoID, err := pgUUID(input.VehiculoID)
	if err != nil {
		return nil, fmt.Errorf("invalid vehiculo_id")
	}

	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha: %w", err)
	}

	proximoFecha, err := pgDate(input.ProximoFecha)
	if err != nil {
		return nil, fmt.Errorf("invalid proximo_fecha: %w", err)
	}

	m, err := s.queries.CreateMantenimientoVehiculo(ctx, repository.CreateMantenimientoVehiculoParams{
		VehiculoID:    vehiculoID,
		Tipo:          input.Tipo,
		Descripcion:   pgText(input.Descripcion),
		Fecha:         fecha,
		ProximoFecha:  proximoFecha,
		ProximoKm:     pgInt4(input.ProximoKm),
		Costo:         numericFromFloat(input.Costo),
		Proveedor:     pgText(input.Proveedor),
		NumeroFactura: pgText(input.NumeroFactura),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create mantenimiento: %w", err)
	}

	resp := toMantenimientoResponse(m)
	return &resp, nil
}

func (s *MaintenanceService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateMantenimientoInput) (*MantenimientoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrMantenimientoNotFound
	}

	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha: %w", err)
	}

	proximoFecha, err := pgDate(input.ProximoFecha)
	if err != nil {
		return nil, fmt.Errorf("invalid proximo_fecha: %w", err)
	}

	m, err := s.queries.UpdateMantenimientoVehiculo(ctx, repository.UpdateMantenimientoVehiculoParams{
		ID:            pgID,
		UsuarioID:     userID,
		Tipo:          input.Tipo,
		Descripcion:   pgText(input.Descripcion),
		Fecha:         fecha,
		ProximoFecha:  proximoFecha,
		ProximoKm:     pgInt4(input.ProximoKm),
		Costo:         numericFromFloat(input.Costo),
		Proveedor:     pgText(input.Proveedor),
		NumeroFactura: pgText(input.NumeroFactura),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMantenimientoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update mantenimiento: %w", err)
	}

	resp := toMantenimientoResponse(m)
	return &resp, nil
}

func (s *MaintenanceService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrMantenimientoNotFound
	}

	return s.queries.SoftDeleteMantenimientoVehiculo(ctx, repository.SoftDeleteMantenimientoVehiculoParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func toMantenimientoResponse(m repository.MantenimientoVehiculo) MantenimientoResponse {
	var proximoKm int
	if m.ProximoKm.Valid {
		proximoKm = int(m.ProximoKm.Int32)
	}

	return MantenimientoResponse{
		ID:            uuidStrFromPg(m.ID),
		VehiculoID:    uuidStrFromPg(m.VehiculoID),
		Tipo:          m.Tipo,
		Descripcion:   textFromPg(m.Descripcion),
		Fecha:         dateFromPg(m.Fecha),
		ProximoFecha:  dateFromPg(m.ProximoFecha),
		ProximoKm:     proximoKm,
		Costo:         floatFromNumeric(m.Costo),
		Proveedor:     textFromPg(m.Proveedor),
		NumeroFactura: textFromPg(m.NumeroFactura),
		CreatedAt:     m.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:     m.UpdatedAt.Time.Format(time.RFC3339),
	}
}
