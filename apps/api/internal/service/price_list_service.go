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
	ErrListaPrecioNotFound = errors.New("lista de precios not found")
	ErrPrecioNotFound      = errors.New("precio not found")
)

type PriceListService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewPriceListService(db *pgxpool.Pool) *PriceListService {
	return &PriceListService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type ListaPrecioResponse struct {
	ID          string `json:"id"`
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion,omitempty"`
	Tipo        string `json:"tipo"`
	Activa      bool   `json:"activa"`
	FechaDesde  string `json:"fecha_desde,omitempty"`
	FechaHasta  string `json:"fecha_hasta,omitempty"`
	SucursalID  string `json:"sucursal_id,omitempty"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type PrecioListaResponse struct {
	ID                  string  `json:"id"`
	ListaID             string  `json:"lista_id"`
	ProductoID          string  `json:"producto_id"`
	ProductoNombre      string  `json:"producto_nombre,omitempty"`
	ProductoCodigo      string  `json:"producto_codigo,omitempty"`
	Precio              float64 `json:"precio"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
}

type CreateListaPrecioInput struct {
	Nombre      string `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion string `json:"descripcion"`
	Tipo        string `json:"tipo" validate:"required,oneof=GENERAL SUCURSAL CLIENTE"`
	Activa      bool   `json:"activa"`
	FechaDesde  string `json:"fecha_desde"`
	FechaHasta  string `json:"fecha_hasta"`
	SucursalID  string `json:"sucursal_id"`
}

type UpdateListaPrecioInput struct {
	Nombre      string `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion string `json:"descripcion"`
	Tipo        string `json:"tipo" validate:"required,oneof=GENERAL SUCURSAL CLIENTE"`
	Activa      bool   `json:"activa"`
	FechaDesde  string `json:"fecha_desde"`
	FechaHasta  string `json:"fecha_hasta"`
	SucursalID  string `json:"sucursal_id"`
}

type UpsertPrecioInput struct {
	ProductoID          string  `json:"producto_id" validate:"required,uuid"`
	Precio              float64 `json:"precio" validate:"required,gt=0"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje" validate:"gte=0,lte=100"`
}

// --- Methods ---

func (s *PriceListService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]ListaPrecioResponse, int, error) {
	items, err := s.queries.ListListasPrecios(ctx, repository.ListListasPreciosParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list listas precios: %w", err)
	}

	count, err := s.queries.CountListasPrecios(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count listas precios: %w", err)
	}

	result := make([]ListaPrecioResponse, 0, len(items))
	for _, lp := range items {
		result = append(result, toListaPrecioResponse(lp))
	}
	return result, int(count), nil
}

func (s *PriceListService) Get(ctx context.Context, userID pgtype.UUID, id string) (*ListaPrecioResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrListaPrecioNotFound
	}

	lp, err := s.queries.GetListaPrecioByID(ctx, repository.GetListaPrecioByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrListaPrecioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get lista precio: %w", err)
	}

	resp := toListaPrecioResponse(lp)
	return &resp, nil
}

func (s *PriceListService) Create(ctx context.Context, userID pgtype.UUID, input CreateListaPrecioInput) (*ListaPrecioResponse, error) {
	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		var err error
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	fechaDesde, err := pgDate(input.FechaDesde)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_desde: %w", err)
	}
	fechaHasta, err := pgDate(input.FechaHasta)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_hasta: %w", err)
	}

	lp, err := s.queries.CreateListaPrecio(ctx, repository.CreateListaPrecioParams{
		Nombre:      input.Nombre,
		Descripcion: pgText(input.Descripcion),
		Tipo:        input.Tipo,
		Activa:      input.Activa,
		FechaDesde:  fechaDesde,
		FechaHasta:  fechaHasta,
		SucursalID:  sucursalID,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create lista precio: %w", err)
	}

	resp := toListaPrecioResponse(lp)
	return &resp, nil
}

