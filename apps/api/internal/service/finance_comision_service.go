package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrConfigComisionNotFound = errors.New("configuracion comision not found")
	ErrComisionNotFound       = errors.New("comision vendedor not found")
)

type ComisionService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewComisionService(db *pgxpool.Pool) *ComisionService {
	return &ComisionService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type ConfiguracionComisionResponse struct {
	ID              string          `json:"id"`
	EmpleadoID      string          `json:"empleado_id"`
	TipoComision    string          `json:"tipo_comision"`
	PorcentajeBase  float64         `json:"porcentaje_base"`
	Escalonamiento  json.RawMessage `json:"escalonamiento,omitempty"`
	Activa          bool            `json:"activa"`
}

type ComisionVendedorResponse struct {
	ID          string  `json:"id"`
	EmpleadoID  string  `json:"empleado_id"`
	PedidoID    string  `json:"pedido_id"`
	Monto       float64 `json:"monto"`
	Porcentaje  float64 `json:"porcentaje"`
	Periodo     string  `json:"periodo,omitempty"`
}

// --- Input DTOs ---

type CreateConfiguracionComisionInput struct {
	EmpleadoID     string          `json:"empleado_id" validate:"required,uuid"`
	TipoComision   string          `json:"tipo_comision" validate:"required"`
	PorcentajeBase float64         `json:"porcentaje_base" validate:"required,gte=0,lte=100"`
	Escalonamiento json.RawMessage `json:"escalonamiento,omitempty"`
}

type UpdateConfiguracionComisionInput struct {
	TipoComision   string          `json:"tipo_comision" validate:"required"`
	PorcentajeBase float64         `json:"porcentaje_base" validate:"required,gte=0,lte=100"`
	Escalonamiento json.RawMessage `json:"escalonamiento,omitempty"`
	Activa         bool            `json:"activa"`
}

type CreateComisionVendedorInput struct {
	EmpleadoID string  `json:"empleado_id" validate:"required,uuid"`
	PedidoID   string  `json:"pedido_id" validate:"required,uuid"`
	Monto      float64 `json:"monto" validate:"required,gt=0"`
	Porcentaje float64 `json:"porcentaje" validate:"required,gte=0,lte=100"`
	Periodo    string  `json:"periodo"`
}

// --- Configuracion Comisiones ---

func (s *ComisionService) CreateConfiguracionComision(ctx context.Context, userID pgtype.UUID, input CreateConfiguracionComisionInput) (*ConfiguracionComisionResponse, error) {
	empleadoID, err := pgUUID(input.EmpleadoID)
	if err != nil {
		return nil, fmt.Errorf("invalid empleado_id")
	}

	c, err := s.queries.CreateConfiguracionComision(ctx, repository.CreateConfiguracionComisionParams{
		EmpleadoID:     empleadoID,
		TipoComision:   repository.TipoComision(input.TipoComision),
		PorcentajeBase: numericFromFloat(input.PorcentajeBase),
		Escalonamiento: input.Escalonamiento,
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create configuracion comision: %w", err)
	}
	return toConfigComisionResponse(c), nil
}

func (s *ComisionService) GetConfiguracionComision(ctx context.Context, userID pgtype.UUID, id string) (*ConfiguracionComisionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConfigComisionNotFound
	}
	c, err := s.queries.GetConfiguracionComisionByID(ctx, repository.GetConfiguracionComisionByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConfigComisionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get configuracion comision: %w", err)
	}
	return toConfigComisionResponse(c), nil
}

func (s *ComisionService) ListConfiguracionesComision(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]ConfiguracionComisionResponse, int, error) {
	items, err := s.queries.ListConfiguracionComisiones(ctx, repository.ListConfiguracionComisionesParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list configuraciones comision: %w", err)
	}
	count, err := s.queries.CountConfiguracionComisiones(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count configuraciones comision: %w", err)
	}
	result := make([]ConfiguracionComisionResponse, 0, len(items))
	for _, c := range items {
		result = append(result, *toConfigComisionResponse(c))
	}
	return result, int(count), nil
}

