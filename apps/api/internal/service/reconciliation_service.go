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

var ErrExtractoNotFound = errors.New("extracto not found")
var ErrMovimientoBancarioNotFound = errors.New("movimiento bancario not found")

type ReconciliationService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewReconciliationService(db *pgxpool.Pool) *ReconciliationService {
	return &ReconciliationService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type CreateExtractoInput struct {
	EntidadBancariaID string `json:"entidad_bancaria_id" validate:"required,uuid"`
	FechaDesde        string `json:"fecha_desde" validate:"required"`
	FechaHasta        string `json:"fecha_hasta" validate:"required"`
	ArchivoNombre     string `json:"archivo_nombre"`
}

type ExtractoResponse struct {
	ID                string `json:"id"`
	EntidadBancariaID string `json:"entidad_bancaria_id"`
	EntidadNombre     string `json:"entidad_nombre,omitempty"`
	FechaDesde        string `json:"fecha_desde"`
	FechaHasta        string `json:"fecha_hasta"`
	ArchivoNombre     string `json:"archivo_nombre,omitempty"`
	CreatedAt         string `json:"created_at"`
}

type ExtractoDetailResponse struct {
	ExtractoResponse
	Movimientos []MovimientoBancarioResponse `json:"movimientos"`
}

type MovimientoBancarioResponse struct {
	ID                 string  `json:"id"`
	ExtractoID         string  `json:"extracto_id"`
	Fecha              string  `json:"fecha"`
	Descripcion        string  `json:"descripcion"`
	Monto              float64 `json:"monto"`
	Referencia         string  `json:"referencia,omitempty"`
	EstadoConciliacion string  `json:"estado_conciliacion"`
	MovimientoCajaID   string  `json:"movimiento_caja_id,omitempty"`
	CreatedAt          string  `json:"created_at"`
}

type MovimientoBancarioItem struct {
	Fecha       string  `json:"fecha" validate:"required"`
	Descripcion string  `json:"descripcion" validate:"required"`
	Monto       float64 `json:"monto" validate:"required"`
	Referencia  string  `json:"referencia"`
}

type ImportMovimientosInput struct {
	Movimientos []MovimientoBancarioItem `json:"movimientos" validate:"required,min=1,dive"`
}

type ConciliarInput struct {
	MovimientoCajaID string `json:"movimiento_caja_id" validate:"required,uuid"`
}

type MovCajaParaConciliarResponse struct {
	ID        string  `json:"id"`
	CajaID    string  `json:"caja_id"`
	CajaNombre string `json:"caja_nombre"`
	Tipo      string  `json:"tipo"`
	Monto     float64 `json:"monto"`
	Concepto  string  `json:"concepto"`
	CreatedAt string  `json:"created_at"`
}

// --- Methods ---

func (s *ReconciliationService) CreateExtracto(ctx context.Context, userID pgtype.UUID, input CreateExtractoInput) (*ExtractoResponse, error) {
	entidadID, err := pgUUID(input.EntidadBancariaID)
	if err != nil {
		return nil, fmt.Errorf("invalid entidad_bancaria_id")
	}

	fechaDesde, err := pgDate(input.FechaDesde)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_desde: %w", err)
	}

	fechaHasta, err := pgDate(input.FechaHasta)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_hasta: %w", err)
	}

	e, err := s.queries.CreateExtracto(ctx, repository.CreateExtractoParams{
		EntidadBancariaID: entidadID,
		FechaDesde:        fechaDesde,
		FechaHasta:        fechaHasta,
		ArchivoNombre:     pgText(input.ArchivoNombre),
		UsuarioID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create extracto: %w", err)
	}

	resp := toExtractoResponse(e)
	return &resp, nil
}

func (s *ReconciliationService) ListExtractos(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]ExtractoResponse, int64, error) {
	items, err := s.queries.ListExtractos(ctx, repository.ListExtractosParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list extractos: %w", err)
	}

	count, err := s.queries.CountExtractos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count extractos: %w", err)
	}

	result := make([]ExtractoResponse, 0, len(items))
	for _, e := range items {
		result = append(result, toExtractoRowResponse(e))
	}
	return result, count, nil
}