func (s *PriceListService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateListaPrecioInput) (*ListaPrecioResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrListaPrecioNotFound
	}

	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	fechaDesde, err := pgDate(input.FechaDesde)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_desde: %w", err)
	}
	fechaHasta, err := pgDate(input.FechaHasta)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_hasta: %w", err)
	}

	lp, err := s.queries.UpdateListaPrecio(ctx, repository.UpdateListaPrecioParams{
		ID:          pgID,
		UsuarioID:   userID,
		Nombre:      input.Nombre,
		Descripcion: pgText(input.Descripcion),
		Tipo:        input.Tipo,
		Activa:      input.Activa,
		FechaDesde:  fechaDesde,
		FechaHasta:  fechaHasta,
		SucursalID:  sucursalID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrListaPrecioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update lista precio: %w", err)
	}

	resp := toListaPrecioResponse(lp)
	return &resp, nil
}

func (s *PriceListService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrListaPrecioNotFound
	}

	return s.queries.SoftDeleteListaPrecio(ctx, repository.SoftDeleteListaPrecioParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

// --- Precios ---

func (s *PriceListService) ListPrecios(ctx context.Context, userID pgtype.UUID, listaID string) ([]PrecioListaResponse, error) {
	pgListaID, err := pgUUID(listaID)
	if err != nil {
		return nil, ErrListaPrecioNotFound
	}

	// Verify ownership
	_, err = s.queries.GetListaPrecioByID(ctx, repository.GetListaPrecioByIDParams{
		ID:        pgListaID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrListaPrecioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get lista: %w", err)
	}

	items, err := s.queries.ListPreciosLista(ctx, pgListaID)
	if err != nil {
		return nil, fmt.Errorf("list precios: %w", err)
	}

	result := make([]PrecioListaResponse, 0, len(items))
	for _, p := range items {
		result = append(result, PrecioListaResponse{
			ID:                  uuidStrFromPg(p.ID),
			ListaID:             uuidStrFromPg(p.ListaID),
			ProductoID:          uuidStrFromPg(p.ProductoID),
			ProductoNombre:      p.ProductoNombre,
			ProductoCodigo:      textFromPg(p.ProductoCodigo),
			Precio:              floatFromNumeric(p.Precio),
			DescuentoPorcentaje: floatFromNumeric(p.DescuentoPorcentaje),
		})
	}
	return result, nil
}

func (s *PriceListService) UpsertPrecio(ctx context.Context, userID pgtype.UUID, listaID string, input UpsertPrecioInput) (*PrecioListaResponse, error) {
	pgListaID, err := pgUUID(listaID)
	if err != nil {
		return nil, ErrListaPrecioNotFound
	}

	// Verify ownership
	_, err = s.queries.GetListaPrecioByID(ctx, repository.GetListaPrecioByIDParams{
		ID:        pgListaID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrListaPrecioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get lista: %w", err)
	}

	productoID, err := pgUUID(input.ProductoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}

	p, err := s.queries.UpsertPrecioLista(ctx, repository.UpsertPrecioListaParams{
		ListaID:             pgListaID,
		ProductoID:          productoID,
		Precio:              numericFromFloat(input.Precio),
		DescuentoPorcentaje: numericFromFloat(input.DescuentoPorcentaje),
	})
	if err != nil {
		return nil, fmt.Errorf("upsert precio: %w", err)
	}

	return &PrecioListaResponse{
		ID:                  uuidStrFromPg(p.ID),
		ListaID:             uuidStrFromPg(p.ListaID),
		ProductoID:          uuidStrFromPg(p.ProductoID),
		Precio:              floatFromNumeric(p.Precio),
		DescuentoPorcentaje: floatFromNumeric(p.DescuentoPorcentaje),
	}, nil
}

func (s *PriceListService) DeletePrecio(ctx context.Context, userID pgtype.UUID, listaID, precioID string) error {
	pgListaID, err := pgUUID(listaID)
	if err != nil {
		return ErrListaPrecioNotFound
	}

	// Verify ownership
	_, err = s.queries.GetListaPrecioByID(ctx, repository.GetListaPrecioByIDParams{
		ID:        pgListaID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrListaPrecioNotFound
	}
	if err != nil {
		return fmt.Errorf("get lista: %w", err)
	}

	pgPrecioID, err := pgUUID(precioID)
	if err != nil {
		return ErrPrecioNotFound
	}

	return s.queries.DeletePrecioLista(ctx, repository.DeletePrecioListaParams{
		ID:      pgPrecioID,
		ListaID: pgListaID,
	})
}

func (s *PriceListService) GetPriceForProduct(ctx context.Context, userID pgtype.UUID, productoID, listaID string) (*PrecioListaResponse, error) {
	pgProductoID, err := pgUUID(productoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}
	pgListaID, err := pgUUID(listaID)
	if err != nil {
		return nil, fmt.Errorf("invalid lista_id")
	}

	p, err := s.queries.GetPrecioByProductoAndLista(ctx, repository.GetPrecioByProductoAndListaParams{
		ProductoID: pgProductoID,
		ListaID:    pgListaID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPrecioNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get precio: %w", err)
	}

	return &PrecioListaResponse{
		ID:                  uuidStrFromPg(p.ID),
		ListaID:             uuidStrFromPg(p.ListaID),
		ProductoID:          uuidStrFromPg(p.ProductoID),
		Precio:              floatFromNumeric(p.Precio),
		DescuentoPorcentaje: floatFromNumeric(p.DescuentoPorcentaje),
	}, nil
}

func toListaPrecioResponse(lp repository.ListaPrecio) ListaPrecioResponse {
	return ListaPrecioResponse{
		ID:          uuidStrFromPg(lp.ID),
		Nombre:      lp.Nombre,
		Descripcion: textFromPg(lp.Descripcion),
		Tipo:        lp.Tipo,
		Activa:      lp.Activa,
		FechaDesde:  dateFromPg(lp.FechaDesde),
		FechaHasta:  dateFromPg(lp.FechaHasta),
		SucursalID:  uuidStrFromPg(lp.SucursalID),
		CreatedAt:   lp.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:   lp.UpdatedAt.Time.Format(time.RFC3339),
	}
}

// --- Price lookup for order creation ---

type ClientePrecioResponse struct {
	ProductoID          string  `json:"producto_id"`
	Precio              float64 `json:"precio"`
	DescuentoPorcentaje float64 `json:"descuento_porcentaje"`
	ListaNombre         string  `json:"lista_nombre"`
}

// GetPreciosForCliente returns prices from the client's assigned price list.
// If the client has no assigned list, returns an empty slice.
func (s *PriceListService) GetPreciosForCliente(ctx context.Context, userID pgtype.UUID, clienteID string) ([]ClientePrecioResponse, error) {
	rows, err := s.db.Query(ctx,
		`SELECT pl.producto_id, pl.precio, pl.descuento_porcentaje, lp.nombre
		 FROM precios_lista pl
		 JOIN listas_precios lp ON lp.id = pl.lista_id
		 JOIN clientes c ON c.lista_precios_id = lp.id
		 WHERE c.id = $1 AND c.usuario_id = $2 AND lp.activa = true`,
		clienteID, userID)
	if err != nil {
		return nil, fmt.Errorf("get precios for cliente: %w", err)
	}
	defer rows.Close()

	var results []ClientePrecioResponse
	for rows.Next() {
		var r ClientePrecioResponse
		var productoID pgtype.UUID
		if err := rows.Scan(&productoID, &r.Precio, &r.DescuentoPorcentaje, &r.ListaNombre); err != nil {
			return nil, fmt.Errorf("scan precio: %w", err)
		}
		r.ProductoID = uuidStrFromPg(productoID)
		results = append(results, r)
	}
	if results == nil {
		results = []ClientePrecioResponse{}
	}
	return results, nil
}

// GetPrecioProducto returns the price for a specific product from a client's list.
func (s *PriceListService) GetPrecioProducto(ctx context.Context, userID pgtype.UUID, clienteID, productoID string) (*ClientePrecioResponse, error) {
	var r ClientePrecioResponse
	var pID pgtype.UUID
	err := s.db.QueryRow(ctx,
		`SELECT pl.producto_id, pl.precio, pl.descuento_porcentaje, lp.nombre
		 FROM precios_lista pl
		 JOIN listas_precios lp ON lp.id = pl.lista_id
		 JOIN clientes c ON c.lista_precios_id = lp.id
		 WHERE c.id = $1 AND c.usuario_id = $2 AND pl.producto_id = $3 AND lp.activa = true`,
		clienteID, userID, productoID).Scan(&pID, &r.Precio, &r.DescuentoPorcentaje, &r.ListaNombre)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil // no custom price — use catalog price
	}
	if err != nil {
		return nil, fmt.Errorf("get precio producto: %w", err)
	}
	r.ProductoID = uuidStrFromPg(pID)
	return &r, nil
}
