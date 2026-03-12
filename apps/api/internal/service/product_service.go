package service

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrFamiliaNotFound   = errors.New("familia not found")
	ErrCategoriaNotFound = errors.New("categoria not found")
	ErrProductoNotFound  = errors.New("producto not found")
	ErrCodigoDuplicado   = errors.New("codigo already exists")
	ErrCatalogoNotFound  = errors.New("catalogo entry not found")
)

type ProductService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewProductService(db *pgxpool.Pool) *ProductService {
	return &ProductService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type FamiliaResponse struct {
	ID          string `json:"id"`
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion,omitempty"`
}

type CategoriaResponse struct {
	ID          string `json:"id"`
	Nombre      string `json:"nombre"`
	Descripcion string `json:"descripcion,omitempty"`
	FamiliaID   string `json:"familia_id"`
}

type ProductoResponse struct {
	ID              string  `json:"id"`
	Codigo          string  `json:"codigo,omitempty"`
	Nombre          string  `json:"nombre"`
	Descripcion     string  `json:"descripcion,omitempty"`
	PrecioBase      float64 `json:"precio_base"`
	Unidad          string  `json:"unidad"`
	CategoriaID     string  `json:"categoria_id,omitempty"`
	CategoriaNombre string  `json:"categoria_nombre,omitempty"`
	FamiliaNombre   string  `json:"familia_nombre,omitempty"`
}

type CatalogoResponse struct {
	ID                 string  `json:"id"`
	ProductoID         string  `json:"producto_id"`
	SucursalID         string  `json:"sucursal_id"`
	Precio             float64 `json:"precio"`
	Stock              int32   `json:"stock"`
	ProductoNombre     string  `json:"producto_nombre,omitempty"`
	ProductoCodigo     string  `json:"producto_codigo,omitempty"`
	ProductoUnidad     string  `json:"producto_unidad,omitempty"`
	ProductoPrecioBase float64 `json:"producto_precio_base,omitempty"`
}

// --- Input DTOs ---

type CreateFamiliaInput struct {
	Nombre      string `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion string `json:"descripcion"`
}

type UpdateFamiliaInput struct {
	Nombre      string `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion string `json:"descripcion"`
}

type CreateCategoriaInput struct {
	Nombre      string `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion string `json:"descripcion"`
	FamiliaID   string `json:"familia_id" validate:"required,uuid"`
}

type UpdateCategoriaInput struct {
	Nombre      string `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion string `json:"descripcion"`
	FamiliaID   string `json:"familia_id" validate:"required,uuid"`
}

type CreateProductoInput struct {
	Codigo      string  `json:"codigo"`
	Nombre      string  `json:"nombre" validate:"required,min=2,max=300"`
	Descripcion string  `json:"descripcion"`
	PrecioBase  float64 `json:"precio_base" validate:"gte=0"`
	Unidad      string  `json:"unidad" validate:"required,oneof=KG UNIDAD LITRO METRO CAJA BOLSA PACK"`
	CategoriaID string  `json:"categoria_id"`
}

type UpdateProductoInput struct {
	Codigo      string  `json:"codigo"`
	Nombre      string  `json:"nombre" validate:"required,min=2,max=300"`
	Descripcion string  `json:"descripcion"`
	PrecioBase  float64 `json:"precio_base" validate:"gte=0"`
	Unidad      string  `json:"unidad" validate:"required,oneof=KG UNIDAD LITRO METRO CAJA BOLSA PACK"`
	CategoriaID string  `json:"categoria_id"`
}

type UpsertCatalogoInput struct {
	ProductoID string  `json:"producto_id" validate:"required,uuid"`
	SucursalID string  `json:"sucursal_id" validate:"required,uuid"`
	Precio     float64 `json:"precio" validate:"gte=0"`
	Stock      int32   `json:"stock" validate:"gte=0"`
}

type UpdateStockInput struct {
	Stock int32 `json:"stock" validate:"gte=0"`
}

// --- Helpers ---

func numericFromFloat(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	n.Valid = true
	n.Int = big.NewInt(int64(f * 100))
	n.Exp = -2
	return n
}

func floatFromNumeric(n pgtype.Numeric) float64 {
	if !n.Valid || n.Int == nil {
		return 0
	}
	f := new(big.Float).SetInt(n.Int)
	if n.Exp != 0 {
		exp := new(big.Float).SetFloat64(1)
		base := new(big.Float).SetFloat64(10)
		e := int(n.Exp)
		if e > 0 {
			for i := 0; i < e; i++ {
				exp.Mul(exp, base)
			}
		} else {
			for i := 0; i < -e; i++ {
				exp.Mul(exp, base)
			}
			f.Quo(f, exp)
			result, _ := f.Float64()
			return result
		}
		f.Mul(f, exp)
	}
	result, _ := f.Float64()
	return result
}

func pgUUID(s string) (pgtype.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return pgtype.UUID{Bytes: id, Valid: true}, nil
}

func pgText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

func textFromPg(t pgtype.Text) string {
	if t.Valid {
		return t.String
	}
	return ""
}

func uuidStrFromPg(id pgtype.UUID) string {
	return uuidFromPgtype(id).String()
}

func pgInt4(v int) pgtype.Int4 {
	if v == 0 {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: int32(v), Valid: true}
}

func isDuplicateKey(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint")
}

// --- Familias ---

func (s *ProductService) CreateFamilia(ctx context.Context, userID pgtype.UUID, input CreateFamiliaInput) (*FamiliaResponse, error) {
	f, err := s.queries.CreateFamiliaProducto(ctx, repository.CreateFamiliaProductoParams{
		Nombre:      input.Nombre,
		Descripcion: pgText(input.Descripcion),
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create familia: %w", err)
	}
	return toFamiliaResponse(f), nil
}

func (s *ProductService) GetFamilia(ctx context.Context, userID pgtype.UUID, id string) (*FamiliaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrFamiliaNotFound
	}
	f, err := s.queries.GetFamiliaProductoByID(ctx, repository.GetFamiliaProductoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrFamiliaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get familia: %w", err)
	}
	return toFamiliaResponse(f), nil
}

func (s *ProductService) ListFamilias(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]FamiliaResponse, int, error) {
	items, err := s.queries.ListFamiliasProducto(ctx, repository.ListFamiliasProductoParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list familias: %w", err)
	}
	count, err := s.queries.CountFamiliasProducto(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count familias: %w", err)
	}
	result := make([]FamiliaResponse, 0, len(items))
	for _, f := range items {
		result = append(result, *toFamiliaResponse(f))
	}
	return result, int(count), nil
}

