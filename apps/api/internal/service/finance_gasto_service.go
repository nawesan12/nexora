package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

var (
	ErrGastoNotFound           = errors.New("gasto not found")
	ErrGastoRecurrenteNotFound = errors.New("gasto recurrente not found")
	ErrMetodoPagoNotFound      = errors.New("metodo de pago not found")
)

type GastoService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewGastoService(db *pgxpool.Pool) *GastoService {
	return &GastoService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type GastoResponse struct {
	ID          string  `json:"id"`
	Concepto    string  `json:"concepto"`
	Monto       float64 `json:"monto"`
	Categoria   string  `json:"categoria"`
	Fecha       string  `json:"fecha"`
	Comprobante string  `json:"comprobante,omitempty"`
	SucursalID  string  `json:"sucursal_id"`
	Active      bool    `json:"active"`
}

type GastoRecurrenteResponse struct {
	ID          string  `json:"id"`
	Concepto    string  `json:"concepto"`
	Monto       float64 `json:"monto"`
	Categoria   string  `json:"categoria"`
	Frecuencia  string  `json:"frecuencia"`
	ProximaFecha string `json:"proxima_fecha"`
	Activo      bool    `json:"activo"`
	SucursalID  string  `json:"sucursal_id"`
}

type MetodoPagoResponse struct {
	ID                   string  `json:"id"`
	Nombre               string  `json:"nombre"`
	Tipo                 string  `json:"tipo"`
	ComisionPorcentaje   float64 `json:"comision_porcentaje"`
	DescuentoPorcentaje  float64 `json:"descuento_porcentaje"`
	Activo               bool    `json:"activo"`
	SucursalID           string  `json:"sucursal_id"`
}

// --- Input DTOs ---

type CreateGastoInput struct {
	Concepto    string  `json:"concepto" validate:"required,min=2,max=500"`
	Monto       float64 `json:"monto" validate:"required,gt=0"`
	Categoria   string  `json:"categoria" validate:"required"`
	Fecha       string  `json:"fecha" validate:"required"`
	Comprobante string  `json:"comprobante"`
	SucursalID  string  `json:"sucursal_id" validate:"required,uuid"`
}

type UpdateGastoInput struct {
	Concepto    string  `json:"concepto" validate:"required,min=2,max=500"`
	Monto       float64 `json:"monto" validate:"required,gt=0"`
	Categoria   string  `json:"categoria" validate:"required"`
	Fecha       string  `json:"fecha" validate:"required"`
	Comprobante string  `json:"comprobante"`
	SucursalID  string  `json:"sucursal_id" validate:"required,uuid"`
}

type CreateGastoRecurrenteInput struct {
	Concepto     string  `json:"concepto" validate:"required,min=2,max=500"`
	Monto        float64 `json:"monto" validate:"required,gt=0"`
	Categoria    string  `json:"categoria" validate:"required"`
	Frecuencia   string  `json:"frecuencia" validate:"required,oneof=DIARIO SEMANAL QUINCENAL MENSUAL BIMESTRAL TRIMESTRAL SEMESTRAL ANUAL"`
	ProximaFecha string  `json:"proxima_fecha" validate:"required"`
	SucursalID   string  `json:"sucursal_id" validate:"required,uuid"`
}

type UpdateGastoRecurrenteInput struct {
	Concepto     string  `json:"concepto" validate:"required,min=2,max=500"`
	Monto        float64 `json:"monto" validate:"required,gt=0"`
	Categoria    string  `json:"categoria" validate:"required"`
	Frecuencia   string  `json:"frecuencia" validate:"required,oneof=DIARIO SEMANAL QUINCENAL MENSUAL BIMESTRAL TRIMESTRAL SEMESTRAL ANUAL"`
	ProximaFecha string  `json:"proxima_fecha" validate:"required"`
	SucursalID   string  `json:"sucursal_id" validate:"required,uuid"`
}

type CreateMetodoPagoInput struct {
	Nombre              string  `json:"nombre" validate:"required,min=2,max=200"`
	Tipo                string  `json:"tipo" validate:"required"`
	ComisionPorcentaje  float64 `json:"comision_porcentaje" validate:"gte=0,lte=100"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
	SucursalID          string  `json:"sucursal_id" validate:"required,uuid"`
}

type UpdateMetodoPagoInput struct {
	Nombre              string  `json:"nombre" validate:"required,min=2,max=200"`
	Tipo                string  `json:"tipo" validate:"required"`
	ComisionPorcentaje  float64 `json:"comision_porcentaje" validate:"gte=0,lte=100"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
	SucursalID          string  `json:"sucursal_id" validate:"required,uuid"`
}

// --- Gastos ---

func (s *GastoService) CreateGasto(ctx context.Context, userID pgtype.UUID, input CreateGastoInput) (*GastoResponse, error) {
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha: %w", err)
	}

	g, err := s.queries.CreateGasto(ctx, repository.CreateGastoParams{
		Concepto:    input.Concepto,
		Monto:       numericFromFloat(input.Monto),
		Categoria:   repository.TipoGasto(input.Categoria),
		Fecha:       fecha,
		Comprobante: pgText(input.Comprobante),
		SucursalID:  sucID,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create gasto: %w", err)
	}
	return toGastoResponse(g), nil
}

func (s *GastoService) GetGasto(ctx context.Context, userID pgtype.UUID, id string) (*GastoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrGastoNotFound
	}
	g, err := s.queries.GetGastoByID(ctx, repository.GetGastoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrGastoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get gasto: %w", err)
	}
	return toGastoResponse(g), nil
}