func (s *ComisionService) UpdateConfiguracionComision(ctx context.Context, userID pgtype.UUID, id string, input UpdateConfiguracionComisionInput) (*ConfiguracionComisionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrConfigComisionNotFound
	}
	c, err := s.queries.UpdateConfiguracionComision(ctx, repository.UpdateConfiguracionComisionParams{
		ID: pgID, UsuarioID: userID,
		TipoComision:   repository.TipoComision(input.TipoComision),
		PorcentajeBase: numericFromFloat(input.PorcentajeBase),
		Escalonamiento: input.Escalonamiento,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrConfigComisionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update configuracion comision: %w", err)
	}
	return toConfigComisionResponse(c), nil
}

func (s *ComisionService) DeleteConfiguracionComision(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrConfigComisionNotFound
	}
	return s.queries.SoftDeleteConfiguracionComision(ctx, repository.SoftDeleteConfiguracionComisionParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toConfigComisionResponse(c repository.ConfiguracionComisione) *ConfiguracionComisionResponse {
	return &ConfiguracionComisionResponse{
		ID:             uuidStrFromPg(c.ID),
		EmpleadoID:     uuidStrFromPg(c.EmpleadoID),
		TipoComision:   string(c.TipoComision),
		PorcentajeBase: floatFromNumeric(c.PorcentajeBase),
		Escalonamiento: c.Escalonamiento,
		Activa:         c.Activa,
	}
}

// --- Comisiones Vendedor ---

func (s *ComisionService) CreateComisionVendedor(ctx context.Context, userID pgtype.UUID, input CreateComisionVendedorInput) (*ComisionVendedorResponse, error) {
	empleadoID, err := pgUUID(input.EmpleadoID)
	if err != nil {
		return nil, fmt.Errorf("invalid empleado_id")
	}
	pedidoID, err := pgUUID(input.PedidoID)
	if err != nil {
		return nil, fmt.Errorf("invalid pedido_id")
	}

	c, err := s.queries.CreateComisionVendedor(ctx, repository.CreateComisionVendedorParams{
		EmpleadoID: empleadoID,
		PedidoID:   pedidoID,
		Monto:      numericFromFloat(input.Monto),
		Porcentaje: numericFromFloat(input.Porcentaje),
		Periodo:    pgText(input.Periodo),
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create comision vendedor: %w", err)
	}
	return toComisionVendedorResponse(c), nil
}

func (s *ComisionService) ListComisionesVendedor(ctx context.Context, userID pgtype.UUID, empleadoID string, limit, offset int32) ([]ComisionVendedorResponse, int, error) {
	if empleadoID != "" {
		pgEmpID, err := pgUUID(empleadoID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid empleado_id")
		}
		items, err := s.queries.ListComisionesVendedorByEmpleado(ctx, repository.ListComisionesVendedorByEmpleadoParams{
			EmpleadoID: pgEmpID, UsuarioID: userID, Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list comisiones vendedor: %w", err)
		}
		count, err := s.queries.CountComisionesVendedorByEmpleado(ctx, repository.CountComisionesVendedorByEmpleadoParams{
			EmpleadoID: pgEmpID, UsuarioID: userID,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count comisiones vendedor: %w", err)
		}
		result := make([]ComisionVendedorResponse, 0, len(items))
		for _, c := range items {
			result = append(result, *toComisionVendedorResponse(c))
		}
		return result, int(count), nil
	}
	items, err := s.queries.ListComisionesVendedor(ctx, repository.ListComisionesVendedorParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list comisiones vendedor: %w", err)
	}
	count, err := s.queries.CountComisionesVendedor(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count comisiones vendedor: %w", err)
	}
	result := make([]ComisionVendedorResponse, 0, len(items))
	for _, c := range items {
		result = append(result, *toComisionVendedorResponse(c))
	}
	return result, int(count), nil
}

func toComisionVendedorResponse(c repository.ComisionesVendedor) *ComisionVendedorResponse {
	return &ComisionVendedorResponse{
		ID:         uuidStrFromPg(c.ID),
		EmpleadoID: uuidStrFromPg(c.EmpleadoID),
		PedidoID:   uuidStrFromPg(c.PedidoID),
		Monto:      floatFromNumeric(c.Monto),
		Porcentaje: floatFromNumeric(c.Porcentaje),
		Periodo:    textFromPg(c.Periodo),
	}
}
