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
	ErrVarianteNotFound = errors.New("variante not found")
	ErrSKUNotFound      = errors.New("sku not found")
)

type VariantService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewVariantService(db *pgxpool.Pool) *VariantService {
	return &VariantService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type VarianteResponse struct {
	ID         string           `json:"id"`
	ProductoID string           `json:"producto_id"`
	Nombre     string           `json:"nombre"`
	Opciones   []OpcionResponse `json:"opciones"`
	CreatedAt  string           `json:"created_at"`
}

type OpcionResponse struct {
	ID         string `json:"id"`
	VarianteID string `json:"variante_id"`
	Valor      string `json:"valor"`
	Orden      int    `json:"orden"`
}

type SKUResponse struct {
	ID              string   `json:"id"`
	ProductoID      string   `json:"producto_id"`
	SKU             string   `json:"sku"`
	PrecioAdicional float64  `json:"precio_adicional"`
	StockAdicional  int      `json:"stock_adicional"`
	OpcionesIDs     []string `json:"opciones_ids"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
}

type CreateVarianteInput struct {
	ProductoID string `json:"producto_id" validate:"required,uuid"`
	Nombre     string `json:"nombre" validate:"required,min=1,max=200"`
}

type CreateOpcionInput struct {
	VarianteID string `json:"variante_id" validate:"required,uuid"`
	Valor      string `json:"valor" validate:"required,min=1,max=200"`
	Orden      int    `json:"orden"`
}

type CreateSKUInput struct {
	ProductoID      string   `json:"producto_id" validate:"required,uuid"`
	SKU             string   `json:"sku"`
	PrecioAdicional float64  `json:"precio_adicional"`
	StockAdicional  int      `json:"stock_adicional"`
	OpcionesIDs     []string `json:"opciones_ids"`
}

type UpdateSKUInput struct {
	SKU             string   `json:"sku"`
	PrecioAdicional float64  `json:"precio_adicional"`
	StockAdicional  int      `json:"stock_adicional"`
	OpcionesIDs     []string `json:"opciones_ids"`
}

// --- Variantes ---

func (s *VariantService) ListVariantes(ctx context.Context, userID pgtype.UUID, productoID string) ([]VarianteResponse, error) {
	pgProductoID, err := pgUUID(productoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}

	variantes, err := s.queries.ListVariantesByProducto(ctx, repository.ListVariantesByProductoParams{
		ProductoID: pgProductoID,
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, fmt.Errorf("list variantes: %w", err)
	}

	result := make([]VarianteResponse, 0, len(variantes))
	for _, v := range variantes {
		opciones, err := s.queries.ListOpcionesByVariante(ctx, v.ID)
		if err != nil {
			return nil, fmt.Errorf("list opciones: %w", err)
		}
		result = append(result, toVarianteResponse(v, opciones))
	}
	return result, nil
}

func (s *VariantService) CreateVariante(ctx context.Context, userID pgtype.UUID, input CreateVarianteInput) (*VarianteResponse, error) {
	pgProductoID, err := pgUUID(input.ProductoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}

	v, err := s.queries.CreateVariante(ctx, repository.CreateVarianteParams{
		ProductoID: pgProductoID,
		Nombre:     input.Nombre,
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create variante: %w", err)
	}

	resp := toVarianteResponse(v, nil)
	return &resp, nil
}

func (s *VariantService) DeleteVariante(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrVarianteNotFound
	}

	return s.queries.DeleteVariante(ctx, repository.DeleteVarianteParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

// --- Opciones ---

func (s *VariantService) CreateOpcion(ctx context.Context, userID pgtype.UUID, input CreateOpcionInput) (*OpcionResponse, error) {
	pgVarianteID, err := pgUUID(input.VarianteID)
	if err != nil {
		return nil, fmt.Errorf("invalid variante_id")
	}

	o, err := s.queries.CreateOpcion(ctx, repository.CreateOpcionParams{
		VarianteID: pgVarianteID,
		Valor:      input.Valor,
		Orden:      int32(input.Orden),
	})
	if err != nil {
		return nil, fmt.Errorf("create opcion: %w", err)
	}

	resp := toOpcionResponse(o)
	return &resp, nil
}

func (s *VariantService) ListOpciones(ctx context.Context, userID pgtype.UUID, varianteID string) ([]OpcionResponse, error) {
	pgVarianteID, err := pgUUID(varianteID)
	if err != nil {
		return nil, fmt.Errorf("invalid variante_id")
	}

	opciones, err := s.queries.ListOpcionesByVariante(ctx, pgVarianteID)
	if err != nil {
		return nil, fmt.Errorf("list opciones: %w", err)
	}

	result := make([]OpcionResponse, 0, len(opciones))
	for _, o := range opciones {
		result = append(result, toOpcionResponse(o))
	}
	return result, nil
}

func (s *VariantService) DeleteOpcion(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return fmt.Errorf("invalid opcion id")
	}

	return s.queries.DeleteOpcion(ctx, pgID)
}

// --- SKUs ---

func (s *VariantService) ListSKUs(ctx context.Context, userID pgtype.UUID, productoID string) ([]SKUResponse, error) {
	pgProductoID, err := pgUUID(productoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}

	skus, err := s.queries.ListSKUsByProducto(ctx, repository.ListSKUsByProductoParams{
		ProductoID: pgProductoID,
		UsuarioID:  userID,
	})
	if err != nil {
		return nil, fmt.Errorf("list skus: %w", err)
	}

	result := make([]SKUResponse, 0, len(skus))
	for _, sk := range skus {
		result = append(result, toSKUResponse(sk))
	}
	return result, nil
}

func (s *VariantService) CreateSKU(ctx context.Context, userID pgtype.UUID, input CreateSKUInput) (*SKUResponse, error) {
	pgProductoID, err := pgUUID(input.ProductoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}

	opcionesIDs := make([]pgtype.UUID, 0, len(input.OpcionesIDs))
	for _, oid := range input.OpcionesIDs {
		pgOID, err := pgUUID(oid)
		if err != nil {
			return nil, fmt.Errorf("invalid opcion_id: %s", oid)
		}
		opcionesIDs = append(opcionesIDs, pgOID)
	}

	sk, err := s.queries.CreateSKU(ctx, repository.CreateSKUParams{
		ProductoID:      pgProductoID,
		Sku:             pgText(input.SKU),
		PrecioAdicional: numericFromFloat(input.PrecioAdicional),
		StockAdicional:  int32(input.StockAdicional),
		OpcionesIDs:     opcionesIDs,
		UsuarioID:       userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create sku: %w", err)
	}

	resp := toSKUResponse(sk)
	return &resp, nil
}

func (s *VariantService) UpdateSKU(ctx context.Context, userID pgtype.UUID, id string, input UpdateSKUInput) (*SKUResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrSKUNotFound
	}

	opcionesIDs := make([]pgtype.UUID, 0, len(input.OpcionesIDs))
	for _, oid := range input.OpcionesIDs {
		pgOID, err := pgUUID(oid)
		if err != nil {
			return nil, fmt.Errorf("invalid opcion_id: %s", oid)
		}
		opcionesIDs = append(opcionesIDs, pgOID)
	}

	sk, err := s.queries.UpdateSKU(ctx, repository.UpdateSKUParams{
		ID:              pgID,
		UsuarioID:       userID,
		Sku:             pgText(input.SKU),
		PrecioAdicional: numericFromFloat(input.PrecioAdicional),
		StockAdicional:  int32(input.StockAdicional),
		OpcionesIDs:     opcionesIDs,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrSKUNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update sku: %w", err)
	}

	resp := toSKUResponse(sk)
	return &resp, nil
}

func (s *VariantService) DeleteSKU(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrSKUNotFound
	}

	return s.queries.SoftDeleteSKU(ctx, repository.SoftDeleteSKUParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

// --- Mappers ---

func toVarianteResponse(v repository.VarianteProducto, opciones []repository.OpcionVariante) VarianteResponse {
	opcionesResp := make([]OpcionResponse, 0, len(opciones))
	for _, o := range opciones {
		opcionesResp = append(opcionesResp, toOpcionResponse(o))
	}
	return VarianteResponse{
		ID:         uuidStrFromPg(v.ID),
		ProductoID: uuidStrFromPg(v.ProductoID),
		Nombre:     v.Nombre,
		Opciones:   opcionesResp,
		CreatedAt:  v.CreatedAt.Time.Format(time.RFC3339),
	}
}

func toOpcionResponse(o repository.OpcionVariante) OpcionResponse {
	return OpcionResponse{
		ID:         uuidStrFromPg(o.ID),
		VarianteID: uuidStrFromPg(o.VarianteID),
		Valor:      o.Valor,
		Orden:      int(o.Orden),
	}
}

func toSKUResponse(sk repository.SkuVariante) SKUResponse {
	ids := make([]string, 0, len(sk.OpcionesIDs))
	for _, oid := range sk.OpcionesIDs {
		ids = append(ids, uuidStrFromPg(oid))
	}
	return SKUResponse{
		ID:              uuidStrFromPg(sk.ID),
		ProductoID:      uuidStrFromPg(sk.ProductoID),
		SKU:             textFromPg(sk.Sku),
		PrecioAdicional: floatFromNumeric(sk.PrecioAdicional),
		StockAdicional:  int(sk.StockAdicional),
		OpcionesIDs:     ids,
		CreatedAt:       sk.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:       sk.UpdatedAt.Time.Format(time.RFC3339),
	}
}
