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

var ErrSalidaNotFound = errors.New("salida not found")

type SalidaVendedorService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewSalidaVendedorService(db *pgxpool.Pool) *SalidaVendedorService {
	return &SalidaVendedorService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type SalidaVendedorResponse struct {
	ID             string  `json:"id"`
	EmpleadoID     string  `json:"empleado_id"`
	EmpleadoNombre string  `json:"empleado_nombre"`
	SucursalID     string  `json:"sucursal_id"`
	SucursalNombre string  `json:"sucursal_nombre,omitempty"`
	Fecha          string  `json:"fecha"`
	HoraSalida     string  `json:"hora_salida,omitempty"`
	HoraRegreso    string  `json:"hora_regreso,omitempty"`
	KmInicio       float64 `json:"km_inicio,omitempty"`
	KmFin          float64 `json:"km_fin,omitempty"`
	KmRecorridos   float64 `json:"km_recorridos"`
	Estado         string  `json:"estado"`
	Observaciones  string  `json:"observaciones,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type RegistrarSalidaInput struct {
	EmpleadoID    string  `json:"empleado_id" validate:"required,uuid"`
	SucursalID    string  `json:"sucursal_id" validate:"required,uuid"`
	KmInicio      float64 `json:"km_inicio"`
	Observaciones string  `json:"observaciones"`
}

type RegistrarRegresoInput struct {
	KmFin         float64 `json:"km_fin"`
	Observaciones string  `json:"observaciones"`
}

// --- Methods ---

func (s *SalidaVendedorService) ListByFecha(ctx context.Context, userID pgtype.UUID, fecha string, limit, offset int32) ([]SalidaVendedorResponse, int, error) {
	pgFecha, err := pgDate(fecha)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid fecha: %w", err)
	}

	items, err := s.queries.ListSalidasByFecha(ctx, repository.ListSalidasByFechaParams{
		Fecha:       pgFecha,
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list salidas: %w", err)
	}

	count, err := s.queries.CountSalidasByFecha(ctx, repository.CountSalidasByFechaParams{
		Fecha:     pgFecha,
		UsuarioID: userID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count salidas: %w", err)
	}

	result := make([]SalidaVendedorResponse, 0, len(items))
	for _, item := range items {
		result = append(result, toSalidaRowResponse(item))
	}
	return result, int(count), nil
}

func (s *SalidaVendedorService) ListByEmpleado(ctx context.Context, userID pgtype.UUID, empleadoID string, limit, offset int32) ([]SalidaVendedorResponse, int, error) {
	pgEmpleadoID, err := pgUUID(empleadoID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid empleado_id")
	}

	items, err := s.queries.ListSalidasByEmpleado(ctx, repository.ListSalidasByEmpleadoParams{
		EmpleadoID:  pgEmpleadoID,
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list salidas by empleado: %w", err)
	}

	count, err := s.queries.CountSalidasByEmpleado(ctx, repository.CountSalidasByEmpleadoParams{
		EmpleadoID: pgEmpleadoID,
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count salidas by empleado: %w", err)
	}

	result := make([]SalidaVendedorResponse, 0, len(items))
	for _, item := range items {
		result = append(result, toSalidaRowResponse(item))
	}
	return result, int(count), nil
}

func (s *SalidaVendedorService) Get(ctx context.Context, userID pgtype.UUID, id string) (*SalidaVendedorResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrSalidaNotFound
	}

	row, err := s.queries.GetSalidaByID(ctx, repository.GetSalidaByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrSalidaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get salida: %w", err)
	}

	resp := toSalidaDetailResponse(row)
	return &resp, nil
}

func (s *SalidaVendedorService) RegistrarSalida(ctx context.Context, userID pgtype.UUID, input RegistrarSalidaInput) (*SalidaVendedorResponse, error) {
	empleadoID, err := pgUUID(input.EmpleadoID)
	if err != nil {
		return nil, fmt.Errorf("invalid empleado_id")
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	salida, err := s.queries.CreateSalidaVendedor(ctx, repository.CreateSalidaVendedorParams{
		EmpleadoID:    empleadoID,
		SucursalID:    sucursalID,
		KmInicio:      numericFromFloat(input.KmInicio),
		Observaciones: pgText(input.Observaciones),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create salida: %w", err)
	}

	resp := toSalidaBaseResponse(salida)
	return &resp, nil
}

func (s *SalidaVendedorService) RegistrarRegreso(ctx context.Context, userID pgtype.UUID, id string, input RegistrarRegresoInput) (*SalidaVendedorResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrSalidaNotFound
	}

	salida, err := s.queries.UpdateSalidaRegreso(ctx, repository.UpdateSalidaRegresoParams{
		ID:            pgID,
		UsuarioID:     userID,
		KmFin:         numericFromFloat(input.KmFin),
		Observaciones: pgText(input.Observaciones),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrSalidaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update salida regreso: %w", err)
	}

	resp := toSalidaBaseResponse(salida)
	return &resp, nil
}

func (s *SalidaVendedorService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrSalidaNotFound
	}

	return s.queries.SoftDeleteSalida(ctx, repository.SoftDeleteSalidaParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

// --- Helpers ---

func toSalidaBaseResponse(s repository.SalidaVendedor) SalidaVendedorResponse {
	resp := SalidaVendedorResponse{
		ID:           uuidStrFromPg(s.ID),
		EmpleadoID:   uuidStrFromPg(s.EmpleadoID),
		SucursalID:   uuidStrFromPg(s.SucursalID),
		Fecha:        dateFromPg(s.Fecha),
		KmInicio:     floatFromNumeric(s.KmInicio),
		KmFin:        floatFromNumeric(s.KmFin),
		KmRecorridos: floatFromNumeric(s.KmRecorridos),
		Estado:       s.Estado,
		Observaciones: textFromPg(s.Observaciones),
		CreatedAt:    s.CreatedAt.Time.Format(time.RFC3339),
	}
	if s.HoraSalida.Valid {
		resp.HoraSalida = s.HoraSalida.Time.Format(time.RFC3339)
	}
	if s.HoraRegreso.Valid {
		resp.HoraRegreso = s.HoraRegreso.Time.Format(time.RFC3339)
	}
	return resp
}

func toSalidaRowResponse(row repository.ListSalidasByFechaRow) SalidaVendedorResponse {
	resp := SalidaVendedorResponse{
		ID:             uuidStrFromPg(row.ID),
		EmpleadoID:     uuidStrFromPg(row.EmpleadoID),
		EmpleadoNombre: row.EmpleadoNombre,
		SucursalNombre: row.SucursalNombre,
		Fecha:          dateFromPg(row.Fecha),
		KmInicio:       floatFromNumeric(row.KmInicio),
		KmFin:          floatFromNumeric(row.KmFin),
		KmRecorridos:   floatFromNumeric(row.KmRecorridos),
		Estado:         row.Estado,
		Observaciones:  textFromPg(row.Observaciones),
		CreatedAt:      row.CreatedAt.Time.Format(time.RFC3339),
	}
	if row.HoraSalida.Valid {
		resp.HoraSalida = row.HoraSalida.Time.Format(time.RFC3339)
	}
	if row.HoraRegreso.Valid {
		resp.HoraRegreso = row.HoraRegreso.Time.Format(time.RFC3339)
	}
	return resp
}

func toSalidaDetailResponse(row repository.GetSalidaByIDRow) SalidaVendedorResponse {
	resp := SalidaVendedorResponse{
		ID:             uuidStrFromPg(row.ID),
		EmpleadoID:     uuidStrFromPg(row.EmpleadoID),
		EmpleadoNombre: row.EmpleadoNombre,
		SucursalID:     uuidStrFromPg(row.SucursalID),
		SucursalNombre: row.SucursalNombre,
		Fecha:          dateFromPg(row.Fecha),
		KmInicio:       floatFromNumeric(row.KmInicio),
		KmFin:          floatFromNumeric(row.KmFin),
		KmRecorridos:   floatFromNumeric(row.KmRecorridos),
		Estado:         row.Estado,
		Observaciones:  textFromPg(row.Observaciones),
		CreatedAt:      row.CreatedAt.Time.Format(time.RFC3339),
	}
	if row.HoraSalida.Valid {
		resp.HoraSalida = row.HoraSalida.Time.Format(time.RFC3339)
	}
	if row.HoraRegreso.Valid {
		resp.HoraRegreso = row.HoraRegreso.Time.Format(time.RFC3339)
	}
	return resp
}
