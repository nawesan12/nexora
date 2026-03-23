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
	ErrRemitoNotFound           = errors.New("remito not found")
	ErrInvalidRemitoTransition  = errors.New("invalid remito state transition")
)

type RemitoService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewRemitoService(db *pgxpool.Pool) *RemitoService {
	return &RemitoService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type RemitoListResponse struct {
	ID             string `json:"id"`
	Numero         string `json:"numero"`
	Estado         string `json:"estado"`
	PedidoID       string `json:"pedido_id,omitempty"`
	ClienteID      string `json:"cliente_id"`
	ClienteNombre  string `json:"cliente_nombre"`
	SucursalNombre string `json:"sucursal_nombre"`
	FechaEmision   string `json:"fecha_emision"`
	FechaEntrega   string `json:"fecha_entrega,omitempty"`
	Transportista  string `json:"transportista,omitempty"`
	CreatedAt      string `json:"created_at"`
}

type RemitoDetailResponse struct {
	ID              string                 `json:"id"`
	Numero          string                 `json:"numero"`
	Estado          string                 `json:"estado"`
	PedidoID        string                 `json:"pedido_id,omitempty"`
	RepartoID       string                 `json:"reparto_id,omitempty"`
	ClienteID       string                 `json:"cliente_id"`
	ClienteNombre   string                 `json:"cliente_nombre"`
	ClienteApellido string                 `json:"cliente_apellido,omitempty"`
	DireccionID     string                 `json:"direccion_id,omitempty"`
	SucursalID      string                 `json:"sucursal_id"`
	SucursalNombre  string                 `json:"sucursal_nombre"`
	FechaEmision    string                 `json:"fecha_emision"`
	FechaEntrega    string                 `json:"fecha_entrega,omitempty"`
	Transportista   string                 `json:"transportista,omitempty"`
	Patente         string                 `json:"patente,omitempty"`
	Observaciones   string                 `json:"observaciones,omitempty"`
	FirmaURL        string                 `json:"firma_url,omitempty"`
	FotoURL         string                 `json:"foto_url,omitempty"`
	RecibidoPor     string                 `json:"recibido_por,omitempty"`
	FechaRecepcion  string                 `json:"fecha_recepcion,omitempty"`
	Items           []DetalleRemitoResponse `json:"items"`
	CreatedAt       string                 `json:"created_at"`
}

type DetalleRemitoResponse struct {
	ID                string  `json:"id"`
	ProductoID        string  `json:"producto_id,omitempty"`
	ProductoNombre    string  `json:"producto_nombre"`
	ProductoCodigo    string  `json:"producto_codigo,omitempty"`
	ProductoUnidad    string  `json:"producto_unidad"`
	Cantidad          float64 `json:"cantidad"`
	CantidadEntregada float64 `json:"cantidad_entregada"`
	Orden             int32   `json:"orden"`
}

// --- Input DTOs ---

type CreateRemitoFromPedidoInput struct {
	PedidoID      string `json:"pedido_id" validate:"required,uuid"`
	Transportista string `json:"transportista"`
	Patente       string `json:"patente"`
	Observaciones string `json:"observaciones"`
}

type CreateRemitoManualInput struct {
	ClienteID     string                  `json:"cliente_id" validate:"required,uuid"`
	SucursalID    string                  `json:"sucursal_id" validate:"required,uuid"`
	DireccionID   string                  `json:"direccion_id"`
	Transportista string                  `json:"transportista"`
	Patente       string                  `json:"patente"`
	Observaciones string                  `json:"observaciones"`
	Items         []RemitoItemInput       `json:"items" validate:"required,min=1,dive"`
}

type RemitoItemInput struct {
	ProductoID     string  `json:"producto_id"`
	Nombre         string  `json:"nombre" validate:"required,min=1,max=300"`
	Codigo         string  `json:"codigo"`
	Unidad         string  `json:"unidad" validate:"required,min=1,max=20"`
	Cantidad       float64 `json:"cantidad" validate:"required,gt=0"`
}

type EntregarRemitoInput struct {
	FirmaURL    string `json:"firma_url"`
	FotoURL     string `json:"foto_url"`
	RecibidoPor string `json:"recibido_por"`
}

// --- Methods ---

func (s *RemitoService) CreateFromPedido(ctx context.Context, userID pgtype.UUID, input CreateRemitoFromPedidoInput) (*RemitoDetailResponse, error) {
	pedidoID, err := pgUUID(input.PedidoID)
	if err != nil {
		return nil, fmt.Errorf("invalid pedido_id")
	}

	// Get pedido
	pedido, err := s.queries.GetPedidoByID(ctx, repository.GetPedidoByIDParams{
		ID: pedidoID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("pedido not found")
	}
	if err != nil {
		return nil, fmt.Errorf("get pedido: %w", err)
	}

	// Get pedido items
	items, err := s.queries.ListDetallePedido(ctx, pedidoID)
	if err != nil {
		return nil, fmt.Errorf("list detalle pedido: %w", err)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	numero, err := qtx.GetNextRemitoNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next remito numero: %w", err)
	}

	remito, err := qtx.CreateRemito(ctx, repository.CreateRemitoParams{
		Numero:        fmt.Sprintf("R-%08d", numero),
		Estado:        repository.EstadoRemitoBORRADOR,
		PedidoID:      pedidoID,
		ClienteID:     pedido.ClienteID,
		DireccionID:   pedido.DireccionID,
		SucursalID:    pedido.SucursalID,
		FechaEmision:  pgtype.Date{Time: time.Now(), Valid: true},
		Transportista: pgText(input.Transportista),
		Patente:       pgText(input.Patente),
		Observaciones: pgText(input.Observaciones),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create remito: %w", err)
	}

	for i, item := range items {
		_, err = qtx.CreateDetalleRemito(ctx, repository.CreateDetalleRemitoParams{
			RemitoID:       remito.ID,
			ProductoID:     item.ProductoID,
			ProductoNombre: item.ProductoNombre,
			ProductoCodigo: item.ProductoCodigo,
			ProductoUnidad: item.ProductoUnidad,
			Cantidad:       item.Cantidad,
			Orden:          int32(i),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle remito: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(remito.ID))
}

func (s *RemitoService) Get(ctx context.Context, userID pgtype.UUID, id string) (*RemitoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRemitoNotFound
	}

	r, err := s.queries.GetRemitoByID(ctx, repository.GetRemitoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRemitoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get remito: %w", err)
	}

	detalles, err := s.queries.ListDetallesByRemito(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalles remito: %w", err)
	}

	resp := &RemitoDetailResponse{
		ID:              uuidStrFromPg(r.ID),
		Numero:          r.Numero,
		Estado:          string(r.Estado),
		PedidoID:        uuidStrFromPg(r.PedidoID),
		RepartoID:       uuidStrFromPg(r.RepartoID),
		ClienteID:       uuidStrFromPg(r.ClienteID),
		ClienteNombre:   r.ClienteNombre,
		ClienteApellido: textFromPg(r.ClienteApellido),
		DireccionID:     uuidStrFromPg(r.DireccionID),
		SucursalID:      uuidStrFromPg(r.SucursalID),
		SucursalNombre:  r.SucursalNombre,
		FechaEmision:    dateFromPg(r.FechaEmision),
		FechaEntrega:    dateFromPg(r.FechaEntrega),
		Transportista:   textFromPg(r.Transportista),
		Patente:         textFromPg(r.Patente),
		Observaciones:   textFromPg(r.Observaciones),
		FirmaURL:        textFromPg(r.FirmaURL),
		FotoURL:         textFromPg(r.FotoURL),
		RecibidoPor:     textFromPg(r.RecibidoPor),
		CreatedAt:       r.CreatedAt.Time.Format(time.RFC3339),
	}
	if r.FechaRecepcion.Valid {
		resp.FechaRecepcion = r.FechaRecepcion.Time.Format(time.RFC3339)
	}

	resp.Items = make([]DetalleRemitoResponse, 0, len(detalles))
	for _, d := range detalles {
		resp.Items = append(resp.Items, DetalleRemitoResponse{
			ID:                uuidStrFromPg(d.ID),
			ProductoID:        uuidStrFromPg(d.ProductoID),
			ProductoNombre:    d.ProductoNombre,
			ProductoCodigo:    textFromPg(d.ProductoCodigo),
			ProductoUnidad:    d.ProductoUnidad,
			Cantidad:          floatFromNumeric(d.Cantidad),
			CantidadEntregada: floatFromNumeric(d.CantidadEntregada),
			Orden:             d.Orden,
		})
	}

	return resp, nil
}

func (s *RemitoService) List(ctx context.Context, userID pgtype.UUID, estado string, limit, offset int32) ([]RemitoListResponse, int, error) {
	if estado != "" {
		items, err := s.queries.ListRemitosByEstado(ctx, repository.ListRemitosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoRemito(estado), Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list remitos by estado: %w", err)
		}
		count, err := s.queries.CountRemitosByEstado(ctx, repository.CountRemitosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoRemito(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count remitos by estado: %w", err)
		}
		return toRemitoListResponses(items), int(count), nil
	}

	items, err := s.queries.ListRemitos(ctx, repository.ListRemitosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list remitos: %w", err)
	}
	count, err := s.queries.CountRemitos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count remitos: %w", err)
	}
	return toRemitoListResponses(items), int(count), nil
}

func toRemitoListResponses(items []repository.ListRemitosRow) []RemitoListResponse {
	result := make([]RemitoListResponse, 0, len(items))
	for _, r := range items {
		resp := RemitoListResponse{
			ID:             uuidStrFromPg(r.ID),
			Numero:         r.Numero,
			Estado:         string(r.Estado),
			PedidoID:       uuidStrFromPg(r.PedidoID),
			ClienteID:      uuidStrFromPg(r.ClienteID),
			ClienteNombre:  r.ClienteNombre,
			SucursalNombre: r.SucursalNombre,
			FechaEmision:   dateFromPg(r.FechaEmision),
			FechaEntrega:   dateFromPg(r.FechaEntrega),
			Transportista:  textFromPg(r.Transportista),
			CreatedAt:      r.CreatedAt.Time.Format(time.RFC3339),
		}
		result = append(result, resp)
	}
	return result
}

func (s *RemitoService) Emitir(ctx context.Context, userID pgtype.UUID, id string) (*RemitoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRemitoNotFound
	}

	r, err := s.queries.GetRemitoByID(ctx, repository.GetRemitoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRemitoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get remito: %w", err)
	}

	if r.Estado != repository.EstadoRemitoBORRADOR {
		return nil, fmt.Errorf("%w: solo se puede emitir un remito en estado BORRADOR", ErrInvalidRemitoTransition)
	}

	err = s.queries.UpdateRemitoEstado(ctx, repository.UpdateRemitoEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: repository.EstadoRemitoEMITIDO,
	})
	if err != nil {
		return nil, fmt.Errorf("update remito estado: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *RemitoService) MarkAsEntregado(ctx context.Context, userID pgtype.UUID, id string, input EntregarRemitoInput) (*RemitoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRemitoNotFound
	}

	r, err := s.queries.GetRemitoByID(ctx, repository.GetRemitoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRemitoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get remito: %w", err)
	}

	if r.Estado != repository.EstadoRemitoEMITIDO {
		return nil, fmt.Errorf("%w: solo se puede entregar un remito en estado EMITIDO", ErrInvalidRemitoTransition)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	now := time.Now()
	err = qtx.UpdateRemitoEntrega(ctx, repository.UpdateRemitoEntregaParams{
		ID:             pgID,
		UsuarioID:      userID,
		FirmaURL:       pgText(input.FirmaURL),
		FotoURL:        pgText(input.FotoURL),
		RecibidoPor:    pgText(input.RecibidoPor),
		FechaRecepcion: pgtype.Timestamptz{Time: now, Valid: true},
		FechaEntrega:   pgtype.Date{Time: now, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("update remito entrega: %w", err)
	}

	err = qtx.UpdateRemitoEstado(ctx, repository.UpdateRemitoEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: repository.EstadoRemitoENTREGADO,
	})
	if err != nil {
		return nil, fmt.Errorf("update remito estado: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *RemitoService) Anular(ctx context.Context, userID pgtype.UUID, id string) (*RemitoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRemitoNotFound
	}

	r, err := s.queries.GetRemitoByID(ctx, repository.GetRemitoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRemitoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get remito: %w", err)
	}

	if r.Estado == repository.EstadoRemitoANULADO {
		return nil, fmt.Errorf("%w: el remito ya esta anulado", ErrInvalidRemitoTransition)
	}
	if r.Estado == repository.EstadoRemitoENTREGADO {
		return nil, fmt.Errorf("%w: no se puede anular un remito ya entregado", ErrInvalidRemitoTransition)
	}

	err = s.queries.UpdateRemitoEstado(ctx, repository.UpdateRemitoEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: repository.EstadoRemitoANULADO,
	})
	if err != nil {
		return nil, fmt.Errorf("update remito estado: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *RemitoService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrRemitoNotFound
	}

	_, err = s.queries.GetRemitoByID(ctx, repository.GetRemitoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrRemitoNotFound
	}
	if err != nil {
		return fmt.Errorf("get remito: %w", err)
	}

	return s.queries.SoftDeleteRemito(ctx, repository.SoftDeleteRemitoParams{
		ID: pgID, UsuarioID: userID,
	})
}
