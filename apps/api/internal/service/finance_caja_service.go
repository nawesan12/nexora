package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrCajaNotFound        = errors.New("caja not found")
	ErrInsuficientBalance  = errors.New("insufficient balance")
	ErrMovimientoNotFound  = errors.New("movimiento not found")
	ErrArqueoNotFound      = errors.New("arqueo not found")
)

type CajaService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewCajaService(db *pgxpool.Pool) *CajaService {
	return &CajaService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type CajaResponse struct {
	ID         string  `json:"id"`
	Nombre     string  `json:"nombre"`
	SucursalID string  `json:"sucursal_id"`
	Tipo       string  `json:"tipo"`
	Saldo      float64 `json:"saldo"`
	Activa     bool    `json:"activa"`
}

type MovimientoCajaResponse struct {
	ID             string  `json:"id"`
	CajaID         string  `json:"caja_id"`
	Tipo           string  `json:"tipo"`
	Monto          float64 `json:"monto"`
	Concepto       string  `json:"concepto"`
	ReferenciaID   string  `json:"referencia_id,omitempty"`
	ReferenciaTipo string  `json:"referencia_tipo,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type ArqueoCajaResponse struct {
	ID            string          `json:"id"`
	CajaID        string          `json:"caja_id"`
	MontoSistema  float64         `json:"monto_sistema"`
	MontoFisico   float64         `json:"monto_fisico"`
	Diferencia    float64         `json:"diferencia"`
	Estado        string          `json:"estado"`
	Observaciones string          `json:"observaciones,omitempty"`
	Desglose      json.RawMessage `json:"desglose,omitempty"`
	CreatedAt     string          `json:"created_at,omitempty"`
}

// --- Input DTOs ---

type CreateCajaInput struct {
	Nombre     string `json:"nombre" validate:"required,min=2,max=200"`
	SucursalID string `json:"sucursal_id" validate:"required,uuid"`
	Tipo       string `json:"tipo" validate:"required"`
}

type UpdateCajaInput struct {
	Nombre     string `json:"nombre" validate:"required,min=2,max=200"`
	SucursalID string `json:"sucursal_id" validate:"required,uuid"`
	Tipo       string `json:"tipo" validate:"required"`
}

type CreateMovimientoInput struct {
	CajaID         string  `json:"caja_id" validate:"required,uuid"`
	Tipo           string  `json:"tipo" validate:"required"`
	Monto          float64 `json:"monto" validate:"required,gt=0"`
	Concepto       string  `json:"concepto" validate:"required,min=2,max=500"`
	ReferenciaID   string  `json:"referencia_id,omitempty"`
	ReferenciaTipo string  `json:"referencia_tipo,omitempty"`
}

type CreateArqueoInput struct {
	CajaID        string          `json:"caja_id" validate:"required,uuid"`
	MontoFisico   float64         `json:"monto_fisico" validate:"gte=0"`
	Observaciones string          `json:"observaciones"`
	Desglose      json.RawMessage `json:"desglose,omitempty"`
}

type UpdateArqueoEstadoInput struct {
	Estado string `json:"estado" validate:"required"`
}

// --- Helpers ---

func dateFromPg(d pgtype.Date) string {
	if d.Valid {
		return d.Time.Format("2006-01-02")
	}
	return ""
}

func pgDate(s string) (pgtype.Date, error) {
	if s == "" {
		return pgtype.Date{}, nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func timestamptzStr(t pgtype.Timestamptz) string {
	if t.Valid {
		return t.Time.Format(time.RFC3339)
	}
	return ""
}

// --- Cajas ---

func (s *CajaService) CreateCaja(ctx context.Context, userID pgtype.UUID, input CreateCajaInput) (*CajaResponse, error) {
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	c, err := s.queries.CreateCaja(ctx, repository.CreateCajaParams{
		Nombre:     input.Nombre,
		SucursalID: sucID,
		Tipo:       repository.TipoCaja(input.Tipo),
		Saldo:      numericFromFloat(0),
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create caja: %w", err)
	}
	return toCajaResponse(c), nil
}

func (s *CajaService) GetCaja(ctx context.Context, userID pgtype.UUID, id string) (*CajaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrCajaNotFound
	}
	c, err := s.queries.GetCajaByID(ctx, repository.GetCajaByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCajaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get caja: %w", err)
	}
	return toCajaResponse(c), nil
}

func (s *CajaService) ListCajas(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]CajaResponse, int, error) {
	items, err := s.queries.ListCajas(ctx, repository.ListCajasParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list cajas: %w", err)
	}
	count, err := s.queries.CountCajas(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count cajas: %w", err)
	}
	result := make([]CajaResponse, 0, len(items))
	for _, c := range items {
		result = append(result, *toCajaResponse(c))
	}
	return result, int(count), nil
}

func (s *CajaService) UpdateCaja(ctx context.Context, userID pgtype.UUID, id string, input UpdateCajaInput) (*CajaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrCajaNotFound
	}
	sucID, err2 := pgUUID(input.SucursalID)
	if err2 != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	c, err := s.queries.UpdateCaja(ctx, repository.UpdateCajaParams{
		ID: pgID, UsuarioID: userID,
		Nombre:     input.Nombre,
		SucursalID: sucID,
		Tipo:       repository.TipoCaja(input.Tipo),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCajaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update caja: %w", err)
	}
	return toCajaResponse(c), nil
}

func (s *CajaService) DeleteCaja(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrCajaNotFound
	}
	return s.queries.SoftDeleteCaja(ctx, repository.SoftDeleteCajaParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toCajaResponse(c repository.Caja) *CajaResponse {
	return &CajaResponse{
		ID:         uuidStrFromPg(c.ID),
		Nombre:     c.Nombre,
		SucursalID: uuidStrFromPg(c.SucursalID),
		Tipo:       string(c.Tipo),
		Saldo:      floatFromNumeric(c.Saldo),
		Activa:     c.Activa,
	}
}

// --- Movimientos de Caja ---

func (s *CajaService) CreateMovimiento(ctx context.Context, userID pgtype.UUID, input CreateMovimientoInput) (*MovimientoCajaResponse, error) {
	cajaID, err := pgUUID(input.CajaID)
	if err != nil {
		return nil, ErrCajaNotFound
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// Get current caja
	caja, err := qtx.GetCajaByID(ctx, repository.GetCajaByIDParams{
		ID: cajaID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCajaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get caja: %w", err)
	}

	// Calculate new saldo
	currentSaldo := floatFromNumeric(caja.Saldo)
	var newSaldo float64

	switch repository.TipoMovimiento(input.Tipo) {
	case "INGRESO":
		newSaldo = currentSaldo + input.Monto
	case "EGRESO":
		newSaldo = currentSaldo - input.Monto
		if newSaldo < 0 {
			return nil, ErrInsuficientBalance
		}
	case "AJUSTE":
		newSaldo = input.Monto
	default:
		return nil, fmt.Errorf("invalid movement type: %s", input.Tipo)
	}

	// Parse optional referencia_id
	var refID pgtype.UUID
	if input.ReferenciaID != "" {
		refID, err = pgUUID(input.ReferenciaID)
		if err != nil {
			return nil, fmt.Errorf("invalid referencia_id")
		}
	}

	// Create movement
	m, err := qtx.CreateMovimientoCaja(ctx, repository.CreateMovimientoCajaParams{
		CajaID:         cajaID,
		Tipo:           repository.TipoMovimiento(input.Tipo),
		Monto:          numericFromFloat(input.Monto),
		Concepto:       input.Concepto,
		ReferenciaID:   refID,
		ReferenciaTipo: pgText(input.ReferenciaTipo),
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create movimiento: %w", err)
	}

	// Update caja saldo
	err = qtx.UpdateCajaSaldo(ctx, repository.UpdateCajaSaldoParams{
		ID:        cajaID,
		UsuarioID: userID,
		Saldo:     numericFromFloat(newSaldo),
	})
	if err != nil {
		return nil, fmt.Errorf("update caja saldo: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return toMovimientoResponse(m), nil
}

func (s *CajaService) ListMovimientos(ctx context.Context, userID pgtype.UUID, cajaID string, limit, offset int32) ([]MovimientoCajaResponse, int, error) {
	pgCajaID, err := pgUUID(cajaID)
	if err != nil {
		return nil, 0, ErrCajaNotFound
	}
	items, err := s.queries.ListMovimientosByCaja(ctx, repository.ListMovimientosByCajaParams{
		CajaID: pgCajaID, UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list movimientos: %w", err)
	}
	count, err := s.queries.CountMovimientosByCaja(ctx, repository.CountMovimientosByCajaParams{
		CajaID: pgCajaID, UsuarioID: userID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count movimientos: %w", err)
	}
	result := make([]MovimientoCajaResponse, 0, len(items))
	for _, m := range items {
		result = append(result, *toMovimientoResponse(m))
	}
	return result, int(count), nil
}

func toMovimientoResponse(m repository.MovimientosCaja) *MovimientoCajaResponse {
	return &MovimientoCajaResponse{
		ID:             uuidStrFromPg(m.ID),
		CajaID:         uuidStrFromPg(m.CajaID),
		Tipo:           string(m.Tipo),
		Monto:          floatFromNumeric(m.Monto),
		Concepto:       m.Concepto,
		ReferenciaID:   uuidStrFromPg(m.ReferenciaID),
		ReferenciaTipo: textFromPg(m.ReferenciaTipo),
		CreatedAt:      timestamptzStr(m.CreatedAt),
	}
}

// --- Arqueos de Caja ---

func (s *CajaService) CreateArqueo(ctx context.Context, userID pgtype.UUID, input CreateArqueoInput) (*ArqueoCajaResponse, error) {
	cajaID, err := pgUUID(input.CajaID)
	if err != nil {
		return nil, ErrCajaNotFound
	}

	// Get caja to read current saldo
	caja, err := s.queries.GetCajaByID(ctx, repository.GetCajaByIDParams{
		ID: cajaID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCajaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get caja: %w", err)
	}

	montoSistema := floatFromNumeric(caja.Saldo)
	diferencia := input.MontoFisico - montoSistema

	a, err := s.queries.CreateArqueoCaja(ctx, repository.CreateArqueoCajaParams{
		CajaID:        cajaID,
		MontoSistema:  numericFromFloat(montoSistema),
		MontoFisico:   numericFromFloat(input.MontoFisico),
		Diferencia:    numericFromFloat(diferencia),
		Estado:        repository.EstadoArqueo("PENDIENTE_REVISION"),
		Observaciones: pgText(input.Observaciones),
		Desglose:      input.Desglose,
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create arqueo: %w", err)
	}
	return toArqueoResponse(a), nil
}

func (s *CajaService) ListArqueos(ctx context.Context, userID pgtype.UUID, cajaID string, limit, offset int32) ([]ArqueoCajaResponse, int, error) {
	pgCajaID, err := pgUUID(cajaID)
	if err != nil {
		return nil, 0, ErrCajaNotFound
	}
	items, err := s.queries.ListArqueosByCaja(ctx, repository.ListArqueosByCajaParams{
		CajaID: pgCajaID, UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list arqueos: %w", err)
	}
	count, err := s.queries.CountArqueosByCaja(ctx, repository.CountArqueosByCajaParams{
		CajaID: pgCajaID, UsuarioID: userID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count arqueos: %w", err)
	}
	result := make([]ArqueoCajaResponse, 0, len(items))
	for _, a := range items {
		result = append(result, *toArqueoResponse(a))
	}
	return result, int(count), nil
}

func (s *CajaService) UpdateArqueoEstado(ctx context.Context, userID pgtype.UUID, id string, input UpdateArqueoEstadoInput) (*ArqueoCajaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrArqueoNotFound
	}
	a, err := s.queries.UpdateArqueoEstado(ctx, repository.UpdateArqueoEstadoParams{
		ID: pgID, UsuarioID: userID,
		Estado: repository.EstadoArqueo(input.Estado),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrArqueoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update arqueo estado: %w", err)
	}
	return toArqueoResponse(a), nil
}

func toArqueoResponse(a repository.ArqueosCaja) *ArqueoCajaResponse {
	return &ArqueoCajaResponse{
		ID:            uuidStrFromPg(a.ID),
		CajaID:        uuidStrFromPg(a.CajaID),
		MontoSistema:  floatFromNumeric(a.MontoSistema),
		MontoFisico:   floatFromNumeric(a.MontoFisico),
		Diferencia:    floatFromNumeric(a.Diferencia),
		Estado:        string(a.Estado),
		Observaciones: textFromPg(a.Observaciones),
		Desglose:      a.Desglose,
		CreatedAt:     timestamptzStr(a.CreatedAt),
	}
}
