package service

import (
	"context"
	"errors"
	"fmt"
	"math/big"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrClienteNotFound  = errors.New("cliente not found")
	ErrCuitDuplicado    = errors.New("cuit already exists")
	ErrDireccionNotFound = errors.New("direccion not found")
)

type ClientService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewClientService(db *pgxpool.Pool) *ClientService {
	return &ClientService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type ClienteResponse struct {
	ID           string `json:"id"`
	Nombre       string `json:"nombre"`
	Apellido     string `json:"apellido,omitempty"`
	RazonSocial  string `json:"razon_social,omitempty"`
	Cuit         string `json:"cuit,omitempty"`
	CondicionIva string `json:"condicion_iva"`
	Email        string `json:"email,omitempty"`
	Telefono     string `json:"telefono,omitempty"`
	Reputacion   string `json:"reputacion"`
}

type DireccionResponse struct {
	ID           string  `json:"id"`
	ClienteID    string  `json:"cliente_id"`
	Calle        string  `json:"calle"`
	Numero       string  `json:"numero,omitempty"`
	Piso         string  `json:"piso,omitempty"`
	Departamento string  `json:"departamento,omitempty"`
	Ciudad       string  `json:"ciudad,omitempty"`
	Provincia    string  `json:"provincia,omitempty"`
	CodigoPostal string  `json:"codigo_postal,omitempty"`
	Latitud      float64 `json:"latitud,omitempty"`
	Longitud     float64 `json:"longitud,omitempty"`
	Principal    bool    `json:"principal"`
}

// --- Input DTOs ---

type CreateClienteInput struct {
	Nombre       string `json:"nombre" validate:"required,min=2,max=200"`
	Apellido     string `json:"apellido"`
	RazonSocial  string `json:"razon_social"`
	Cuit         string `json:"cuit"`
	CondicionIva string `json:"condicion_iva" validate:"required,oneof=RESPONSABLE_INSCRIPTO MONOTRIBUTO EXENTO NO_RESPONSABLE CONSUMIDOR_FINAL"`
	Email        string `json:"email"`
	Telefono     string `json:"telefono"`
	Reputacion   string `json:"reputacion" validate:"required,oneof=DEUDOR BUENA CRITICA EXCELENTE NORMAL"`
}

type UpdateClienteInput struct {
	Nombre       string `json:"nombre" validate:"required,min=2,max=200"`
	Apellido     string `json:"apellido"`
	RazonSocial  string `json:"razon_social"`
	Cuit         string `json:"cuit"`
	CondicionIva string `json:"condicion_iva" validate:"required,oneof=RESPONSABLE_INSCRIPTO MONOTRIBUTO EXENTO NO_RESPONSABLE CONSUMIDOR_FINAL"`
	Email        string `json:"email"`
	Telefono     string `json:"telefono"`
	Reputacion   string `json:"reputacion" validate:"required,oneof=DEUDOR BUENA CRITICA EXCELENTE NORMAL"`
}

type CreateDireccionInput struct {
	Calle        string  `json:"calle" validate:"required,min=2,max=300"`
	Numero       string  `json:"numero"`
	Piso         string  `json:"piso"`
	Departamento string  `json:"departamento"`
	Ciudad       string  `json:"ciudad"`
	Provincia    string  `json:"provincia"`
	CodigoPostal string  `json:"codigo_postal"`
	Latitud      float64 `json:"latitud"`
	Longitud     float64 `json:"longitud"`
	Principal    bool    `json:"principal"`
}

type UpdateDireccionInput struct {
	Calle        string  `json:"calle" validate:"required,min=2,max=300"`
	Numero       string  `json:"numero"`
	Piso         string  `json:"piso"`
	Departamento string  `json:"departamento"`
	Ciudad       string  `json:"ciudad"`
	Provincia    string  `json:"provincia"`
	CodigoPostal string  `json:"codigo_postal"`
	Latitud      float64 `json:"latitud"`
	Longitud     float64 `json:"longitud"`
	Principal    bool    `json:"principal"`
}

// --- Helpers ---

func nullCondicionIva(s string) repository.NullCondicionIva {
	if s == "" {
		return repository.NullCondicionIva{}
	}
	return repository.NullCondicionIva{
		CondicionIva: repository.CondicionIva(s),
		Valid:        true,
	}
}

func condicionIvaFromNull(n repository.NullCondicionIva) string {
	if n.Valid {
		return string(n.CondicionIva)
	}
	return ""
}

func coordToNumeric(f float64) pgtype.Numeric {
	if f == 0 {
		return pgtype.Numeric{}
	}
	return numericFromCoord(f)
}

func numericFromCoord(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	n.Valid = true
	// Store with 7 decimal places for lat/long
	intVal := int64(f * 10000000)
	n.Int = new(big.Int).SetInt64(intVal)
	n.Exp = -7
	return n
}

func coordFromNumeric(n pgtype.Numeric) float64 {
	if !n.Valid || n.Int == nil {
		return 0
	}
	return floatFromNumeric(n)
}

// --- Clientes ---

func (s *ClientService) CreateCliente(ctx context.Context, userID pgtype.UUID, input CreateClienteInput) (*ClienteResponse, error) {
	if input.Cuit != "" {
		existing, err := s.queries.GetClienteByCuit(ctx, repository.GetClienteByCuitParams{
			Cuit: pgText(input.Cuit), UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid {
			return nil, ErrCuitDuplicado
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check cuit: %w", err)
		}
	}

	c, err := s.queries.CreateCliente(ctx, repository.CreateClienteParams{
		Nombre:       input.Nombre,
		Apellido:     pgText(input.Apellido),
		RazonSocial:  pgText(input.RazonSocial),
		Cuit:         pgText(input.Cuit),
		CondicionIva: nullCondicionIva(input.CondicionIva),
		Email:        pgText(input.Email),
		Telefono:     pgText(input.Telefono),
		Reputacion:   repository.Reputacion(input.Reputacion),
		UsuarioID:    userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create cliente: %w", err)
	}
	return toClienteResponse(c), nil
}

func (s *ClientService) GetCliente(ctx context.Context, userID pgtype.UUID, id string) (*ClienteResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrClienteNotFound
	}
	c, err := s.queries.GetClienteByID(ctx, repository.GetClienteByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrClienteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get cliente: %w", err)
	}
	return toClienteResponse(c), nil
}

func (s *ClientService) ListClientes(ctx context.Context, userID pgtype.UUID, search, reputacion, condicionIva string, limit, offset int32) ([]ClienteResponse, int, error) {
	// Filter by reputacion
	if reputacion != "" {
		items, err := s.queries.ListClientesByReputacion(ctx, repository.ListClientesByReputacionParams{
			UsuarioID: userID, Reputacion: repository.Reputacion(reputacion),
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list clientes by reputacion: %w", err)
		}
		count, err := s.queries.CountClientesByReputacion(ctx, repository.CountClientesByReputacionParams{
			UsuarioID: userID, Reputacion: repository.Reputacion(reputacion),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count clientes by reputacion: %w", err)
		}
		return toClienteResponses(items), int(count), nil
	}

	// Filter by condicion_iva
	if condicionIva != "" {
		items, err := s.queries.ListClientesByCondicionIVA(ctx, repository.ListClientesByCondicionIVAParams{
			UsuarioID: userID, CondicionIva: nullCondicionIva(condicionIva),
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list clientes by condicion_iva: %w", err)
		}
		count, err := s.queries.CountClientesByCondicionIVA(ctx, repository.CountClientesByCondicionIVAParams{
			UsuarioID: userID, CondicionIva: nullCondicionIva(condicionIva),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count clientes by condicion_iva: %w", err)
		}
		return toClienteResponses(items), int(count), nil
	}

	// Search
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchClientes(ctx, repository.SearchClientesParams{
			UsuarioID: userID, Nombre: searchPattern,
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search clientes: %w", err)
		}
		count, err := s.queries.CountSearchClientes(ctx, repository.CountSearchClientesParams{
			UsuarioID: userID, Nombre: searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search clientes: %w", err)
		}
		return toClienteResponses(items), int(count), nil
	}

	// Default list
	items, err := s.queries.ListClientes(ctx, repository.ListClientesParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list clientes: %w", err)
	}
	count, err := s.queries.CountClientes(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count clientes: %w", err)
	}
	return toClienteResponses(items), int(count), nil
}

func (s *ClientService) UpdateCliente(ctx context.Context, userID pgtype.UUID, id string, input UpdateClienteInput) (*ClienteResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrClienteNotFound
	}

	if input.Cuit != "" {
		existing, err := s.queries.GetClienteByCuit(ctx, repository.GetClienteByCuitParams{
			Cuit: pgText(input.Cuit), UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid && uuidStrFromPg(existing.ID) != id {
			return nil, ErrCuitDuplicado
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check cuit: %w", err)
		}
	}

	c, err := s.queries.UpdateCliente(ctx, repository.UpdateClienteParams{
		ID: pgID, UsuarioID: userID,
		Nombre:       input.Nombre,
		Apellido:     pgText(input.Apellido),
		RazonSocial:  pgText(input.RazonSocial),
		Cuit:         pgText(input.Cuit),
		CondicionIva: nullCondicionIva(input.CondicionIva),
		Email:        pgText(input.Email),
		Telefono:     pgText(input.Telefono),
		Reputacion:   repository.Reputacion(input.Reputacion),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrClienteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update cliente: %w", err)
	}
	return toClienteResponse(c), nil
}

func (s *ClientService) DeleteCliente(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrClienteNotFound
	}
	return s.queries.SoftDeleteCliente(ctx, repository.SoftDeleteClienteParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toClienteResponse(c repository.Cliente) *ClienteResponse {
	return &ClienteResponse{
		ID:           uuidStrFromPg(c.ID),
		Nombre:       c.Nombre,
		Apellido:     textFromPg(c.Apellido),
		RazonSocial:  textFromPg(c.RazonSocial),
		Cuit:         textFromPg(c.Cuit),
		CondicionIva: condicionIvaFromNull(c.CondicionIva),
		Email:        textFromPg(c.Email),
		Telefono:     textFromPg(c.Telefono),
		Reputacion:   string(c.Reputacion),
	}
}

func toClienteResponses(items []repository.Cliente) []ClienteResponse {
	result := make([]ClienteResponse, 0, len(items))
	for _, c := range items {
		result = append(result, *toClienteResponse(c))
	}
	return result
}

// --- Direcciones ---

func (s *ClientService) verifyClientOwnership(ctx context.Context, userID pgtype.UUID, clienteID string) (pgtype.UUID, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return pgtype.UUID{}, ErrClienteNotFound
	}
	_, err = s.queries.GetClienteByID(ctx, repository.GetClienteByIDParams{
		ID: pgClienteID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return pgtype.UUID{}, ErrClienteNotFound
	}
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("verify client ownership: %w", err)
	}
	return pgClienteID, nil
}

func (s *ClientService) CreateDireccion(ctx context.Context, userID pgtype.UUID, clienteID string, input CreateDireccionInput) (*DireccionResponse, error) {
	pgClienteID, err := s.verifyClientOwnership(ctx, userID, clienteID)
	if err != nil {
		return nil, err
	}

	d, err := s.queries.CreateDireccion(ctx, repository.CreateDireccionParams{
		ClienteID:    pgClienteID,
		Calle:        input.Calle,
		Numero:       pgText(input.Numero),
		Piso:         pgText(input.Piso),
		Departamento: pgText(input.Departamento),
		Ciudad:       pgText(input.Ciudad),
		Provincia:    pgText(input.Provincia),
		CodigoPostal: pgText(input.CodigoPostal),
		Latitud:      coordToNumeric(input.Latitud),
		Longitud:     coordToNumeric(input.Longitud),
		Principal:    input.Principal,
	})
	if err != nil {
		return nil, fmt.Errorf("create direccion: %w", err)
	}
	return toDireccionResponse(d), nil
}

func (s *ClientService) ListDirecciones(ctx context.Context, userID pgtype.UUID, clienteID string) ([]DireccionResponse, error) {
	pgClienteID, err := s.verifyClientOwnership(ctx, userID, clienteID)
	if err != nil {
		return nil, err
	}

	items, err := s.queries.ListDireccionesByCliente(ctx, pgClienteID)
	if err != nil {
		return nil, fmt.Errorf("list direcciones: %w", err)
	}
	result := make([]DireccionResponse, 0, len(items))
	for _, d := range items {
		result = append(result, *toDireccionResponse(d))
	}
	return result, nil
}

func (s *ClientService) UpdateDireccion(ctx context.Context, userID pgtype.UUID, clienteID, direccionID string, input UpdateDireccionInput) (*DireccionResponse, error) {
	if _, err := s.verifyClientOwnership(ctx, userID, clienteID); err != nil {
		return nil, err
	}

	pgDirID, err := pgUUID(direccionID)
	if err != nil {
		return nil, ErrDireccionNotFound
	}

	// Verify the address belongs to this client
	existing, err := s.queries.GetDireccionByID(ctx, pgDirID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDireccionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get direccion: %w", err)
	}
	pgClienteID, _ := pgUUID(clienteID)
	if existing.ClienteID != pgClienteID {
		return nil, ErrDireccionNotFound
	}

	d, err := s.queries.UpdateDireccion(ctx, repository.UpdateDireccionParams{
		ID:           pgDirID,
		Calle:        input.Calle,
		Numero:       pgText(input.Numero),
		Piso:         pgText(input.Piso),
		Departamento: pgText(input.Departamento),
		Ciudad:       pgText(input.Ciudad),
		Provincia:    pgText(input.Provincia),
		CodigoPostal: pgText(input.CodigoPostal),
		Latitud:      coordToNumeric(input.Latitud),
		Longitud:     coordToNumeric(input.Longitud),
		Principal:    input.Principal,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDireccionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update direccion: %w", err)
	}
	return toDireccionResponse(d), nil
}

func (s *ClientService) DeleteDireccion(ctx context.Context, userID pgtype.UUID, clienteID, direccionID string) error {
	if _, err := s.verifyClientOwnership(ctx, userID, clienteID); err != nil {
		return err
	}

	pgDirID, err := pgUUID(direccionID)
	if err != nil {
		return ErrDireccionNotFound
	}

	// Verify the address belongs to this client
	existing, err := s.queries.GetDireccionByID(ctx, pgDirID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrDireccionNotFound
	}
	if err != nil {
		return fmt.Errorf("get direccion: %w", err)
	}
	pgClienteID, _ := pgUUID(clienteID)
	if existing.ClienteID != pgClienteID {
		return ErrDireccionNotFound
	}

	return s.queries.DeleteDireccion(ctx, pgDirID)
}

func (s *ClientService) SetDireccionPrincipal(ctx context.Context, userID pgtype.UUID, clienteID, direccionID string) error {
	pgClienteID, err := s.verifyClientOwnership(ctx, userID, clienteID)
	if err != nil {
		return err
	}

	pgDirID, err := pgUUID(direccionID)
	if err != nil {
		return ErrDireccionNotFound
	}

	// Verify the address belongs to this client
	existing, err := s.queries.GetDireccionByID(ctx, pgDirID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrDireccionNotFound
	}
	if err != nil {
		return fmt.Errorf("get direccion: %w", err)
	}
	if existing.ClienteID != pgClienteID {
		return ErrDireccionNotFound
	}

	// Unset all, then set the target
	if err := s.queries.UnsetDireccionesPrincipal(ctx, pgClienteID); err != nil {
		return fmt.Errorf("unset principal: %w", err)
	}
	if err := s.queries.SetDireccionPrincipal(ctx, pgDirID); err != nil {
		return fmt.Errorf("set principal: %w", err)
	}
	return nil
}

func toDireccionResponse(d repository.Direccione) *DireccionResponse {
	return &DireccionResponse{
		ID:           uuidStrFromPg(d.ID),
		ClienteID:    uuidStrFromPg(d.ClienteID),
		Calle:        d.Calle,
		Numero:       textFromPg(d.Numero),
		Piso:         textFromPg(d.Piso),
		Departamento: textFromPg(d.Departamento),
		Ciudad:       textFromPg(d.Ciudad),
		Provincia:    textFromPg(d.Provincia),
		CodigoPostal: textFromPg(d.CodigoPostal),
		Latitud:      coordFromNumeric(d.Latitud),
		Longitud:     coordFromNumeric(d.Longitud),
		Principal:    d.Principal,
	}
}
