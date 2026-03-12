package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrChequeNotFound            = errors.New("cheque not found")
	ErrInvalidChequeTransition   = errors.New("invalid cheque state transition")
	ErrEntidadBancariaNotFound   = errors.New("entidad bancaria not found")
)

type ChequeService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewChequeService(db *pgxpool.Pool) *ChequeService {
	return &ChequeService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- State Machine ---

var chequeTransitions = map[string][]string{
	"RECIBIDO":   {"DEPOSITADO", "ENDOSADO", "RECHAZADO"},
	"DEPOSITADO": {"COBRADO", "RECHAZADO"},
	"ENDOSADO":   {"COBRADO"},
	"COBRADO":    {},
	"RECHAZADO":  {},
}

func canTransitionCheque(from, to string) bool {
	allowed, ok := chequeTransitions[from]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}

// --- Response DTOs ---

type ChequeResponse struct {
	ID                string  `json:"id"`
	Numero            string  `json:"numero"`
	Monto             float64 `json:"monto"`
	FechaEmision      string  `json:"fecha_emision"`
	FechaVencimiento  string  `json:"fecha_vencimiento"`
	Estado            string  `json:"estado"`
	Banco             string  `json:"banco,omitempty"`
	Emisor            string  `json:"emisor,omitempty"`
	Receptor          string  `json:"receptor,omitempty"`
	EntidadBancariaID string  `json:"entidad_bancaria_id,omitempty"`
	SucursalID        string  `json:"sucursal_id"`
}

type EntidadBancariaResponse struct {
	ID            string `json:"id"`
	Nombre        string `json:"nombre"`
	SucursalBanco string `json:"sucursal_banco,omitempty"`
	NumeroCuenta  string `json:"numero_cuenta,omitempty"`
	Cbu           string `json:"cbu,omitempty"`
	Alias         string `json:"alias,omitempty"`
	SucursalID    string `json:"sucursal_id"`
	Active        bool   `json:"active"`
}

// --- Input DTOs ---

type CreateChequeInput struct {
	Numero            string  `json:"numero" validate:"required,min=1,max=100"`
	Monto             float64 `json:"monto" validate:"required,gt=0"`
	FechaEmision      string  `json:"fecha_emision" validate:"required"`
	FechaVencimiento  string  `json:"fecha_vencimiento" validate:"required"`
	Banco             string  `json:"banco"`
	Emisor            string  `json:"emisor"`
	Receptor          string  `json:"receptor"`
	EntidadBancariaID string  `json:"entidad_bancaria_id"`
	SucursalID        string  `json:"sucursal_id" validate:"required,uuid"`
}

type UpdateChequeInput struct {
	Numero            string  `json:"numero" validate:"required,min=1,max=100"`
	Monto             float64 `json:"monto" validate:"required,gt=0"`
	FechaEmision      string  `json:"fecha_emision" validate:"required"`
	FechaVencimiento  string  `json:"fecha_vencimiento" validate:"required"`
	Banco             string  `json:"banco"`
	Emisor            string  `json:"emisor"`
	Receptor          string  `json:"receptor"`
	EntidadBancariaID string  `json:"entidad_bancaria_id"`
}

type TransicionChequeInput struct {
	Estado string `json:"estado" validate:"required"`
}

type CreateEntidadBancariaInput struct {
	Nombre        string `json:"nombre" validate:"required,min=2,max=200"`
	SucursalBanco string `json:"sucursal_banco"`
	NumeroCuenta  string `json:"numero_cuenta"`
	Cbu           string `json:"cbu"`
	Alias         string `json:"alias"`
	SucursalID    string `json:"sucursal_id" validate:"required,uuid"`
}

type UpdateEntidadBancariaInput struct {
	Nombre        string `json:"nombre" validate:"required,min=2,max=200"`
	SucursalBanco string `json:"sucursal_banco"`
	NumeroCuenta  string `json:"numero_cuenta"`
	Cbu           string `json:"cbu"`
	Alias         string `json:"alias"`
	SucursalID    string `json:"sucursal_id" validate:"required,uuid"`
}

// --- Cheques ---

func (s *ChequeService) CreateCheque(ctx context.Context, userID pgtype.UUID, input CreateChequeInput) (*ChequeResponse, error) {
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	fechaEmision, err := pgDate(input.FechaEmision)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_emision: %w", err)
	}
	fechaVencimiento, err := pgDate(input.FechaVencimiento)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_vencimiento: %w", err)
	}

	var entBancID pgtype.UUID
	if input.EntidadBancariaID != "" {
		entBancID, err = pgUUID(input.EntidadBancariaID)
		if err != nil {
			return nil, ErrEntidadBancariaNotFound
		}
	}

	c, err := s.queries.CreateCheque(ctx, repository.CreateChequeParams{
		Numero:            input.Numero,
		Monto:             numericFromFloat(input.Monto),
		FechaEmision:      fechaEmision,
		FechaVencimiento:  fechaVencimiento,
		Estado:            repository.EstadoCheque("RECIBIDO"),
		Banco:             pgText(input.Banco),
		Emisor:            pgText(input.Emisor),
		Receptor:          pgText(input.Receptor),
		EntidadBancariaID: entBancID,
		SucursalID:        sucID,
		UsuarioID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create cheque: %w", err)
	}
	return toChequeResponse(c), nil
}

