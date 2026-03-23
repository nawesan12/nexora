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

var ErrCotizacionNotFound = errors.New("exchange rate not found for date")

type CotizacionService struct {
	db *pgxpool.Pool
}

func NewCotizacionService(db *pgxpool.Pool) *CotizacionService {
	return &CotizacionService{db: db}
}

type CotizacionResponse struct {
	ID            string  `json:"id"`
	MonedaOrigen  string  `json:"moneda_origen"`
	MonedaDestino string  `json:"moneda_destino"`
	Tasa          float64 `json:"tasa"`
	Fuente        string  `json:"fuente"`
	Fecha         string  `json:"fecha"`
	CreatedAt     string  `json:"created_at"`
}

type CreateCotizacionInput struct {
	MonedaOrigen  string  `json:"moneda_origen" validate:"required,oneof=ARS USD"`
	MonedaDestino string  `json:"moneda_destino" validate:"required,oneof=ARS USD"`
	Tasa          float64 `json:"tasa" validate:"required,gt=0"`
	Fuente        string  `json:"fuente"`
	Fecha         string  `json:"fecha" validate:"required"`
}

// Create upserts an exchange rate for a given date.
func (s *CotizacionService) Create(ctx context.Context, userID pgtype.UUID, input CreateCotizacionInput) (*CotizacionResponse, error) {
	fecha, err := time.Parse("2006-01-02", input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("fecha invalida: %w", err)
	}
	fuente := input.Fuente
	if fuente == "" {
		fuente = "MANUAL"
	}

	var resp CotizacionResponse
	var createdAt time.Time
	err = s.db.QueryRow(ctx,
		`INSERT INTO cotizaciones (moneda_origen, moneda_destino, tasa, fuente, fecha, usuario_id)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (moneda_origen, moneda_destino, fecha, usuario_id)
		 DO UPDATE SET tasa = $3, fuente = $4
		 RETURNING id, moneda_origen, moneda_destino, tasa, fuente, fecha, created_at`,
		input.MonedaOrigen, input.MonedaDestino, input.Tasa, fuente, fecha, userID).
		Scan(&resp.ID, &resp.MonedaOrigen, &resp.MonedaDestino, &resp.Tasa, &resp.Fuente, &fecha, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("upsert cotizacion: %w", err)
	}
	resp.Fecha = fecha.Format("2006-01-02")
	resp.CreatedAt = createdAt.Format(time.RFC3339)
	return &resp, nil
}

// GetRate returns the exchange rate for a specific date and currency pair.
func (s *CotizacionService) GetRate(ctx context.Context, userID pgtype.UUID, monedaOrigen, monedaDestino, fecha string) (*CotizacionResponse, error) {
	var resp CotizacionResponse
	var fechaDate time.Time
	var createdAt time.Time
	err := s.db.QueryRow(ctx,
		`SELECT id, moneda_origen, moneda_destino, tasa, fuente, fecha, created_at
		 FROM cotizaciones
		 WHERE usuario_id = $1 AND moneda_origen = $2 AND moneda_destino = $3 AND fecha <= $4
		 ORDER BY fecha DESC LIMIT 1`,
		userID, monedaOrigen, monedaDestino, fecha).
		Scan(&resp.ID, &resp.MonedaOrigen, &resp.MonedaDestino, &resp.Tasa, &resp.Fuente, &fechaDate, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCotizacionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get rate: %w", err)
	}
	resp.Fecha = fechaDate.Format("2006-01-02")
	resp.CreatedAt = createdAt.Format(time.RFC3339)
	return &resp, nil
}

// List returns recent exchange rates.
func (s *CotizacionService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]CotizacionResponse, int, error) {
	var count int
	s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cotizaciones WHERE usuario_id = $1`, userID).Scan(&count)

	rows, err := s.db.Query(ctx,
		`SELECT id, moneda_origen, moneda_destino, tasa, fuente, fecha, created_at
		 FROM cotizaciones WHERE usuario_id = $1
		 ORDER BY fecha DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list cotizaciones: %w", err)
	}
	defer rows.Close()

	var results []CotizacionResponse
	for rows.Next() {
		var r CotizacionResponse
		var fecha time.Time
		var createdAt time.Time
		if err := rows.Scan(&r.ID, &r.MonedaOrigen, &r.MonedaDestino, &r.Tasa, &r.Fuente, &fecha, &createdAt); err != nil {
			return nil, 0, fmt.Errorf("scan cotizacion: %w", err)
		}
		r.Fecha = fecha.Format("2006-01-02")
		r.CreatedAt = createdAt.Format(time.RFC3339)
		results = append(results, r)
	}
	return results, count, nil
}

// Delete removes an exchange rate.
func (s *CotizacionService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	_, err := s.db.Exec(ctx,
		`DELETE FROM cotizaciones WHERE id = $1 AND usuario_id = $2`, id, userID)
	return err
}