func (s *GastoService) ListGastos(ctx context.Context, userID pgtype.UUID, categoria string, limit, offset int32) ([]GastoResponse, int, error) {
	if categoria != "" {
		items, err := s.queries.ListGastosByCategoria(ctx, repository.ListGastosByCategoriaParams{
			UsuarioID: userID, Categoria: repository.TipoGasto(categoria),
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list gastos by categoria: %w", err)
		}
		count, err := s.queries.CountGastosByCategoria(ctx, repository.CountGastosByCategoriaParams{
			UsuarioID: userID, Categoria: repository.TipoGasto(categoria),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count gastos by categoria: %w", err)
		}
		result := make([]GastoResponse, 0, len(items))
		for _, g := range items {
			result = append(result, *toGastoResponse(g))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListGastos(ctx, repository.ListGastosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list gastos: %w", err)
	}
	count, err := s.queries.CountGastos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count gastos: %w", err)
	}
	result := make([]GastoResponse, 0, len(items))
	for _, g := range items {
		result = append(result, *toGastoResponse(g))
	}
	return result, int(count), nil
}

func (s *GastoService) UpdateGasto(ctx context.Context, userID pgtype.UUID, id string, input UpdateGastoInput) (*GastoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrGastoNotFound
	}
	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha: %w", err)
	}

	sucID, err2 := pgUUID(input.SucursalID)
	if err2 != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	g, err := s.queries.UpdateGasto(ctx, repository.UpdateGastoParams{
		ID: pgID, UsuarioID: userID,
		Concepto:    input.Concepto,
		Monto:       numericFromFloat(input.Monto),
		Categoria:   repository.TipoGasto(input.Categoria),
		Fecha:       fecha,
		Comprobante: pgText(input.Comprobante),
		SucursalID:  sucID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrGastoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update gasto: %w", err)
	}
	return toGastoResponse(g), nil
}

func (s *GastoService) DeleteGasto(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrGastoNotFound
	}
	return s.queries.SoftDeleteGasto(ctx, repository.SoftDeleteGastoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toGastoResponse(g repository.Gasto) *GastoResponse {
	return &GastoResponse{
		ID:          uuidStrFromPg(g.ID),
		Concepto:    g.Concepto,
		Monto:       floatFromNumeric(g.Monto),
		Categoria:   string(g.Categoria),
		Fecha:       dateFromPg(g.Fecha),
		Comprobante: textFromPg(g.Comprobante),
		SucursalID:  uuidStrFromPg(g.SucursalID),
		Active:      g.Active,
	}
}

// --- Gastos Recurrentes ---

func (s *GastoService) CreateGastoRecurrente(ctx context.Context, userID pgtype.UUID, input CreateGastoRecurrenteInput) (*GastoRecurrenteResponse, error) {
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	proximaFecha, err := pgDate(input.ProximaFecha)
	if err != nil {
		return nil, fmt.Errorf("invalid proxima_fecha: %w", err)
	}

	g, err := s.queries.CreateGastoRecurrente(ctx, repository.CreateGastoRecurrenteParams{
		Concepto:     input.Concepto,
		Monto:        numericFromFloat(input.Monto),
		Categoria:    repository.TipoGasto(input.Categoria),
		Frecuencia:   input.Frecuencia,
		ProximaFecha: proximaFecha,
		SucursalID:   sucID,
		UsuarioID:    userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create gasto recurrente: %w", err)
	}
	return toGastoRecurrenteResponse(g), nil
}

func (s *GastoService) GetGastoRecurrente(ctx context.Context, userID pgtype.UUID, id string) (*GastoRecurrenteResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrGastoRecurrenteNotFound
	}
	g, err := s.queries.GetGastoRecurrenteByID(ctx, repository.GetGastoRecurrenteByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrGastoRecurrenteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get gasto recurrente: %w", err)
	}
	return toGastoRecurrenteResponse(g), nil
}

func (s *GastoService) ListGastosRecurrentes(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]GastoRecurrenteResponse, int, error) {
	items, err := s.queries.ListGastosRecurrentes(ctx, repository.ListGastosRecurrentesParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list gastos recurrentes: %w", err)
	}
	count, err := s.queries.CountGastosRecurrentes(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count gastos recurrentes: %w", err)
	}
	result := make([]GastoRecurrenteResponse, 0, len(items))
	for _, g := range items {
		result = append(result, *toGastoRecurrenteResponse(g))
	}
	return result, int(count), nil
}

func (s *GastoService) UpdateGastoRecurrente(ctx context.Context, userID pgtype.UUID, id string, input UpdateGastoRecurrenteInput) (*GastoRecurrenteResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrGastoRecurrenteNotFound
	}
	proximaFecha, err := pgDate(input.ProximaFecha)
	if err != nil {
		return nil, fmt.Errorf("invalid proxima_fecha: %w", err)
	}

	sucID2, err2 := pgUUID(input.SucursalID)
	if err2 != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	g, err := s.queries.UpdateGastoRecurrente(ctx, repository.UpdateGastoRecurrenteParams{
		ID: pgID, UsuarioID: userID,
		Concepto:     input.Concepto,
		Monto:        numericFromFloat(input.Monto),
		Categoria:    repository.TipoGasto(input.Categoria),
		Frecuencia:   input.Frecuencia,
		ProximaFecha: proximaFecha,
		SucursalID:   sucID2,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrGastoRecurrenteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update gasto recurrente: %w", err)
	}
	return toGastoRecurrenteResponse(g), nil
}

func (s *GastoService) DeleteGastoRecurrente(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrGastoRecurrenteNotFound
	}
	return s.queries.SoftDeleteGastoRecurrente(ctx, repository.SoftDeleteGastoRecurrenteParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toGastoRecurrenteResponse(g repository.GastosRecurrente) *GastoRecurrenteResponse {
	return &GastoRecurrenteResponse{
		ID:           uuidStrFromPg(g.ID),
		Concepto:     g.Concepto,
		Monto:        floatFromNumeric(g.Monto),
		Categoria:    string(g.Categoria),
		Frecuencia:   g.Frecuencia,
		ProximaFecha: dateFromPg(g.ProximaFecha),
		Activo:       g.Activo,
		SucursalID:   uuidStrFromPg(g.SucursalID),
	}
}

// --- Metodos de Pago ---

func (s *GastoService) CreateMetodoPago(ctx context.Context, userID pgtype.UUID, input CreateMetodoPagoInput) (*MetodoPagoResponse, error) {
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	m, err := s.queries.CreateMetodoPago(ctx, repository.CreateMetodoPagoParams{
		Nombre:              input.Nombre,
		Tipo:                input.Tipo,
		ComisionPorcentaje:  numericFromFloat(input.ComisionPorcentaje),
		DescuentoPorcentaje: numericFromFloat(input.DescuentoPorcentaje),
		SucursalID:          sucID,
		UsuarioID:           userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create metodo pago: %w", err)
	}
	return toMetodoPagoResponse(m), nil
}

func (s *GastoService) GetMetodoPago(ctx context.Context, userID pgtype.UUID, id string) (*MetodoPagoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrMetodoPagoNotFound
	}
	m, err := s.queries.GetMetodoPagoByID(ctx, repository.GetMetodoPagoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMetodoPagoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get metodo pago: %w", err)
	}
	return toMetodoPagoResponse(m), nil
}

func (s *GastoService) ListMetodosPago(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]MetodoPagoResponse, int, error) {
	items, err := s.queries.ListMetodosPago(ctx, repository.ListMetodosPagoParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list metodos pago: %w", err)
	}
	count, err := s.queries.CountMetodosPago(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count metodos pago: %w", err)
	}
	result := make([]MetodoPagoResponse, 0, len(items))
	for _, m := range items {
		result = append(result, *toMetodoPagoResponse(m))
	}
	return result, int(count), nil
}

func (s *GastoService) UpdateMetodoPago(ctx context.Context, userID pgtype.UUID, id string, input UpdateMetodoPagoInput) (*MetodoPagoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrMetodoPagoNotFound
	}
	sucID2, err2 := pgUUID(input.SucursalID)
	if err2 != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	m, err := s.queries.UpdateMetodoPago(ctx, repository.UpdateMetodoPagoParams{
		ID: pgID, UsuarioID: userID,
		Nombre:              input.Nombre,
		Tipo:                input.Tipo,
		ComisionPorcentaje:  numericFromFloat(input.ComisionPorcentaje),
		DescuentoPorcentaje: numericFromFloat(input.DescuentoPorcentaje),
		SucursalID:          sucID2,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMetodoPagoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update metodo pago: %w", err)
	}
	return toMetodoPagoResponse(m), nil
}

func (s *GastoService) DeleteMetodoPago(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrMetodoPagoNotFound
	}
	return s.queries.SoftDeleteMetodoPago(ctx, repository.SoftDeleteMetodoPagoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toMetodoPagoResponse(m repository.MetodosPago) *MetodoPagoResponse {
	return &MetodoPagoResponse{
		ID:                  uuidStrFromPg(m.ID),
		Nombre:              m.Nombre,
		Tipo:                m.Tipo,
		ComisionPorcentaje:  floatFromNumeric(m.ComisionPorcentaje),
		DescuentoPorcentaje: floatFromNumeric(m.DescuentoPorcentaje),
		Activo:              m.Activo,
		SucursalID:          uuidStrFromPg(m.SucursalID),
	}
}