func (s *ChequeService) GetCheque(ctx context.Context, userID pgtype.UUID, id string) (*ChequeResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrChequeNotFound
	}
	c, err := s.queries.GetChequeByID(ctx, repository.GetChequeByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrChequeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get cheque: %w", err)
	}
	return toChequeResponse(c), nil
}

func (s *ChequeService) ListCheques(ctx context.Context, userID pgtype.UUID, search, estado string, limit, offset int32) ([]ChequeResponse, int, error) {
	if estado != "" {
		items, err := s.queries.ListChequesByEstado(ctx, repository.ListChequesByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoCheque(estado),
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list cheques by estado: %w", err)
		}
		count, err := s.queries.CountChequesByEstado(ctx, repository.CountChequesByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoCheque(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count cheques by estado: %w", err)
		}
		return toChequeResponses(items), int(count), nil
	}

	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchCheques(ctx, repository.SearchChequesParams{
			UsuarioID: userID, Numero: searchPattern,
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search cheques: %w", err)
		}
		count, err := s.queries.CountSearchCheques(ctx, repository.CountSearchChequesParams{
			UsuarioID: userID, Numero: searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search cheques: %w", err)
		}
		return toChequeResponses(items), int(count), nil
	}

	items, err := s.queries.ListCheques(ctx, repository.ListChequesParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list cheques: %w", err)
	}
	count, err := s.queries.CountCheques(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count cheques: %w", err)
	}
	return toChequeResponses(items), int(count), nil
}

func toChequeResponses(items []repository.Cheque) []ChequeResponse {
	result := make([]ChequeResponse, 0, len(items))
	for _, c := range items {
		result = append(result, *toChequeResponse(c))
	}
	return result
}

func (s *ChequeService) UpdateCheque(ctx context.Context, userID pgtype.UUID, id string, input UpdateChequeInput) (*ChequeResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrChequeNotFound
	}

	fechaEmision, err := pgDate(input.FechaEmision)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_emision: %w", err)
	}
	fechaVencimiento, err := pgDate(input.FechaVencimiento)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_vencimiento: %w", err)
	}

	var entBancID pgtype.UUID
	if input.EntidadBancariaID != "" {
		entBancID, err = pgUUID(input.EntidadBancariaID)
		if err != nil {
			return nil, ErrEntidadBancariaNotFound
		}
	}

	c, err := s.queries.UpdateCheque(ctx, repository.UpdateChequeParams{
		ID: pgID, UsuarioID: userID,
		Numero:            input.Numero,
		Monto:             numericFromFloat(input.Monto),
		FechaEmision:      fechaEmision,
		FechaVencimiento:  fechaVencimiento,
		Banco:             pgText(input.Banco),
		Emisor:            pgText(input.Emisor),
		Receptor:          pgText(input.Receptor),
		EntidadBancariaID: entBancID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrChequeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update cheque: %w", err)
	}
	return toChequeResponse(c), nil
}

func (s *ChequeService) UpdateChequeEstado(ctx context.Context, userID pgtype.UUID, id string, input TransicionChequeInput) (*ChequeResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrChequeNotFound
	}

	// Get current cheque to validate transition
	current, err := s.queries.GetChequeByID(ctx, repository.GetChequeByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrChequeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get cheque: %w", err)
	}

	if !canTransitionCheque(string(current.Estado), input.Estado) {
		return nil, ErrInvalidChequeTransition
	}

	c, err := s.queries.UpdateChequeEstado(ctx, repository.UpdateChequeEstadoParams{
		ID: pgID, UsuarioID: userID,
		Estado: repository.EstadoCheque(input.Estado),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrChequeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update cheque estado: %w", err)
	}
	return toChequeResponse(c), nil
}