func (s *ProductService) UpdateFamilia(ctx context.Context, userID pgtype.UUID, id string, input UpdateFamiliaInput) (*FamiliaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrFamiliaNotFound
	}
	f, err := s.queries.UpdateFamiliaProducto(ctx, repository.UpdateFamiliaProductoParams{
		ID: pgID, UsuarioID: userID,
		Nombre: input.Nombre, Descripcion: pgText(input.Descripcion),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrFamiliaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update familia: %w", err)
	}
	return toFamiliaResponse(f), nil
}

func (s *ProductService) DeleteFamilia(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrFamiliaNotFound
	}
	return s.queries.SoftDeleteFamiliaProducto(ctx, repository.SoftDeleteFamiliaProductoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toFamiliaResponse(f repository.FamiliasProducto) *FamiliaResponse {
	return &FamiliaResponse{
		ID:          uuidStrFromPg(f.ID),
		Nombre:      f.Nombre,
		Descripcion: textFromPg(f.Descripcion),
	}
}

// --- Categorias ---

func (s *ProductService) CreateCategoria(ctx context.Context, userID pgtype.UUID, input CreateCategoriaInput) (*CategoriaResponse, error) {
	familiaID, err := pgUUID(input.FamiliaID)
	if err != nil {
		return nil, ErrFamiliaNotFound
	}
	c, err := s.queries.CreateCategoriaProducto(ctx, repository.CreateCategoriaProductoParams{
		Nombre: input.Nombre, Descripcion: pgText(input.Descripcion),
		FamiliaID: familiaID, UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create categoria: %w", err)
	}
	return toCategoriaResponse(c), nil
}

func (s *ProductService) GetCategoria(ctx context.Context, userID pgtype.UUID, id string) (*CategoriaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrCategoriaNotFound
	}
	c, err := s.queries.GetCategoriaProductoByID(ctx, repository.GetCategoriaProductoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCategoriaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get categoria: %w", err)
	}
	return toCategoriaResponse(c), nil
}

func (s *ProductService) ListCategorias(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]CategoriaResponse, int, error) {
	items, err := s.queries.ListCategoriasProducto(ctx, repository.ListCategoriasProductoParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list categorias: %w", err)
	}
	count, err := s.queries.CountCategoriasProducto(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count categorias: %w", err)
	}
	result := make([]CategoriaResponse, 0, len(items))
	for _, c := range items {
		result = append(result, *toCategoriaResponse(c))
	}
	return result, int(count), nil
}

