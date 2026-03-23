package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrConfigRetencionNotFound = errors.New("configuracion retencion not found")

type RetencionConfigService struct {
	db *pgxpool.Pool
}

func NewRetencionConfigService(db *pgxpool.Pool) *RetencionConfigService {
	return &RetencionConfigService{db: db}
}

// --- Response DTOs ---

type ConfigRetencionResponse struct {
	ID          string  `json:"id"`
	Tipo        string  `json:"tipo"`
	Nombre      string  `json:"nombre"`
	Alicuota    float64 `json:"alicuota"`
	MontoMinimo float64 `json:"monto_minimo"`
	Activa      bool    `json:"activa"`
	CreatedAt   string  `json:"created_at"`
}

// --- Input DTOs ---

type CreateConfigRetencionInput struct {
	Tipo        string  `json:"tipo" validate:"required"`
	Nombre      string  `json:"nombre" validate:"required"`
	Alicuota    float64 `json:"alicuota" validate:"required,gt=0"`
	MontoMinimo float64 `json:"monto_minimo" validate:"gte=0"`
}

type UpdateConfigRetencionInput struct {
	Nombre      string  `json:"nombre" validate:"required"`
	Alicuota    float64 `json:"alicuota" validate:"required,gt=0"`
	MontoMinimo float64 `json:"monto_minimo" validate:"gte=0"`
	Activa      bool    `json:"activa"`
}

// --- Internal DTO for auto-calc ---

type activeRetencionConfig struct {
	ID          pgtype.UUID
	Tipo        string
	Nombre      string
	Alicuota    float64
	MontoMinimo float64
}

// --- Methods ---

func (s *RetencionConfigService) Create(ctx context.Context, userID pgtype.UUID, input CreateConfigRetencionInput) (*ConfigRetencionResponse, error) {
	var resp ConfigRetencionResponse
	var createdAt time.Time

	err := s.db.QueryRow(ctx,
		`INSERT INTO configuracion_retenciones (tipo, nombre, alicuota, monto_minimo, usuario_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, tipo, nombre, alicuota, monto_minimo, activa, created_at`,
		input.Tipo,
		input.Nombre,
		numericFromFloat(input.Alicuota),
		numericFromFloat(input.MontoMinimo),
		userID,
	).Scan(
		&resp.ID, &resp.Tipo, &resp.Nombre,
		&resp.Alicuota, &resp.MontoMinimo, &resp.Activa,
		&createdAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create config retencion: %w", err)
	}
	resp.CreatedAt = createdAt.Format(time.RFC3339)
	return &resp, nil
}

func (s *RetencionConfigService) List(ctx context.Context, userID pgtype.UUID) ([]ConfigRetencionResponse, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, tipo, nombre, alicuota, monto_minimo, activa, created_at
		 FROM configuracion_retenciones
		 WHERE usuario_id = $1
		 ORDER BY tipo, nombre`, userID)
	if err != nil {
		return nil, fmt.Errorf("list config retenciones: %w", err)
	}
	defer rows.Close()

	var result []ConfigRetencionResponse
	for rows.Next() {
		var r ConfigRetencionResponse
		var createdAt time.Time
		if err := rows.Scan(&r.ID, &r.Tipo, &r.Nombre, &r.Alicuota, &r.MontoMinimo, &r.Activa, &createdAt); err != nil {
			return nil, fmt.Errorf("scan config retencion: %w", err)
		}
		r.CreatedAt = createdAt.Format(time.RFC3339)
		result = append(result, r)
	}
	if result == nil {
		result = []ConfigRetencionResponse{}
	}
	return result, nil
}

func (s *RetencionConfigService) Get(ctx context.Context, userID pgtype.UUID, id string) (*ConfigRetencionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConfigRetencionNotFound
	}

	var r ConfigRetencionResponse
	var createdAt time.Time
	err = s.db.QueryRow(ctx,
		`SELECT id, tipo, nombre, alicuota, monto_minimo, activa, created_at
		 FROM configuracion_retenciones
		 WHERE id = $1 AND usuario_id = $2`, pgID, userID,
	).Scan(&r.ID, &r.Tipo, &r.Nombre, &r.Alicuota, &r.MontoMinimo, &r.Activa, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConfigRetencionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get config retencion: %w", err)
	}
	r.CreatedAt = createdAt.Format(time.RFC3339)
	return &r, nil
}

func (s *RetencionConfigService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateConfigRetencionInput) (*ConfigRetencionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConfigRetencionNotFound
	}

	var r ConfigRetencionResponse
	var createdAt time.Time
	err = s.db.QueryRow(ctx,
		`UPDATE configuracion_retenciones
		 SET nombre = $1, alicuota = $2, monto_minimo = $3, activa = $4, updated_at = NOW()
		 WHERE id = $5 AND usuario_id = $6
		 RETURNING id, tipo, nombre, alicuota, monto_minimo, activa, created_at`,
		input.Nombre,
		numericFromFloat(input.Alicuota),
		numericFromFloat(input.MontoMinimo),
		input.Activa,
		pgID, userID,
	).Scan(&r.ID, &r.Tipo, &r.Nombre, &r.Alicuota, &r.MontoMinimo, &r.Activa, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConfigRetencionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update config retencion: %w", err)
	}
	r.CreatedAt = createdAt.Format(time.RFC3339)
	return &r, nil
}

func (s *RetencionConfigService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrConfigRetencionNotFound
	}

	tag, err := s.db.Exec(ctx,
		`DELETE FROM configuracion_retenciones WHERE id = $1 AND usuario_id = $2`,
		pgID, userID)
	if err != nil {
		return fmt.Errorf("delete config retencion: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrConfigRetencionNotFound
	}
	return nil
}

// ListActiveConfigs returns active retention configs for auto-calculation.
// This is called within a transaction, so it takes a generic queryable interface.
func (s *RetencionConfigService) ListActiveConfigs(ctx context.Context, tx pgx.Tx, userID pgtype.UUID) ([]activeRetencionConfig, error) {
	rows, err := tx.Query(ctx,
		`SELECT id, tipo, nombre, alicuota, monto_minimo
		 FROM configuracion_retenciones
		 WHERE usuario_id = $1 AND activa = true
		 ORDER BY tipo, nombre`, userID)
	if err != nil {
		return nil, fmt.Errorf("list active config retenciones: %w", err)
	}
	defer rows.Close()

	var result []activeRetencionConfig
	for rows.Next() {
		var c activeRetencionConfig
		if err := rows.Scan(&c.ID, &c.Tipo, &c.Nombre, &c.Alicuota, &c.MontoMinimo); err != nil {
			return nil, fmt.Errorf("scan active config retencion: %w", err)
		}
		result = append(result, c)
	}
	return result, nil
}