func (s *ReconciliationService) GetExtracto(ctx context.Context, userID pgtype.UUID, id string) (*ExtractoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrExtractoNotFound
	}

	e, err := s.queries.GetExtracto(ctx, repository.GetExtractoParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrExtractoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get extracto: %w", err)
	}

	movs, err := s.queries.ListMovimientosBancarios(ctx, repository.ListMovimientosBancariosParams{
		ExtractoID: pgID,
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, fmt.Errorf("list movimientos bancarios: %w", err)
	}

	movResponses := make([]MovimientoBancarioResponse, 0, len(movs))
	for _, m := range movs {
		movResponses = append(movResponses, toMovBancarioResponse(m))
	}

	return &ExtractoDetailResponse{
		ExtractoResponse: toExtractoGetRowResponse(e),
		Movimientos:      movResponses,
	}, nil
}

func (s *ReconciliationService) ImportMovimientos(ctx context.Context, userID pgtype.UUID, extractoID string, input ImportMovimientosInput) error {
	pgExtractoID, err := pgUUID(extractoID)
	if err != nil {
		return ErrExtractoNotFound
	}

	// Verify extracto exists and belongs to user
	_, err = s.queries.GetExtracto(ctx, repository.GetExtractoParams{
		ID:        pgExtractoID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrExtractoNotFound
	}
	if err != nil {
		return fmt.Errorf("get extracto: %w", err)
	}

	for _, item := range input.Movimientos {
		fecha, err := pgDate(item.Fecha)
		if err != nil {
			return fmt.Errorf("invalid fecha %q: %w", item.Fecha, err)
		}

		_, err = s.queries.CreateMovimientoBancario(ctx, repository.CreateMovimientoBancarioParams{
			ExtractoID:  pgExtractoID,
			Fecha:       fecha,
			Descripcion: item.Descripcion,
			Monto:       numericFromFloat(item.Monto),
			Referencia:  pgText(item.Referencia),
			UsuarioID:   userID,
		})
		if err != nil {
			return fmt.Errorf("create movimiento bancario: %w", err)
		}
	}

	return nil
}

func (s *ReconciliationService) Conciliar(ctx context.Context, userID pgtype.UUID, movBancarioID string, input ConciliarInput) (*MovimientoBancarioResponse, error) {
	pgMovID, err := pgUUID(movBancarioID)
	if err != nil {
		return nil, ErrMovimientoBancarioNotFound
	}

	pgMovCajaID, err := pgUUID(input.MovimientoCajaID)
	if err != nil {
		return nil, fmt.Errorf("invalid movimiento_caja_id")
	}

	m, err := s.queries.UpdateConciliacion(ctx, repository.UpdateConciliacionParams{
		EstadoConciliacion: repository.EstadoConciliacionCONCILIADO,
		MovimientoCajaID:   pgMovCajaID,
		ID:                 pgMovID,
		UsuarioID:          userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMovimientoBancarioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("conciliar: %w", err)
	}

	resp := toMovBancarioResponse(m)
	return &resp, nil
}

func (s *ReconciliationService) Descartar(ctx context.Context, userID pgtype.UUID, movBancarioID string) (*MovimientoBancarioResponse, error) {
	pgMovID, err := pgUUID(movBancarioID)
	if err != nil {
		return nil, ErrMovimientoBancarioNotFound
	}

	m, err := s.queries.UpdateConciliacion(ctx, repository.UpdateConciliacionParams{
		EstadoConciliacion: repository.EstadoConciliacionDESCARTADO,
		MovimientoCajaID:   pgtype.UUID{Valid: false},
		ID:                 pgMovID,
		UsuarioID:          userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMovimientoBancarioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("descartar: %w", err)
	}

	resp := toMovBancarioResponse(m)
	return &resp, nil
}

func (s *ReconciliationService) ListMovCajaParaConciliar(ctx context.Context, userID pgtype.UUID, extractoID string, desde, hasta string) ([]MovCajaParaConciliarResponse, error) {
	pgExtractoID, err := pgUUID(extractoID)
	if err != nil {
		return nil, ErrExtractoNotFound
	}

	// Get extracto to find entidad_bancaria_id
	e, err := s.queries.GetExtracto(ctx, repository.GetExtractoParams{
		ID:        pgExtractoID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrExtractoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get extracto: %w", err)
	}

	desdeTime, err := time.Parse("2006-01-02", desde)
	if err != nil {
		return nil, fmt.Errorf("invalid desde: %w", err)
	}
	hastaTime, err := time.Parse("2006-01-02", hasta)
	if err != nil {
		return nil, fmt.Errorf("invalid hasta: %w", err)
	}
	// Set hasta to end of day
	hastaTime = hastaTime.Add(24*time.Hour - time.Second)

	items, err := s.queries.ListMovimientosCajaParaConciliar(ctx, repository.ListMovimientosCajaParaConciliarParams{
		EntidadBancariaID: e.EntidadBancariaID,
		Desde:             pgtype.Timestamptz{Time: desdeTime, Valid: true},
		Hasta:             pgtype.Timestamptz{Time: hastaTime, Valid: true},
		UsuarioID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("list movimientos caja: %w", err)
	}

	result := make([]MovCajaParaConciliarResponse, 0, len(items))
	for _, mc := range items {
		result = append(result, MovCajaParaConciliarResponse{
			ID:         uuidStrFromPg(mc.ID),
			CajaID:     uuidStrFromPg(mc.CajaID),
			CajaNombre: mc.CajaNombre,
			Tipo:       string(mc.Tipo),
			Monto:      floatFromNumeric(mc.Monto),
			Concepto:   mc.Concepto,
			CreatedAt:  mc.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, nil
}

// --- Mappers ---

func toExtractoResponse(e repository.ExtractosBancario) ExtractoResponse {
	return ExtractoResponse{
		ID:                uuidStrFromPg(e.ID),
		EntidadBancariaID: uuidStrFromPg(e.EntidadBancariaID),
		FechaDesde:        dateFromPg(e.FechaDesde),
		FechaHasta:        dateFromPg(e.FechaHasta),
		ArchivoNombre:     textFromPg(e.ArchivoNombre),
		CreatedAt:         e.CreatedAt.Time.Format(time.RFC3339),
	}
}

func toExtractoRowResponse(e repository.ListExtractosRow) ExtractoResponse {
	return ExtractoResponse{
		ID:                uuidStrFromPg(e.ID),
		EntidadBancariaID: uuidStrFromPg(e.EntidadBancariaID),
		EntidadNombre:     textFromPg(e.EntidadNombre),
		FechaDesde:        dateFromPg(e.FechaDesde),
		FechaHasta:        dateFromPg(e.FechaHasta),
		ArchivoNombre:     textFromPg(e.ArchivoNombre),
		CreatedAt:         e.CreatedAt.Time.Format(time.RFC3339),
	}
}

func toExtractoGetRowResponse(e repository.GetExtractoRow) ExtractoResponse {
	return ExtractoResponse{
		ID:                uuidStrFromPg(e.ID),
		EntidadBancariaID: uuidStrFromPg(e.EntidadBancariaID),
		EntidadNombre:     textFromPg(e.EntidadNombre),
		FechaDesde:        dateFromPg(e.FechaDesde),
		FechaHasta:        dateFromPg(e.FechaHasta),
		ArchivoNombre:     textFromPg(e.ArchivoNombre),
		CreatedAt:         e.CreatedAt.Time.Format(time.RFC3339),
	}
}

func toMovBancarioResponse(m repository.MovimientosBancario) MovimientoBancarioResponse {
	var movCajaID string
	if m.MovimientoCajaID.Valid {
		movCajaID = uuidStrFromPg(m.MovimientoCajaID)
	}
	return MovimientoBancarioResponse{
		ID:                 uuidStrFromPg(m.ID),
		ExtractoID:         uuidStrFromPg(m.ExtractoID),
		Fecha:              dateFromPg(m.Fecha),
		Descripcion:        m.Descripcion,
		Monto:              floatFromNumeric(m.Monto),
		Referencia:         textFromPg(m.Referencia),
		EstadoConciliacion: string(m.EstadoConciliacion),
		MovimientoCajaID:   movCajaID,
		CreatedAt:          m.CreatedAt.Time.Format(time.RFC3339),
	}
}