func toChequeResponse(c repository.Cheque) *ChequeResponse {
	return &ChequeResponse{
		ID:                uuidStrFromPg(c.ID),
		Numero:            c.Numero,
		Monto:             floatFromNumeric(c.Monto),
		FechaEmision:      dateFromPg(c.FechaEmision),
		FechaVencimiento:  dateFromPg(c.FechaVencimiento),
		Estado:            string(c.Estado),
		Banco:             textFromPg(c.Banco),
		Emisor:            textFromPg(c.Emisor),
		Receptor:          textFromPg(c.Receptor),
		EntidadBancariaID: uuidStrFromPg(c.EntidadBancariaID),
		SucursalID:        uuidStrFromPg(c.SucursalID),
	}
}

// --- Entidades Bancarias ---

func (s *ChequeService) CreateEntidadBancaria(ctx context.Context, userID pgtype.UUID, input CreateEntidadBancariaInput) (*EntidadBancariaResponse, error) {
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	e, err := s.queries.CreateEntidadBancaria(ctx, repository.CreateEntidadBancariaParams{
		Nombre:        input.Nombre,
		SucursalBanco: pgText(input.SucursalBanco),
		NumeroCuenta:  pgText(input.NumeroCuenta),
		Cbu:           pgText(input.Cbu),
		Alias:         pgText(input.Alias),
		SucursalID:    sucID,
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create entidad bancaria: %w", err)
	}
	return toEntidadBancariaResponse(e), nil
}

func (s *ChequeService) GetEntidadBancaria(ctx context.Context, userID pgtype.UUID, id string) (*EntidadBancariaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrEntidadBancariaNotFound
	}
	e, err := s.queries.GetEntidadBancariaByID(ctx, repository.GetEntidadBancariaByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrEntidadBancariaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get entidad bancaria: %w", err)
	}
	return toEntidadBancariaResponse(e), nil
}

func (s *ChequeService) ListEntidadesBancarias(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]EntidadBancariaResponse, int, error) {
	items, err := s.queries.ListEntidadesBancarias(ctx, repository.ListEntidadesBancariasParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list entidades bancarias: %w", err)
	}
	count, err := s.queries.CountEntidadesBancarias(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count entidades bancarias: %w", err)
	}
	result := make([]EntidadBancariaResponse, 0, len(items))
	for _, e := range items {
		result = append(result, *toEntidadBancariaResponse(e))
	}
	return result, int(count), nil
}

func (s *ChequeService) UpdateEntidadBancaria(ctx context.Context, userID pgtype.UUID, id string, input UpdateEntidadBancariaInput) (*EntidadBancariaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrEntidadBancariaNotFound
	}
	sucID, err2 := pgUUID(input.SucursalID)
	if err2 != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	e, err := s.queries.UpdateEntidadBancaria(ctx, repository.UpdateEntidadBancariaParams{
		ID: pgID, UsuarioID: userID,
		Nombre:        input.Nombre,
		SucursalBanco: pgText(input.SucursalBanco),
		NumeroCuenta:  pgText(input.NumeroCuenta),
		Cbu:           pgText(input.Cbu),
		Alias:         pgText(input.Alias),
		SucursalID:    sucID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrEntidadBancariaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update entidad bancaria: %w", err)
	}
	return toEntidadBancariaResponse(e), nil
}

func (s *ChequeService) DeleteEntidadBancaria(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrEntidadBancariaNotFound
	}
	return s.queries.SoftDeleteEntidadBancaria(ctx, repository.SoftDeleteEntidadBancariaParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toEntidadBancariaResponse(e repository.EntidadesBancaria) *EntidadBancariaResponse {
	return &EntidadBancariaResponse{
		ID:            uuidStrFromPg(e.ID),
		Nombre:        e.Nombre,
		SucursalBanco: textFromPg(e.SucursalBanco),
		NumeroCuenta:  textFromPg(e.NumeroCuenta),
		Cbu:           textFromPg(e.Cbu),
		Alias:         textFromPg(e.Alias),
		SucursalID:    uuidStrFromPg(e.SucursalID),
		Active:        e.Active,
	}
}
