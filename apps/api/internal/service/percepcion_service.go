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

var ErrPercepcionNotFound = errors.New("percepcion not found")
var ErrConfigPercepcionNotFound = errors.New("configuracion percepcion not found")

type PercepcionService struct {
	db *pgxpool.Pool
}

func NewPercepcionService(db *pgxpool.Pool) *PercepcionService {
	return &PercepcionService{db: db}
}

// --- Config DTOs ---

type ConfigPercepcionResponse struct {
	ID        string  `json:"id"`
	Tipo      string  `json:"tipo"`
	Nombre    string  `json:"nombre"`
	Alicuota  float64 `json:"alicuota"`
	Provincia string  `json:"provincia,omitempty"`
	Activa    bool    `json:"activa"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

type CreateConfigPercepcionInput struct {
	Tipo      string  `json:"tipo" validate:"required"`
	Nombre    string  `json:"nombre" validate:"required"`
	Alicuota  float64 `json:"alicuota" validate:"required,gt=0"`
	Provincia string  `json:"provincia"`
}

type UpdateConfigPercepcionInput struct {
	Tipo      string  `json:"tipo" validate:"required"`
	Nombre    string  `json:"nombre" validate:"required"`
	Alicuota  float64 `json:"alicuota" validate:"required,gt=0"`
	Provincia string  `json:"provincia"`
	Activa    *bool   `json:"activa"`
}

// --- Perception DTOs ---

type PercepcionResponse struct {
	ID            string  `json:"id"`
	Tipo          string  `json:"tipo"`
	ComprobanteID string  `json:"comprobante_id,omitempty"`
	ClienteID     string  `json:"cliente_id"`
	BaseImponible float64 `json:"base_imponible"`
	Alicuota      float64 `json:"alicuota"`
	Monto         float64 `json:"monto"`
	Periodo       string  `json:"periodo"`
	CreatedAt     string  `json:"created_at"`
}

type CreatePercepcionInput struct {
	Tipo          string  `json:"tipo" validate:"required"`
	ComprobanteID string  `json:"comprobante_id"`
	ClienteID     string  `json:"cliente_id" validate:"required,uuid"`
	BaseImponible float64 `json:"base_imponible" validate:"required,gt=0"`
	Alicuota      float64 `json:"alicuota" validate:"required,gte=0"`
	Monto         float64 `json:"monto" validate:"required,gt=0"`
	Periodo       string  `json:"periodo" validate:"required"`
}

// ==================== Config CRUD ====================

func (s *PercepcionService) CreateConfig(ctx context.Context, userID pgtype.UUID, input CreateConfigPercepcionInput) (*ConfigPercepcionResponse, error) {
	query := `
		INSERT INTO configuracion_percepciones (tipo, nombre, alicuota, provincia, usuario_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, tipo, nombre, alicuota, provincia, activa, created_at, updated_at`

	var (
		id                   pgtype.UUID
		tipo, nombre         string
		alicuota             pgtype.Numeric
		provincia            pgtype.Text
		activa               bool
		createdAt, updatedAt pgtype.Timestamptz
	)

	err := s.db.QueryRow(ctx, query,
		input.Tipo, input.Nombre, numericFromFloat(input.Alicuota), pgText(input.Provincia), userID,
	).Scan(&id, &tipo, &nombre, &alicuota, &provincia, &activa, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create config percepcion: %w", err)
	}

	resp := &ConfigPercepcionResponse{
		ID:        uuidStrFromPg(id),
		Tipo:      tipo,
		Nombre:    nombre,
		Alicuota:  floatFromNumeric(alicuota),
		Provincia: textFromPg(provincia),
		Activa:    activa,
		CreatedAt: createdAt.Time.Format(time.RFC3339),
		UpdatedAt: updatedAt.Time.Format(time.RFC3339),
	}
	return resp, nil
}

func (s *PercepcionService) ListConfigs(ctx context.Context, userID pgtype.UUID) ([]ConfigPercepcionResponse, error) {
	query := `
		SELECT id, tipo, nombre, alicuota, provincia, activa, created_at, updated_at
		FROM configuracion_percepciones
		WHERE usuario_id = $1
		ORDER BY tipo, nombre`

	rows, err := s.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list config percepciones: %w", err)
	}
	defer rows.Close()

	var result []ConfigPercepcionResponse
	for rows.Next() {
		var (
			id                   pgtype.UUID
			tipo, nombre         string
			alicuota             pgtype.Numeric
			provincia            pgtype.Text
			activa               bool
			createdAt, updatedAt pgtype.Timestamptz
		)
		if err := rows.Scan(&id, &tipo, &nombre, &alicuota, &provincia, &activa, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan config percepcion: %w", err)
		}
		result = append(result, ConfigPercepcionResponse{
			ID:        uuidStrFromPg(id),
			Tipo:      tipo,
			Nombre:    nombre,
			Alicuota:  floatFromNumeric(alicuota),
			Provincia: textFromPg(provincia),
			Activa:    activa,
			CreatedAt: createdAt.Time.Format(time.RFC3339),
			UpdatedAt: updatedAt.Time.Format(time.RFC3339),
		})
	}
	if result == nil {
		result = []ConfigPercepcionResponse{}
	}
	return result, nil
}

func (s *PercepcionService) GetConfig(ctx context.Context, userID pgtype.UUID, id string) (*ConfigPercepcionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConfigPercepcionNotFound
	}

	query := `
		SELECT id, tipo, nombre, alicuota, provincia, activa, created_at, updated_at
		FROM configuracion_percepciones
		WHERE id = $1 AND usuario_id = $2`

	var (
		rowID                pgtype.UUID
		tipo, nombre         string
		alicuota             pgtype.Numeric
		provincia            pgtype.Text
		activa               bool
		createdAt, updatedAt pgtype.Timestamptz
	)

	err = s.db.QueryRow(ctx, query, pgID, userID).Scan(&rowID, &tipo, &nombre, &alicuota, &provincia, &activa, &createdAt, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConfigPercepcionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get config percepcion: %w", err)
	}

	return &ConfigPercepcionResponse{
		ID:        uuidStrFromPg(rowID),
		Tipo:      tipo,
		Nombre:    nombre,
		Alicuota:  floatFromNumeric(alicuota),
		Provincia: textFromPg(provincia),
		Activa:    activa,
		CreatedAt: createdAt.Time.Format(time.RFC3339),
		UpdatedAt: updatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *PercepcionService) UpdateConfig(ctx context.Context, userID pgtype.UUID, id string, input UpdateConfigPercepcionInput) (*ConfigPercepcionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConfigPercepcionNotFound
	}

	activa := true
	if input.Activa != nil {
		activa = *input.Activa
	}

	query := `
		UPDATE configuracion_percepciones
		SET tipo = $1, nombre = $2, alicuota = $3, provincia = $4, activa = $5, updated_at = NOW()
		WHERE id = $6 AND usuario_id = $7
		RETURNING id, tipo, nombre, alicuota, provincia, activa, created_at, updated_at`

	var (
		rowID                pgtype.UUID
		rTipo, rNombre       string
		rAlicuota            pgtype.Numeric
		rProvincia           pgtype.Text
		rActiva              bool
		createdAt, updatedAt pgtype.Timestamptz
	)

	err = s.db.QueryRow(ctx, query,
		input.Tipo, input.Nombre, numericFromFloat(input.Alicuota), pgText(input.Provincia), activa, pgID, userID,
	).Scan(&rowID, &rTipo, &rNombre, &rAlicuota, &rProvincia, &rActiva, &createdAt, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConfigPercepcionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update config percepcion: %w", err)
	}

	return &ConfigPercepcionResponse{
		ID:        uuidStrFromPg(rowID),
		Tipo:      rTipo,
		Nombre:    rNombre,
		Alicuota:  floatFromNumeric(rAlicuota),
		Provincia: textFromPg(rProvincia),
		Activa:    rActiva,
		CreatedAt: createdAt.Time.Format(time.RFC3339),
		UpdatedAt: updatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *PercepcionService) DeleteConfig(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrConfigPercepcionNotFound
	}

	query := `DELETE FROM configuracion_percepciones WHERE id = $1 AND usuario_id = $2`
	ct, err := s.db.Exec(ctx, query, pgID, userID)
	if err != nil {
		return fmt.Errorf("delete config percepcion: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrConfigPercepcionNotFound
	}
	return nil
}

// ==================== Perception Records ====================

func (s *PercepcionService) CalculateForInvoice(ctx context.Context, userID pgtype.UUID, clienteID string, baseImponible float64) ([]PercepcionResponse, error) {
	query := `
		SELECT id, tipo, nombre, alicuota, provincia
		FROM configuracion_percepciones
		WHERE usuario_id = $1 AND activa = true
		ORDER BY tipo, nombre`

	rows, err := s.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query active configs: %w", err)
	}
	defer rows.Close()

	var result []PercepcionResponse
	for rows.Next() {
		var (
			id        pgtype.UUID
			tipo      string
			nombre    string
			alicuota  pgtype.Numeric
			provincia pgtype.Text
		)
		if err := rows.Scan(&id, &tipo, &nombre, &alicuota, &provincia); err != nil {
			return nil, fmt.Errorf("scan config: %w", err)
		}

		rate := floatFromNumeric(alicuota)
		monto := baseImponible * rate / 100

		// Round to 2 decimal places
		monto = float64(int64(monto*100+0.5)) / 100

		now := time.Now()
		periodo := fmt.Sprintf("%04d-%02d", now.Year(), now.Month())

		result = append(result, PercepcionResponse{
			Tipo:          tipo,
			ClienteID:     clienteID,
			BaseImponible: baseImponible,
			Alicuota:      rate,
			Monto:         monto,
			Periodo:       periodo,
		})
	}
	if result == nil {
		result = []PercepcionResponse{}
	}
	return result, nil
}

func (s *PercepcionService) CreatePercepcion(ctx context.Context, userID pgtype.UUID, input CreatePercepcionInput) (*PercepcionResponse, error) {
	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	var comprobanteID pgtype.UUID
	if input.ComprobanteID != "" {
		comprobanteID, err = pgUUID(input.ComprobanteID)
		if err != nil {
			return nil, fmt.Errorf("invalid comprobante_id")
		}
	}

	query := `
		INSERT INTO percepciones (tipo, comprobante_id, cliente_id, base_imponible, alicuota, monto, periodo, usuario_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, tipo, comprobante_id, cliente_id, base_imponible, alicuota, monto, periodo, created_at`

	var (
		id           pgtype.UUID
		rTipo        string
		rCompID      pgtype.UUID
		rClienteID   pgtype.UUID
		rBase        pgtype.Numeric
		rAlicuota    pgtype.Numeric
		rMonto       pgtype.Numeric
		rPeriodo     string
		rCreatedAt   pgtype.Timestamptz
	)

	err = s.db.QueryRow(ctx, query,
		input.Tipo, comprobanteID, clienteID,
		numericFromFloat(input.BaseImponible), numericFromFloat(input.Alicuota), numericFromFloat(input.Monto),
		input.Periodo, userID,
	).Scan(&id, &rTipo, &rCompID, &rClienteID, &rBase, &rAlicuota, &rMonto, &rPeriodo, &rCreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create percepcion: %w", err)
	}

	return &PercepcionResponse{
		ID:            uuidStrFromPg(id),
		Tipo:          rTipo,
		ComprobanteID: uuidStrFromPg(rCompID),
		ClienteID:     uuidStrFromPg(rClienteID),
		BaseImponible: floatFromNumeric(rBase),
		Alicuota:      floatFromNumeric(rAlicuota),
		Monto:         floatFromNumeric(rMonto),
		Periodo:       rPeriodo,
		CreatedAt:     rCreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *PercepcionService) ListByPeriodo(ctx context.Context, userID pgtype.UUID, periodo string, limit, offset int32) ([]PercepcionResponse, int, error) {
	countQuery := `
		SELECT COUNT(*) FROM percepciones
		WHERE usuario_id = $1 AND active = true AND ($2::text = '' OR periodo = $2)`

	var total int64
	if err := s.db.QueryRow(ctx, countQuery, userID, periodo).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count percepciones: %w", err)
	}

	query := `
		SELECT id, tipo, comprobante_id, cliente_id, base_imponible, alicuota, monto, periodo, created_at
		FROM percepciones
		WHERE usuario_id = $1 AND active = true AND ($2::text = '' OR periodo = $2)
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := s.db.Query(ctx, query, userID, periodo, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list percepciones by periodo: %w", err)
	}
	defer rows.Close()

	result := make([]PercepcionResponse, 0)
	for rows.Next() {
		var (
			id         pgtype.UUID
			tipo       string
			compID     pgtype.UUID
			clienteID  pgtype.UUID
			base       pgtype.Numeric
			alicuota   pgtype.Numeric
			monto      pgtype.Numeric
			periodo    string
			createdAt  pgtype.Timestamptz
		)
		if err := rows.Scan(&id, &tipo, &compID, &clienteID, &base, &alicuota, &monto, &periodo, &createdAt); err != nil {
			return nil, 0, fmt.Errorf("scan percepcion: %w", err)
		}
		result = append(result, PercepcionResponse{
			ID:            uuidStrFromPg(id),
			Tipo:          tipo,
			ComprobanteID: uuidStrFromPg(compID),
			ClienteID:     uuidStrFromPg(clienteID),
			BaseImponible: floatFromNumeric(base),
			Alicuota:      floatFromNumeric(alicuota),
			Monto:         floatFromNumeric(monto),
			Periodo:       periodo,
			CreatedAt:     createdAt.Time.Format(time.RFC3339),
		})
	}
	return result, int(total), nil
}

func (s *PercepcionService) ListByComprobante(ctx context.Context, userID pgtype.UUID, comprobanteID string) ([]PercepcionResponse, error) {
	pgCompID, err := pgUUID(comprobanteID)
	if err != nil {
		return nil, fmt.Errorf("invalid comprobante_id")
	}

	query := `
		SELECT id, tipo, comprobante_id, cliente_id, base_imponible, alicuota, monto, periodo, created_at
		FROM percepciones
		WHERE usuario_id = $1 AND comprobante_id = $2 AND active = true
		ORDER BY created_at DESC`

	rows, err := s.db.Query(ctx, query, userID, pgCompID)
	if err != nil {
		return nil, fmt.Errorf("list percepciones by comprobante: %w", err)
	}
	defer rows.Close()

	result := make([]PercepcionResponse, 0)
	for rows.Next() {
		var (
			id         pgtype.UUID
			tipo       string
			compID     pgtype.UUID
			clienteID  pgtype.UUID
			base       pgtype.Numeric
			alicuota   pgtype.Numeric
			monto      pgtype.Numeric
			periodo    string
			createdAt  pgtype.Timestamptz
		)
		if err := rows.Scan(&id, &tipo, &compID, &clienteID, &base, &alicuota, &monto, &periodo, &createdAt); err != nil {
			return nil, fmt.Errorf("scan percepcion: %w", err)
		}
		result = append(result, PercepcionResponse{
			ID:            uuidStrFromPg(id),
			Tipo:          tipo,
			ComprobanteID: uuidStrFromPg(compID),
			ClienteID:     uuidStrFromPg(clienteID),
			BaseImponible: floatFromNumeric(base),
			Alicuota:      floatFromNumeric(alicuota),
			Monto:         floatFromNumeric(monto),
			Periodo:       periodo,
			CreatedAt:     createdAt.Time.Format(time.RFC3339),
		})
	}
	return result, nil
}