func (s *ProductService) ListCategoriasByFamilia(ctx context.Context, userID pgtype.UUID, familiaID string) ([]CategoriaResponse, error) {
	pgFamID, err := pgUUID(familiaID)
	if err != nil {
		return nil, ErrFamiliaNotFound
	}
	items, err := s.queries.ListCategoriasProductoByFamilia(ctx, repository.ListCategoriasProductoByFamiliaParams{
		FamiliaID: pgFamID, UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("list categorias by familia: %w", err)
	}
	result := make([]CategoriaResponse, 0, len(items))
	for _, c := range items {
		result = append(result, *toCategoriaResponse(c))
	}
	return result, nil
}

func (s *ProductService) UpdateCategoria(ctx context.Context, userID pgtype.UUID, id string, input UpdateCategoriaInput) (*CategoriaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrCategoriaNotFound
	}
	familiaID, err := pgUUID(input.FamiliaID)
	if err != nil {
		return nil, ErrFamiliaNotFound
	}
	c, err := s.queries.UpdateCategoriaProducto(ctx, repository.UpdateCategoriaProductoParams{
		ID: pgID, UsuarioID: userID,
		Nombre: input.Nombre, Descripcion: pgText(input.Descripcion),
		FamiliaID: familiaID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCategoriaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update categoria: %w", err)
	}
	return toCategoriaResponse(c), nil
}

func (s *ProductService) DeleteCategoria(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrCategoriaNotFound
	}
	return s.queries.SoftDeleteCategoriaProducto(ctx, repository.SoftDeleteCategoriaProductoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toCategoriaResponse(c repository.CategoriasProducto) *CategoriaResponse {
	return &CategoriaResponse{
		ID:          uuidStrFromPg(c.ID),
		Nombre:      c.Nombre,
		Descripcion: textFromPg(c.Descripcion),
		FamiliaID:   uuidStrFromPg(c.FamiliaID),
	}
}

// --- Productos ---

func (s *ProductService) CreateProducto(ctx context.Context, userID pgtype.UUID, input CreateProductoInput) (*ProductoResponse, error) {
	if input.Codigo != "" {
		existing, err := s.queries.GetProductoByCodigo(ctx, repository.GetProductoByCodigoParams{
			Codigo: pgText(input.Codigo), UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid {
			return nil, ErrCodigoDuplicado
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check codigo: %w", err)
		}
	}

	var catID pgtype.UUID
	if input.CategoriaID != "" {
		var err error
		catID, err = pgUUID(input.CategoriaID)
		if err != nil {
			return nil, ErrCategoriaNotFound
		}
	}

	p, err := s.queries.CreateProducto(ctx, repository.CreateProductoParams{
		Codigo:      pgText(input.Codigo),
		Nombre:      input.Nombre,
		Descripcion: pgText(input.Descripcion),
		PrecioBase:  numericFromFloat(input.PrecioBase),
		Unidad:      repository.UnidadDeMedida(input.Unidad),
		CategoriaID: catID,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create producto: %w", err)
	}

	return &ProductoResponse{
		ID:          uuidStrFromPg(p.ID),
		Codigo:      textFromPg(p.Codigo),
		Nombre:      p.Nombre,
		Descripcion: textFromPg(p.Descripcion),
		PrecioBase:  floatFromNumeric(p.PrecioBase),
		Unidad:      string(p.Unidad),
		CategoriaID: uuidStrFromPg(p.CategoriaID),
	}, nil
}

func (s *ProductService) GetProducto(ctx context.Context, userID pgtype.UUID, id string) (*ProductoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrProductoNotFound
	}
	p, err := s.queries.GetProductoByID(ctx, repository.GetProductoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProductoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get producto: %w", err)
	}
	return toProductoResponseFromRow(p), nil
}

func (s *ProductService) ListProductos(ctx context.Context, userID pgtype.UUID, search string, limit, offset int32) ([]ProductoResponse, int, error) {
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchProductos(ctx, repository.SearchProductosParams{
			UsuarioID: userID, Nombre: searchPattern, Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search productos: %w", err)
		}
		count, err := s.queries.CountSearchProductos(ctx, repository.CountSearchProductosParams{
			UsuarioID: userID, Nombre: searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search productos: %w", err)
		}
		result := make([]ProductoResponse, 0, len(items))
		for _, p := range items {
			result = append(result, *toProductoResponseFromSearch(p))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListProductos(ctx, repository.ListProductosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list productos: %w", err)
	}
	count, err := s.queries.CountProductos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count productos: %w", err)
	}
	result := make([]ProductoResponse, 0, len(items))
	for _, p := range items {
		result = append(result, *toProductoResponseFromList(p))
	}
	return result, int(count), nil
}

func (s *ProductService) UpdateProducto(ctx context.Context, userID pgtype.UUID, id string, input UpdateProductoInput) (*ProductoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrProductoNotFound
	}

	if input.Codigo != "" {
		existing, err := s.queries.GetProductoByCodigo(ctx, repository.GetProductoByCodigoParams{
			Codigo: pgText(input.Codigo), UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid && uuidStrFromPg(existing.ID) != id {
			return nil, ErrCodigoDuplicado
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check codigo: %w", err)
		}
	}

	var catID pgtype.UUID
	if input.CategoriaID != "" {
		catID, err = pgUUID(input.CategoriaID)
		if err != nil {
			return nil, ErrCategoriaNotFound
		}
	}

	p, err := s.queries.UpdateProducto(ctx, repository.UpdateProductoParams{
		ID: pgID, UsuarioID: userID,
		Codigo:      pgText(input.Codigo),
		Nombre:      input.Nombre,
		Descripcion: pgText(input.Descripcion),
		PrecioBase:  numericFromFloat(input.PrecioBase),
		Unidad:      repository.UnidadDeMedida(input.Unidad),
		CategoriaID: catID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProductoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update producto: %w", err)
	}

	return &ProductoResponse{
		ID:          uuidStrFromPg(p.ID),
		Codigo:      textFromPg(p.Codigo),
		Nombre:      p.Nombre,
		Descripcion: textFromPg(p.Descripcion),
		PrecioBase:  floatFromNumeric(p.PrecioBase),
		Unidad:      string(p.Unidad),
		CategoriaID: uuidStrFromPg(p.CategoriaID),
	}, nil
}

func (s *ProductService) DeleteProducto(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrProductoNotFound
	}
	return s.queries.SoftDeleteProducto(ctx, repository.SoftDeleteProductoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toProductoResponseFromRow(p repository.GetProductoByIDRow) *ProductoResponse {
	return &ProductoResponse{
		ID:              uuidStrFromPg(p.ID),
		Codigo:          textFromPg(p.Codigo),
		Nombre:          p.Nombre,
		Descripcion:     textFromPg(p.Descripcion),
		PrecioBase:      floatFromNumeric(p.PrecioBase),
		Unidad:          string(p.Unidad),
		CategoriaID:     uuidStrFromPg(p.CategoriaID),
		CategoriaNombre: textFromPg(p.CategoriaNombre),
		FamiliaNombre:   textFromPg(p.FamiliaNombre),
	}
}

func toProductoResponseFromList(p repository.ListProductosRow) *ProductoResponse {
	return &ProductoResponse{
		ID:              uuidStrFromPg(p.ID),
		Codigo:          textFromPg(p.Codigo),
		Nombre:          p.Nombre,
		Descripcion:     textFromPg(p.Descripcion),
		PrecioBase:      floatFromNumeric(p.PrecioBase),
		Unidad:          string(p.Unidad),
		CategoriaID:     uuidStrFromPg(p.CategoriaID),
		CategoriaNombre: textFromPg(p.CategoriaNombre),
		FamiliaNombre:   textFromPg(p.FamiliaNombre),
	}
}

func toProductoResponseFromSearch(p repository.SearchProductosRow) *ProductoResponse {
	return &ProductoResponse{
		ID:              uuidStrFromPg(p.ID),
		Codigo:          textFromPg(p.Codigo),
		Nombre:          p.Nombre,
		Descripcion:     textFromPg(p.Descripcion),
		PrecioBase:      floatFromNumeric(p.PrecioBase),
		Unidad:          string(p.Unidad),
		CategoriaID:     uuidStrFromPg(p.CategoriaID),
		CategoriaNombre: textFromPg(p.CategoriaNombre),
		FamiliaNombre:   textFromPg(p.FamiliaNombre),
	}
}

// --- Catalogo ---

func (s *ProductService) UpsertCatalogo(ctx context.Context, input UpsertCatalogoInput) (*CatalogoResponse, error) {
	prodID, err := pgUUID(input.ProductoID)
	if err != nil {
		return nil, ErrProductoNotFound
	}
	sucID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	c, err := s.queries.UpsertCatalogoProducto(ctx, repository.UpsertCatalogoProductoParams{
		ProductoID: prodID, SucursalID: sucID,
		Precio: numericFromFloat(input.Precio), Stock: input.Stock,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert catalogo: %w", err)
	}
	return toCatalogoResponse(c), nil
}

func (s *ProductService) ListCatalogoBySucursal(ctx context.Context, sucursalID string, limit, offset int32) ([]CatalogoResponse, int, error) {
	sucID, err := pgUUID(sucursalID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid sucursal_id")
	}
	items, err := s.queries.ListCatalogoBySucursal(ctx, repository.ListCatalogoBySucursalParams{
		SucursalID: sucID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list catalogo: %w", err)
	}
	count, err := s.queries.CountCatalogoBySucursal(ctx, sucID)
	if err != nil {
		return nil, 0, fmt.Errorf("count catalogo: %w", err)
	}
	result := make([]CatalogoResponse, 0, len(items))
	for _, c := range items {
		result = append(result, CatalogoResponse{
			ID:                 uuidStrFromPg(c.ID),
			ProductoID:         uuidStrFromPg(c.ProductoID),
			SucursalID:         uuidStrFromPg(c.SucursalID),
			Precio:             floatFromNumeric(c.Precio),
			Stock:              c.Stock,
			ProductoNombre:     c.ProductoNombre,
			ProductoCodigo:     textFromPg(c.ProductoCodigo),
			ProductoUnidad:     string(c.ProductoUnidad),
			ProductoPrecioBase: floatFromNumeric(c.ProductoPrecioBase),
		})
	}
	return result, int(count), nil
}

func (s *ProductService) UpdateStock(ctx context.Context, productoID, sucursalID string, stock int32) (*CatalogoResponse, error) {
	prodID, err := pgUUID(productoID)
	if err != nil {
		return nil, ErrCatalogoNotFound
	}
	sucID, err := pgUUID(sucursalID)
	if err != nil {
		return nil, ErrCatalogoNotFound
	}
	c, err := s.queries.UpdateCatalogoStock(ctx, repository.UpdateCatalogoStockParams{
		ProductoID: prodID, SucursalID: sucID, Stock: stock,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCatalogoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update stock: %w", err)
	}
	return toCatalogoResponse(c), nil
}

func (s *ProductService) DeleteCatalogo(ctx context.Context, productoID, sucursalID string) error {
	prodID, err := pgUUID(productoID)
	if err != nil {
		return ErrCatalogoNotFound
	}
	sucID, err := pgUUID(sucursalID)
	if err != nil {
		return ErrCatalogoNotFound
	}
	return s.queries.SoftDeleteCatalogoProducto(ctx, repository.SoftDeleteCatalogoProductoParams{
		ProductoID: prodID, SucursalID: sucID,
	})
}

func toCatalogoResponse(c repository.CatalogoProducto) *CatalogoResponse {
	return &CatalogoResponse{
		ID:         uuidStrFromPg(c.ID),
		ProductoID: uuidStrFromPg(c.ProductoID),
		SucursalID: uuidStrFromPg(c.SucursalID),
		Precio:     floatFromNumeric(c.Precio),
		Stock:      c.Stock,
	}
}
