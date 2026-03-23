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

var ErrVisitaNotFound = errors.New("visita not found")

type VisitaService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewVisitaService(db *pgxpool.Pool) *VisitaService {
	return &VisitaService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type VisitaResponse struct {
	ID               string  `json:"id"`
	VendedorID       string  `json:"vendedor_id"`
	VendedorNombre   string  `json:"vendedor_nombre"`
	ClienteID        string  `json:"cliente_id"`
	ClienteNombre    string  `json:"cliente_nombre"`
	DireccionID      string  `json:"direccion_id,omitempty"`
	DireccionResumen string  `json:"direccion_resumen,omitempty"`
	Fecha            string  `json:"fecha"`
	HoraInicio       string  `json:"hora_inicio,omitempty"`
	HoraFin          string  `json:"hora_fin,omitempty"`
	DuracionMinutos  int     `json:"duracion_minutos,omitempty"`
	Resultado        string  `json:"resultado"`
	PedidoGeneradoID string  `json:"pedido_generado_id,omitempty"`
	Latitud          float64 `json:"latitud,omitempty"`
	Longitud         float64 `json:"longitud,omitempty"`
	Notas            string  `json:"notas,omitempty"`
	CreatedAt        string  `json:"created_at"`
}

type VisitaListResponse struct {
	ID              string `json:"id"`
	VendedorNombre  string `json:"vendedor_nombre"`
	ClienteID       string `json:"cliente_id"`
	ClienteNombre   string `json:"cliente_nombre"`
	Fecha           string `json:"fecha"`
	HoraInicio      string `json:"hora_inicio,omitempty"`
	HoraFin         string `json:"hora_fin,omitempty"`
	DuracionMinutos int    `json:"duracion_minutos,omitempty"`
	Resultado       string `json:"resultado"`
	Notas           string `json:"notas,omitempty"`
	CreatedAt       string `json:"created_at"`
}

type VisitaHoyResponse struct {
	ID               string  `json:"id"`
	VendedorNombre   string  `json:"vendedor_nombre"`
	ClienteID        string  `json:"cliente_id"`
	ClienteNombre    string  `json:"cliente_nombre"`
	DireccionID      string  `json:"direccion_id,omitempty"`
	DireccionResumen string  `json:"direccion_resumen,omitempty"`
	Fecha            string  `json:"fecha"`
	HoraInicio       string  `json:"hora_inicio,omitempty"`
	HoraFin          string  `json:"hora_fin,omitempty"`
	DuracionMinutos  int     `json:"duracion_minutos,omitempty"`
	Resultado        string  `json:"resultado"`
	Latitud          float64 `json:"latitud,omitempty"`
	Longitud         float64 `json:"longitud,omitempty"`
	Notas            string  `json:"notas,omitempty"`
	CreatedAt        string  `json:"created_at"`
}

type CreateVisitaInput struct {
	VendedorID  string  `json:"vendedor_id" validate:"required,uuid"`
	ClienteID   string  `json:"cliente_id" validate:"required,uuid"`
	DireccionID string  `json:"direccion_id"`
	Fecha       string  `json:"fecha" validate:"required"`
	HoraInicio  string  `json:"hora_inicio"`
	Resultado   string  `json:"resultado"`
	Latitud     float64 `json:"latitud"`
	Longitud    float64 `json:"longitud"`
	Notas       string  `json:"notas"`
}

type UpdateVisitaInput struct {
	HoraFin          string `json:"hora_fin"`
	DuracionMinutos  int    `json:"duracion_minutos"`
	Resultado        string `json:"resultado" validate:"required,oneof=PENDIENTE REALIZADA NO_ATENDIDO REPROGRAMADA CANCELADA"`
	PedidoGeneradoID string `json:"pedido_generado_id"`
	Notas            string `json:"notas"`
}

// --- Helpers ---

func pgTime(s string) pgtype.Time {
	if s == "" {
		return pgtype.Time{}
	}
	t, err := time.Parse("15:04", s)
	if err != nil {
		t, err = time.Parse("15:04:05", s)
		if err != nil {
			return pgtype.Time{}
		}
	}
	microseconds := int64(t.Hour())*3600000000 + int64(t.Minute())*60000000 + int64(t.Second())*1000000
	return pgtype.Time{Microseconds: microseconds, Valid: true}
}

func timeFromPg(t pgtype.Time) string {
	if !t.Valid {
		return ""
	}
	totalSeconds := t.Microseconds / 1000000
	hours := totalSeconds / 3600
	minutes := (totalSeconds % 3600) / 60
	return fmt.Sprintf("%02d:%02d", hours, minutes)
}

// --- Methods ---

func (s *VisitaService) List(ctx context.Context, userID pgtype.UUID, vendedorID, fechaDesde, fechaHasta, resultado string, limit, offset int32) ([]VisitaListResponse, int, error) {
	pgVendedorID := pgtype.UUID{}
	if vendedorID != "" {
		id, err := pgUUID(vendedorID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid vendedor_id")
		}
		pgVendedorID = id
	}

	pgFechaDesde := pgtype.Date{}
	if fechaDesde != "" {
		d, err := pgDate(fechaDesde)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid fecha_desde")
		}
		pgFechaDesde = d
	}

	pgFechaHasta := pgtype.Date{}
	if fechaHasta != "" {
		d, err := pgDate(fechaHasta)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid fecha_hasta")
		}
		pgFechaHasta = d
	}

	pgResultado := pgtype.Text{}
	if resultado != "" {
		pgResultado = pgtype.Text{String: resultado, Valid: true}
	}

	items, err := s.queries.ListVisitas(ctx, repository.ListVisitasParams{
		UsuarioID:   userID,
		VendedorID:  pgVendedorID,
		FechaDesde:  pgFechaDesde,
		FechaHasta:  pgFechaHasta,
		Resultado:   pgResultado,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list visitas: %w", err)
	}

	count, err := s.queries.CountVisitas(ctx, repository.CountVisitasParams{
		UsuarioID:  userID,
		VendedorID: pgVendedorID,
		FechaDesde: pgFechaDesde,
		FechaHasta: pgFechaHasta,
		Resultado:  pgResultado,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count visitas: %w", err)
	}

	result := make([]VisitaListResponse, 0, len(items))
	for _, v := range items {
		var duracion int
		if v.DuracionMinutos.Valid {
			duracion = int(v.DuracionMinutos.Int32)
		}
		result = append(result, VisitaListResponse{
			ID:              uuidStrFromPg(v.ID),
			VendedorNombre:  v.VendedorNombre,
			ClienteID:       uuidStrFromPg(v.ClienteID),
			ClienteNombre:   v.ClienteNombre,
			Fecha:           dateFromPg(v.Fecha),
			HoraInicio:      timeFromPg(v.HoraInicio),
			HoraFin:         timeFromPg(v.HoraFin),
			DuracionMinutos: duracion,
			Resultado:       v.Resultado,
			Notas:           textFromPg(v.Notas),
			CreatedAt:       v.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, int(count), nil
}

func (s *VisitaService) ListToday(ctx context.Context, userID pgtype.UUID, vendedorID string) ([]VisitaHoyResponse, error) {
	pgVendedorID, err := pgUUID(vendedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid vendedor_id")
	}

	items, err := s.queries.ListVisitasByVendedorHoy(ctx, repository.ListVisitasByVendedorHoyParams{
		UsuarioID:  userID,
		VendedorID: pgVendedorID,
	})
	if err != nil {
		return nil, fmt.Errorf("list visitas hoy: %w", err)
	}

	result := make([]VisitaHoyResponse, 0, len(items))
	for _, v := range items {
		var duracion int
		if v.DuracionMinutos.Valid {
			duracion = int(v.DuracionMinutos.Int32)
		}
		result = append(result, VisitaHoyResponse{
			ID:               uuidStrFromPg(v.ID),
			VendedorNombre:   v.VendedorNombre,
			ClienteID:        uuidStrFromPg(v.ClienteID),
			ClienteNombre:    v.ClienteNombre,
			DireccionID:      uuidStrFromPg(v.DireccionID),
			DireccionResumen: v.DireccionResumen,
			Fecha:            dateFromPg(v.Fecha),
			HoraInicio:       timeFromPg(v.HoraInicio),
			HoraFin:          timeFromPg(v.HoraFin),
			DuracionMinutos:  duracion,
			Resultado:        v.Resultado,
			Latitud:          coordFromNumeric(v.Latitud),
			Longitud:         coordFromNumeric(v.Longitud),
			Notas:            textFromPg(v.Notas),
			CreatedAt:        v.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, nil
}

func (s *VisitaService) Get(ctx context.Context, userID pgtype.UUID, id string) (*VisitaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrVisitaNotFound
	}

	v, err := s.queries.GetVisitaByID(ctx, repository.GetVisitaByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrVisitaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get visita: %w", err)
	}

	var duracion int
	if v.DuracionMinutos.Valid {
		duracion = int(v.DuracionMinutos.Int32)
	}

	resp := VisitaResponse{
		ID:               uuidStrFromPg(v.ID),
		VendedorID:       uuidStrFromPg(v.VendedorID),
		VendedorNombre:   v.VendedorNombre,
		ClienteID:        uuidStrFromPg(v.ClienteID),
		ClienteNombre:    v.ClienteNombre,
		DireccionID:      uuidStrFromPg(v.DireccionID),
		DireccionResumen: v.DireccionResumen,
		Fecha:            dateFromPg(v.Fecha),
		HoraInicio:       timeFromPg(v.HoraInicio),
		HoraFin:          timeFromPg(v.HoraFin),
		DuracionMinutos:  duracion,
		Resultado:        v.Resultado,
		PedidoGeneradoID: uuidStrFromPg(v.PedidoGeneradoID),
		Latitud:          coordFromNumeric(v.Latitud),
		Longitud:         coordFromNumeric(v.Longitud),
		Notas:            textFromPg(v.Notas),
		CreatedAt:        v.CreatedAt.Time.Format(time.RFC3339),
	}
	return &resp, nil
}

func (s *VisitaService) Create(ctx context.Context, userID pgtype.UUID, input CreateVisitaInput) (*VisitaResponse, error) {
	vendedorID, err := pgUUID(input.VendedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid vendedor_id")
	}

	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	direccionID := pgtype.UUID{}
	if input.DireccionID != "" {
		d, err := pgUUID(input.DireccionID)
		if err != nil {
			return nil, fmt.Errorf("invalid direccion_id")
		}
		direccionID = d
	}

	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha: %w", err)
	}

	resultado := input.Resultado
	if resultado == "" {
		resultado = "PENDIENTE"
	}

	v, err := s.queries.CreateVisitaCliente(ctx, repository.CreateVisitaClienteParams{
		VendedorID:  vendedorID,
		ClienteID:   clienteID,
		DireccionID: direccionID,
		Fecha:       fecha,
		HoraInicio:  pgTime(input.HoraInicio),
		Resultado:   resultado,
		Latitud:     coordToNumeric(input.Latitud),
		Longitud:    coordToNumeric(input.Longitud),
		Notas:       pgText(input.Notas),
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create visita: %w", err)
	}

	// Return a minimal response from the created record (no JOINs)
	resp := VisitaResponse{
		ID:         uuidStrFromPg(v.ID),
		VendedorID: uuidStrFromPg(v.VendedorID),
		ClienteID:  uuidStrFromPg(v.ClienteID),
		Fecha:      dateFromPg(v.Fecha),
		HoraInicio: timeFromPg(v.HoraInicio),
		Resultado:  v.Resultado,
		Latitud:    coordFromNumeric(v.Latitud),
		Longitud:   coordFromNumeric(v.Longitud),
		Notas:      textFromPg(v.Notas),
		CreatedAt:  v.CreatedAt.Time.Format(time.RFC3339),
	}
	return &resp, nil
}

func (s *VisitaService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateVisitaInput) (*VisitaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrVisitaNotFound
	}

	pedidoID := pgtype.UUID{}
	if input.PedidoGeneradoID != "" {
		p, err := pgUUID(input.PedidoGeneradoID)
		if err != nil {
			return nil, fmt.Errorf("invalid pedido_generado_id")
		}
		pedidoID = p
	}

	v, err := s.queries.UpdateVisitaCliente(ctx, repository.UpdateVisitaClienteParams{
		ID:               pgID,
		UsuarioID:        userID,
		HoraFin:          pgTime(input.HoraFin),
		DuracionMinutos:  pgInt4(input.DuracionMinutos),
		Resultado:        input.Resultado,
		PedidoGeneradoID: pedidoID,
		Notas:            pgText(input.Notas),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrVisitaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update visita: %w", err)
	}

	var duracion int
	if v.DuracionMinutos.Valid {
		duracion = int(v.DuracionMinutos.Int32)
	}

	resp := VisitaResponse{
		ID:               uuidStrFromPg(v.ID),
		VendedorID:       uuidStrFromPg(v.VendedorID),
		ClienteID:        uuidStrFromPg(v.ClienteID),
		DireccionID:      uuidStrFromPg(v.DireccionID),
		Fecha:            dateFromPg(v.Fecha),
		HoraInicio:       timeFromPg(v.HoraInicio),
		HoraFin:          timeFromPg(v.HoraFin),
		DuracionMinutos:  duracion,
		Resultado:        v.Resultado,
		PedidoGeneradoID: uuidStrFromPg(v.PedidoGeneradoID),
		Latitud:          coordFromNumeric(v.Latitud),
		Longitud:         coordFromNumeric(v.Longitud),
		Notas:            textFromPg(v.Notas),
		CreatedAt:        v.CreatedAt.Time.Format(time.RFC3339),
	}
	return &resp, nil
}

func (s *VisitaService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrVisitaNotFound
	}

	return s.queries.SoftDeleteVisitaCliente(ctx, repository.SoftDeleteVisitaClienteParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}
