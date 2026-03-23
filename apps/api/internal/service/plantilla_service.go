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

var ErrPlantillaNotFound = errors.New("plantilla not found")

type PlantillaService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewPlantillaService(db *pgxpool.Pool) *PlantillaService {
	return &PlantillaService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type CreatePlantillaInput struct {
	Nombre            string               `json:"nombre" validate:"required,min=2,max=200"`
	ClienteID         string               `json:"cliente_id" validate:"required,uuid"`
	SucursalID        string               `json:"sucursal_id" validate:"required,uuid"`
	FrecuenciaDias    int32                `json:"frecuencia_dias" validate:"required,min=1"`
	ProximoGeneracion string               `json:"proximo_generacion" validate:"required"`
	Activa            bool                 `json:"activa"`
	Items             []PlantillaItemInput `json:"items" validate:"required,min=1,dive"`
}

type PlantillaItemInput struct {
	ProductoID string  `json:"producto_id" validate:"required,uuid"`
	Cantidad   float64 `json:"cantidad" validate:"required,gt=0"`
	Precio     float64 `json:"precio" validate:"required,gte=0"`
}

type PlantillaListResponse struct {
	ID                string `json:"id"`
	Nombre            string `json:"nombre"`
	ClienteID         string `json:"cliente_id"`
	ClienteNombre     string `json:"cliente_nombre,omitempty"`
	SucursalID        string `json:"sucursal_id"`
	SucursalNombre    string `json:"sucursal_nombre,omitempty"`
	FrecuenciaDias    int32  `json:"frecuencia_dias"`
	ProximoGeneracion string `json:"proximo_generacion"`
	Activa            bool   `json:"activa"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
}

type PlantillaDetailResponse struct {
	PlantillaListResponse
	Items []PlantillaItemResponse `json:"items"`
}

type PlantillaItemResponse struct {
	ID             string  `json:"id"`
	ProductoID     string  `json:"producto_id"`
	ProductoNombre string  `json:"producto_nombre,omitempty"`
	ProductoCodigo string  `json:"producto_codigo,omitempty"`
	ProductoUnidad string  `json:"producto_unidad,omitempty"`
	Cantidad       float64 `json:"cantidad"`
	Precio         float64 `json:"precio"`
}

// --- Methods ---

func (s *PlantillaService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]PlantillaListResponse, int64, error) {
	items, err := s.queries.ListPlantillas(ctx, repository.ListPlantillasParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list plantillas: %w", err)
	}

	count, err := s.queries.CountPlantillas(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count plantillas: %w", err)
	}

	result := make([]PlantillaListResponse, 0, len(items))
	for _, p := range items {
		result = append(result, toPlantillaListResponse(p))
	}
	return result, count, nil
}

func (s *PlantillaService) Get(ctx context.Context, userID pgtype.UUID, id string) (*PlantillaDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPlantillaNotFound
	}

	p, err := s.queries.GetPlantilla(ctx, repository.GetPlantillaParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPlantillaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get plantilla: %w", err)
	}

	items, err := s.queries.ListDetallePlantilla(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list detalle plantilla: %w", err)
	}

	itemResponses := make([]PlantillaItemResponse, 0, len(items))
	for _, item := range items {
		itemResponses = append(itemResponses, toPlantillaItemResponse(item))
	}

	listResp := toPlantillaGetResponse(p)
	return &PlantillaDetailResponse{
		PlantillaListResponse: listResp,
		Items:                 itemResponses,
	}, nil
}

func (s *PlantillaService) Create(ctx context.Context, userID pgtype.UUID, input CreatePlantillaInput) (*PlantillaDetailResponse, error) {
	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	proximoGen, err := pgDate(input.ProximoGeneracion)
	if err != nil {
		return nil, fmt.Errorf("invalid proximo_generacion: %w", err)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	plantilla, err := qtx.CreatePlantilla(ctx, repository.CreatePlantillaParams{
		Nombre:            input.Nombre,
		ClienteID:         clienteID,
		SucursalID:        sucursalID,
		FrecuenciaDias:    input.FrecuenciaDias,
		ProximoGeneracion: proximoGen,
		Activa:            input.Activa,
		UsuarioID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create plantilla: %w", err)
	}

	itemResponses := make([]PlantillaItemResponse, 0, len(input.Items))
	for _, item := range input.Items {
		productoID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id in item")
		}

		det, err := qtx.CreateDetallePlantilla(ctx, repository.CreateDetallePlantillaParams{
			PlantillaID: plantilla.ID,
			ProductoID:  productoID,
			Cantidad:    numericFromFloat(item.Cantidad),
			Precio:      numericFromFloat(item.Precio),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle plantilla: %w", err)
		}

		itemResponses = append(itemResponses, PlantillaItemResponse{
			ID:         uuidStrFromPg(det.ID),
			ProductoID: item.ProductoID,
			Cantidad:   item.Cantidad,
			Precio:     item.Precio,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return &PlantillaDetailResponse{
		PlantillaListResponse: PlantillaListResponse{
			ID:                uuidStrFromPg(plantilla.ID),
			Nombre:            plantilla.Nombre,
			ClienteID:         input.ClienteID,
			SucursalID:        input.SucursalID,
			FrecuenciaDias:    plantilla.FrecuenciaDias,
			ProximoGeneracion: dateFromPg(plantilla.ProximoGeneracion),
			Activa:            plantilla.Activa,
			CreatedAt:         plantilla.CreatedAt.Time.Format(time.RFC3339),
			UpdatedAt:         plantilla.UpdatedAt.Time.Format(time.RFC3339),
		},
		Items: itemResponses,
	}, nil
}

func (s *PlantillaService) Update(ctx context.Context, userID pgtype.UUID, id string, input CreatePlantillaInput) (*PlantillaDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPlantillaNotFound
	}

	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	proximoGen, err := pgDate(input.ProximoGeneracion)
	if err != nil {
		return nil, fmt.Errorf("invalid proximo_generacion: %w", err)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	plantilla, err := qtx.UpdatePlantilla(ctx, repository.UpdatePlantillaParams{
		Nombre:            input.Nombre,
		ClienteID:         clienteID,
		SucursalID:        sucursalID,
		FrecuenciaDias:    input.FrecuenciaDias,
		ProximoGeneracion: proximoGen,
		Activa:            input.Activa,
		ID:                pgID,
		UsuarioID:         userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPlantillaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update plantilla: %w", err)
	}

	// Delete old items and insert new
	if err := qtx.DeleteDetallePlantillaByPlantilla(ctx, pgID); err != nil {
		return nil, fmt.Errorf("delete detalle plantilla: %w", err)
	}

	itemResponses := make([]PlantillaItemResponse, 0, len(input.Items))
	for _, item := range input.Items {
		productoID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id in item")
		}

		det, err := qtx.CreateDetallePlantilla(ctx, repository.CreateDetallePlantillaParams{
			PlantillaID: plantilla.ID,
			ProductoID:  productoID,
			Cantidad:    numericFromFloat(item.Cantidad),
			Precio:      numericFromFloat(item.Precio),
		})
		if err != nil {
			return nil, fmt.Errorf("create detalle plantilla: %w", err)
		}

		itemResponses = append(itemResponses, PlantillaItemResponse{
			ID:         uuidStrFromPg(det.ID),
			ProductoID: item.ProductoID,
			Cantidad:   item.Cantidad,
			Precio:     item.Precio,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return &PlantillaDetailResponse{
		PlantillaListResponse: PlantillaListResponse{
			ID:                uuidStrFromPg(plantilla.ID),
			Nombre:            plantilla.Nombre,
			ClienteID:         input.ClienteID,
			SucursalID:        input.SucursalID,
			FrecuenciaDias:    plantilla.FrecuenciaDias,
			ProximoGeneracion: dateFromPg(plantilla.ProximoGeneracion),
			Activa:            plantilla.Activa,
			CreatedAt:         plantilla.CreatedAt.Time.Format(time.RFC3339),
			UpdatedAt:         plantilla.UpdatedAt.Time.Format(time.RFC3339),
		},
		Items: itemResponses,
	}, nil
}

func (s *PlantillaService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrPlantillaNotFound
	}

	return s.queries.SoftDeletePlantilla(ctx, repository.SoftDeletePlantillaParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func (s *PlantillaService) GenerarPedido(ctx context.Context, userID pgtype.UUID, id string) (string, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return "", ErrPlantillaNotFound
	}

	// Fetch the plantilla
	plantilla, err := s.queries.GetPlantilla(ctx, repository.GetPlantillaParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrPlantillaNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get plantilla: %w", err)
	}

	// Fetch items
	items, err := s.queries.ListDetallePlantilla(ctx, pgID)
	if err != nil {
		return "", fmt.Errorf("list detalle plantilla: %w", err)
	}
	if len(items) == 0 {
		return "", fmt.Errorf("plantilla has no items")
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	// Generate order number
	seq, err := qtx.NextPedidoNumero(ctx)
	if err != nil {
		return "", fmt.Errorf("next pedido numero: %w", err)
	}
	numero := fmt.Sprintf("P-%06d", seq)

	// Calculate totals
	var subtotal float64
	for _, item := range items {
		precio := floatFromNumeric(item.Precio)
		cantidad := floatFromNumeric(item.Cantidad)
		subtotal += precio * cantidad
	}

	pedido, err := qtx.CreatePedido(ctx, repository.CreatePedidoParams{
		Numero:               numero,
		ClienteID:            plantilla.ClienteID,
		SucursalID:           plantilla.SucursalID,
		Estado:               repository.EstadoPedidoPENDIENTEAPROBACION,
		CondicionPago:        repository.CondicionPagoCONTADO,
		Subtotal:             numericFromFloat(subtotal),
		DescuentoPorcentaje:  numericFromFloat(0),
		DescuentoMonto:       numericFromFloat(0),
		BaseImponible:        numericFromFloat(subtotal),
		TotalImpuestos:       numericFromFloat(0),
		Total:                numericFromFloat(subtotal),
		Observaciones:        pgText(fmt.Sprintf("Generado desde plantilla: %s", plantilla.Nombre)),
		UsuarioID:            userID,
	})
	if err != nil {
		return "", fmt.Errorf("create pedido: %w", err)
	}

	// Create detalle items
	for _, item := range items {
		lineTotal := floatFromNumeric(item.Precio) * floatFromNumeric(item.Cantidad)
		_, err := qtx.CreateDetallePedido(ctx, repository.CreateDetallePedidoParams{
			PedidoID:            pedido.ID,
			ProductoID:          item.ProductoID,
			ProductoNombre:      textFromPg(item.ProductoNombre),
			ProductoCodigo:      item.ProductoCodigo,
			ProductoUnidad:      textFromPg(item.ProductoUnidad),
			Cantidad:            item.Cantidad,
			PrecioUnitario:      item.Precio,
			DescuentoPorcentaje: numericFromFloat(0),
			DescuentoMonto:      numericFromFloat(0),
			Subtotal:            numericFromFloat(lineTotal),
		})
		if err != nil {
			return "", fmt.Errorf("create detalle pedido: %w", err)
		}
	}

	// Create historial entry
	_, err = qtx.CreateHistorialPedido(ctx, repository.CreateHistorialPedidoParams{
		PedidoID:    pedido.ID,
		EstadoNuevo: repository.EstadoPedidoPENDIENTEAPROBACION,
		Comentario:  pgText("Pedido generado automáticamente desde plantilla"),
	})
	if err != nil {
		return "", fmt.Errorf("create historial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("commit tx: %w", err)
	}

	return uuidStrFromPg(pedido.ID), nil
}

// --- Converters ---

func toPlantillaListResponse(p repository.ListPlantillasRow) PlantillaListResponse {
	return PlantillaListResponse{
		ID:                uuidStrFromPg(p.ID),
		Nombre:            p.Nombre,
		ClienteID:         uuidStrFromPg(p.ClienteID),
		ClienteNombre:     textFromPg(p.ClienteNombre),
		SucursalID:        uuidStrFromPg(p.SucursalID),
		SucursalNombre:    textFromPg(p.SucursalNombre),
		FrecuenciaDias:    p.FrecuenciaDias,
		ProximoGeneracion: dateFromPg(p.ProximoGeneracion),
		Activa:            p.Activa,
		CreatedAt:         p.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:         p.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func toPlantillaGetResponse(p repository.GetPlantillaRow) PlantillaListResponse {
	return PlantillaListResponse{
		ID:                uuidStrFromPg(p.ID),
		Nombre:            p.Nombre,
		ClienteID:         uuidStrFromPg(p.ClienteID),
		ClienteNombre:     textFromPg(p.ClienteNombre),
		SucursalID:        uuidStrFromPg(p.SucursalID),
		SucursalNombre:    textFromPg(p.SucursalNombre),
		FrecuenciaDias:    p.FrecuenciaDias,
		ProximoGeneracion: dateFromPg(p.ProximoGeneracion),
		Activa:            p.Activa,
		CreatedAt:         p.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:         p.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func toPlantillaItemResponse(item repository.ListDetallePlantillaRow) PlantillaItemResponse {
	return PlantillaItemResponse{
		ID:             uuidStrFromPg(item.ID),
		ProductoID:     uuidStrFromPg(item.ProductoID),
		ProductoNombre: textFromPg(item.ProductoNombre),
		ProductoCodigo: textFromPg(item.ProductoCodigo),
		ProductoUnidad: textFromPg(item.ProductoUnidad),
		Cantidad:       floatFromNumeric(item.Cantidad),
		Precio:         floatFromNumeric(item.Precio),
	}
}
