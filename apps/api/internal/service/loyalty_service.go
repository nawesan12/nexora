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

var (
	ErrProgramaNotFound   = errors.New("loyalty program not found")
	ErrInsuficientePuntos = errors.New("insufficient points for redemption")
	ErrMinimoCanje        = errors.New("points below minimum redemption threshold")
)

type LoyaltyService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewLoyaltyService(db *pgxpool.Pool) *LoyaltyService {
	return &LoyaltyService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type ProgramaFidelidadResponse struct {
	ID            string  `json:"id"`
	Nombre        string  `json:"nombre"`
	PuntosPorPeso float64 `json:"puntos_por_peso"`
	ValorPunto    float64 `json:"valor_punto"`
	MinimoCanje   int     `json:"minimo_canje"`
	Activo        bool    `json:"activo"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
}

type PuntosClienteResponse struct {
	ID             string `json:"id"`
	ClienteID      string `json:"cliente_id"`
	Tipo           string `json:"tipo"`
	Puntos         int    `json:"puntos"`
	SaldoAnterior  int    `json:"saldo_anterior"`
	SaldoNuevo     int    `json:"saldo_nuevo"`
	ReferenciaID   string `json:"referencia_id,omitempty"`
	ReferenciaTipo string `json:"referencia_tipo,omitempty"`
	Descripcion    string `json:"descripcion,omitempty"`
	CreatedAt      string `json:"created_at"`
}

type ClientePuntosResumen struct {
	ClienteID      string `json:"cliente_id"`
	ClienteNombre  string `json:"cliente_nombre"`
	SaldoActual    int    `json:"saldo_actual"`
	TotalAcumulado int    `json:"total_acumulado"`
	TotalCanjeado  int    `json:"total_canjeado"`
}

type UpsertProgramaInput struct {
	Nombre        string  `json:"nombre" validate:"required,min=2,max=200"`
	PuntosPorPeso float64 `json:"puntos_por_peso" validate:"required,gt=0"`
	ValorPunto    float64 `json:"valor_punto" validate:"required,gt=0"`
	MinimoCanje   int     `json:"minimo_canje" validate:"required,gt=0"`
	Activo        bool    `json:"activo"`
}

type AcumularPuntosInput struct {
	Puntos         int    `json:"puntos" validate:"required,gt=0"`
	ReferenciaID   string `json:"referencia_id"`
	ReferenciaTipo string `json:"referencia_tipo"`
	Descripcion    string `json:"descripcion"`
}

type CanjearPuntosInput struct {
	Puntos      int    `json:"puntos" validate:"required,gt=0"`
	Descripcion string `json:"descripcion"`
}

// --- Methods ---

func (s *LoyaltyService) GetPrograma(ctx context.Context, userID pgtype.UUID) (*ProgramaFidelidadResponse, error) {
	p, err := s.queries.GetProgramaFidelidad(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProgramaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get programa: %w", err)
	}
	return toProgramaResponse(p), nil
}

func (s *LoyaltyService) UpsertPrograma(ctx context.Context, userID pgtype.UUID, input UpsertProgramaInput) (*ProgramaFidelidadResponse, error) {
	// Try to get existing program
	existing, err := s.queries.GetProgramaFidelidad(ctx, userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("check existing programa: %w", err)
	}

	if errors.Is(err, pgx.ErrNoRows) {
		// Create new
		p, err := s.queries.CreateProgramaFidelidad(ctx, repository.CreateProgramaFidelidadParams{
			Nombre:        input.Nombre,
			PuntosPorPeso: numericFromFloat(input.PuntosPorPeso),
			ValorPunto:    numericFromFloat(input.ValorPunto),
			MinimoCanje:   int32(input.MinimoCanje),
			Activo:        input.Activo,
			UsuarioID:     userID,
		})
		if err != nil {
			return nil, fmt.Errorf("create programa: %w", err)
		}
		return toProgramaResponse(p), nil
	}

	// Update existing
	p, err := s.queries.UpdateProgramaFidelidad(ctx, repository.UpdateProgramaFidelidadParams{
		ID:            existing.ID,
		Nombre:        input.Nombre,
		PuntosPorPeso: numericFromFloat(input.PuntosPorPeso),
		ValorPunto:    numericFromFloat(input.ValorPunto),
		MinimoCanje:   int32(input.MinimoCanje),
		Activo:        input.Activo,
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("update programa: %w", err)
	}
	return toProgramaResponse(p), nil
}

func (s *LoyaltyService) GetClientePuntos(ctx context.Context, userID pgtype.UUID, clienteID string) (*ClientePuntosResumen, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	// Get client name
	var clienteNombre string
	err = s.db.QueryRow(ctx, `SELECT nombre FROM clientes WHERE id = $1 AND usuario_id = $2 AND active = TRUE`, pgClienteID, userID).Scan(&clienteNombre)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("client not found")
	}
	if err != nil {
		return nil, fmt.Errorf("get client: %w", err)
	}

	saldo, err := s.queries.GetSaldoPuntos(ctx, repository.GetSaldoPuntosParams{
		ClienteID: pgClienteID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		saldo = 0
	} else if err != nil {
		return nil, fmt.Errorf("get saldo: %w", err)
	}

	totalAcumulado, err := s.queries.GetTotalAcumulado(ctx, repository.GetTotalAcumuladoParams{
		ClienteID: pgClienteID,
		UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("get total acumulado: %w", err)
	}

	totalCanjeado, err := s.queries.GetTotalCanjeado(ctx, repository.GetTotalCanjeadoParams{
		ClienteID: pgClienteID,
		UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("get total canjeado: %w", err)
	}

	return &ClientePuntosResumen{
		ClienteID:      clienteID,
		ClienteNombre:  clienteNombre,
		SaldoActual:    int(saldo),
		TotalAcumulado: int(totalAcumulado),
		TotalCanjeado:  int(totalCanjeado),
	}, nil
}

func (s *LoyaltyService) ListMovimientos(ctx context.Context, userID pgtype.UUID, clienteID string, limit, offset int32) ([]PuntosClienteResponse, int, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid cliente_id")
	}

	items, err := s.queries.ListMovimientosByCliente(ctx, repository.ListMovimientosByClienteParams{
		ClienteID:   pgClienteID,
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list movimientos: %w", err)
	}

	count, err := s.queries.CountMovimientosByCliente(ctx, repository.CountMovimientosByClienteParams{
		ClienteID: pgClienteID,
		UsuarioID: userID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count movimientos: %w", err)
	}

	result := make([]PuntosClienteResponse, 0, len(items))
	for _, m := range items {
		result = append(result, toPuntosClienteResponse(m))
	}
	return result, int(count), nil
}

func (s *LoyaltyService) AcumularPuntos(ctx context.Context, userID pgtype.UUID, clienteID string, input AcumularPuntosInput) (*PuntosClienteResponse, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	// Get current balance
	saldo, err := s.queries.GetSaldoPuntos(ctx, repository.GetSaldoPuntosParams{
		ClienteID: pgClienteID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		saldo = 0
	} else if err != nil {
		return nil, fmt.Errorf("get saldo: %w", err)
	}

	nuevoSaldo := saldo + int32(input.Puntos)

	var refID pgtype.UUID
	if input.ReferenciaID != "" {
		refID, err = pgUUID(input.ReferenciaID)
		if err != nil {
			return nil, fmt.Errorf("invalid referencia_id")
		}
	}

	m, err := s.queries.CreateMovimientoPuntos(ctx, repository.CreateMovimientoPuntosParams{
		ClienteID:      pgClienteID,
		Tipo:           "ACUMULACION",
		Puntos:         int32(input.Puntos),
		SaldoAnterior:  saldo,
		SaldoNuevo:     nuevoSaldo,
		ReferenciaID:   refID,
		ReferenciaTipo: pgText(input.ReferenciaTipo),
		Descripcion:    pgText(input.Descripcion),
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create movimiento: %w", err)
	}

	resp := toPuntosClienteResponse(m)
	return &resp, nil
}

func (s *LoyaltyService) CanjearPuntos(ctx context.Context, userID pgtype.UUID, clienteID string, input CanjearPuntosInput) (*PuntosClienteResponse, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	// Check programa min canje
	programa, err := s.queries.GetProgramaFidelidad(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProgramaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get programa: %w", err)
	}
	if input.Puntos < int(programa.MinimoCanje) {
		return nil, ErrMinimoCanje
	}

	// Get current balance
	saldo, err := s.queries.GetSaldoPuntos(ctx, repository.GetSaldoPuntosParams{
		ClienteID: pgClienteID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		saldo = 0
	} else if err != nil {
		return nil, fmt.Errorf("get saldo: %w", err)
	}

	if int(saldo) < input.Puntos {
		return nil, ErrInsuficientePuntos
	}

	nuevoSaldo := saldo - int32(input.Puntos)

	m, err := s.queries.CreateMovimientoPuntos(ctx, repository.CreateMovimientoPuntosParams{
		ClienteID:     pgClienteID,
		Tipo:          "CANJE",
		Puntos:        -int32(input.Puntos),
		SaldoAnterior: saldo,
		SaldoNuevo:    nuevoSaldo,
		Descripcion:   pgText(input.Descripcion),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create movimiento canje: %w", err)
	}

	resp := toPuntosClienteResponse(m)
	return &resp, nil
}

// --- Helpers ---

func toProgramaResponse(p repository.ProgramaFidelidad) *ProgramaFidelidadResponse {
	return &ProgramaFidelidadResponse{
		ID:            uuidStrFromPg(p.ID),
		Nombre:        p.Nombre,
		PuntosPorPeso: floatFromNumeric(p.PuntosPorPeso),
		ValorPunto:    floatFromNumeric(p.ValorPunto),
		MinimoCanje:   int(p.MinimoCanje),
		Activo:        p.Activo,
		CreatedAt:     p.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:     p.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func toPuntosClienteResponse(m repository.PuntosCliente) PuntosClienteResponse {
	return PuntosClienteResponse{
		ID:             uuidStrFromPg(m.ID),
		ClienteID:      uuidStrFromPg(m.ClienteID),
		Tipo:           m.Tipo,
		Puntos:         int(m.Puntos),
		SaldoAnterior:  int(m.SaldoAnterior),
		SaldoNuevo:     int(m.SaldoNuevo),
		ReferenciaID:   uuidStrFromPg(m.ReferenciaID),
		ReferenciaTipo: textFromPg(m.ReferenciaTipo),
		Descripcion:    textFromPg(m.Descripcion),
		CreatedAt:      m.CreatedAt.Time.Format(time.RFC3339),
	}
}
