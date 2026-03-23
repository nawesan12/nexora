package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrApiClientNotFound = errors.New("api client not found")
	ErrApiClientAuth     = errors.New("invalid api credentials")
)

type EcommerceService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewEcommerceService(db *pgxpool.Pool) *EcommerceService {
	return &EcommerceService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type ApiClientResponse struct {
	ID          string   `json:"id"`
	Nombre      string   `json:"nombre"`
	ApiKey      string   `json:"api_key"`
	CorsOrigins []string `json:"cors_origins"`
	Activo      bool     `json:"activo"`
	LastUsedAt  string   `json:"last_used_at,omitempty"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
}

type ApiClientCreatedResponse struct {
	ApiClientResponse
	ApiSecret string `json:"api_secret"`
}

type ApiClientSecretResult struct {
	ID        string `json:"id"`
	ApiKey    string `json:"api_key"`
	ApiSecret string `json:"api_secret"`
}

type CreateApiClientInput struct {
	Nombre      string   `json:"nombre" validate:"required,min=2,max=200"`
	CorsOrigins []string `json:"cors_origins"`
}

type UpdateApiClientInput struct {
	Nombre      string   `json:"nombre" validate:"required,min=2,max=200"`
	CorsOrigins []string `json:"cors_origins"`
	Activo      bool     `json:"activo"`
}

type PublicProductResponse struct {
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

type InventoryMetrics struct {
	TotalProducts   int64 `json:"total_products"`
	TotalCatalog    int64 `json:"total_catalog"`
	LowStockAlerts  int64 `json:"low_stock_alerts"`
}

// --- Client Management ---

func (s *EcommerceService) CreateClient(ctx context.Context, userID pgtype.UUID, input CreateApiClientInput) (*ApiClientCreatedResponse, error) {
	apiKey, err := generateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("generate api key: %w", err)
	}

	apiSecret, err := generateAPISecret()
	if err != nil {
		return nil, fmt.Errorf("generate api secret: %w", err)
	}

	secretHash, err := bcrypt.GenerateFromPassword([]byte(apiSecret), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash api secret: %w", err)
	}

	corsOrigins := input.CorsOrigins
	if corsOrigins == nil {
		corsOrigins = []string{}
	}

	client, err := s.queries.CreateApiClient(ctx, repository.CreateApiClientParams{
		Nombre:        input.Nombre,
		ApiKey:        apiKey,
		ApiSecretHash: string(secretHash),
		CorsOrigins:   corsOrigins,
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create api client: %w", err)
	}

	resp := toApiClientResponse(client)
	return &ApiClientCreatedResponse{
		ApiClientResponse: resp,
		ApiSecret:         apiSecret,
	}, nil
}

func (s *EcommerceService) ListClients(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]ApiClientResponse, int64, error) {
	items, err := s.queries.ListApiClients(ctx, repository.ListApiClientsParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list api clients: %w", err)
	}

	count, err := s.queries.CountApiClients(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count api clients: %w", err)
	}

	result := make([]ApiClientResponse, 0, len(items))
	for _, item := range items {
		result = append(result, toApiClientListResponse(item))
	}
	return result, count, nil
}

func (s *EcommerceService) GetClient(ctx context.Context, userID pgtype.UUID, id string) (*ApiClientResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrApiClientNotFound
	}

	client, err := s.queries.GetApiClient(ctx, repository.GetApiClientParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrApiClientNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get api client: %w", err)
	}

	resp := toApiClientResponse(client)
	return &resp, nil
}

func (s *EcommerceService) UpdateClient(ctx context.Context, userID pgtype.UUID, id string, input UpdateApiClientInput) (*ApiClientResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrApiClientNotFound
	}

	corsOrigins := input.CorsOrigins
	if corsOrigins == nil {
		corsOrigins = []string{}
	}

	client, err := s.queries.UpdateApiClient(ctx, repository.UpdateApiClientParams{
		Nombre:      input.Nombre,
		CorsOrigins: corsOrigins,
		Activo:      input.Activo,
		ID:          pgID,
		UsuarioID:   userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrApiClientNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update api client: %w", err)
	}

	resp := toApiClientResponse(client)
	return &resp, nil
}

func (s *EcommerceService) DeleteClient(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrApiClientNotFound
	}

	return s.queries.DeleteApiClient(ctx, repository.DeleteApiClientParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func (s *EcommerceService) RotateSecret(ctx context.Context, userID pgtype.UUID, id string) (*ApiClientSecretResult, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrApiClientNotFound
	}

	apiSecret, err := generateAPISecret()
	if err != nil {
		return nil, fmt.Errorf("generate api secret: %w", err)
	}

	secretHash, err := bcrypt.GenerateFromPassword([]byte(apiSecret), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash api secret: %w", err)
	}

	client, err := s.queries.RotateApiSecret(ctx, repository.RotateApiSecretParams{
		ApiSecretHash: string(secretHash),
		ID:            pgID,
		UsuarioID:     userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrApiClientNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("rotate api secret: %w", err)
	}

	return &ApiClientSecretResult{
		ID:        uuidStrFromPg(client.ID),
		ApiKey:    client.ApiKey,
		ApiSecret: apiSecret,
	}, nil
}

// --- Authentication ---

func (s *EcommerceService) AuthenticateClient(ctx context.Context, apiKey, apiSecret string) (*repository.ApiClient, error) {
	client, err := s.queries.GetApiClientByKey(ctx, apiKey)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrApiClientAuth
	}
	if err != nil {
		return nil, fmt.Errorf("get api client by key: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(client.ApiSecretHash), []byte(apiSecret)); err != nil {
		return nil, ErrApiClientAuth
	}

	// Update last_used_at asynchronously (best-effort)
	go func() {
		_ = s.queries.UpdateApiClientLastUsed(context.Background(), client.ID)
	}()

	return &client, nil
}

// --- Public API Methods ---

func (s *EcommerceService) ListProducts(ctx context.Context, userID pgtype.UUID, search string, limit, offset int32) ([]PublicProductResponse, int64, error) {
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchProductos(ctx, repository.SearchProductosParams{
			UsuarioID: userID,
			Nombre:    searchPattern,
			Limit:     limit,
			Offset:    offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search products: %w", err)
		}

		count, err := s.queries.CountSearchProductos(ctx, repository.CountSearchProductosParams{
			UsuarioID: userID,
			Nombre:    searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search products: %w", err)
		}

		result := make([]PublicProductResponse, 0, len(items))
		for _, p := range items {
			result = append(result, PublicProductResponse{
				ID:              uuidStrFromPg(p.ID),
				Codigo:          textFromPg(p.Codigo),
				Nombre:          p.Nombre,
				Descripcion:     textFromPg(p.Descripcion),
				PrecioBase:      floatFromNumeric(p.PrecioBase),
				Unidad:          string(p.Unidad),
				CategoriaID:     uuidStrFromPg(p.CategoriaID),
				CategoriaNombre: textFromPg(p.CategoriaNombre),
				FamiliaNombre:   textFromPg(p.FamiliaNombre),
			})
		}
		return result, count, nil
	}

	items, err := s.queries.ListProductos(ctx, repository.ListProductosParams{
		UsuarioID: userID,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list products: %w", err)
	}

	count, err := s.queries.CountProductos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count products: %w", err)
	}

	result := make([]PublicProductResponse, 0, len(items))
	for _, p := range items {
		result = append(result, PublicProductResponse{
			ID:              uuidStrFromPg(p.ID),
			Codigo:          textFromPg(p.Codigo),
			Nombre:          p.Nombre,
			Descripcion:     textFromPg(p.Descripcion),
			PrecioBase:      floatFromNumeric(p.PrecioBase),
			Unidad:          string(p.Unidad),
			CategoriaID:     uuidStrFromPg(p.CategoriaID),
			CategoriaNombre: textFromPg(p.CategoriaNombre),
			FamiliaNombre:   textFromPg(p.FamiliaNombre),
		})
	}
	return result, count, nil
}

func (s *EcommerceService) GetProduct(ctx context.Context, userID pgtype.UUID, productID string) (*PublicProductResponse, error) {
	pgID, err := pgUUID(productID)
	if err != nil {
		return nil, ErrProductoNotFound
	}

	p, err := s.queries.GetProductoByID(ctx, repository.GetProductoByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProductoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get product: %w", err)
	}

	return &PublicProductResponse{
		ID:              uuidStrFromPg(p.ID),
		Codigo:          textFromPg(p.Codigo),
		Nombre:          p.Nombre,
		Descripcion:     textFromPg(p.Descripcion),
		PrecioBase:      floatFromNumeric(p.PrecioBase),
		Unidad:          string(p.Unidad),
		CategoriaID:     uuidStrFromPg(p.CategoriaID),
		CategoriaNombre: textFromPg(p.CategoriaNombre),
		FamiliaNombre:   textFromPg(p.FamiliaNombre),
	}, nil
}

func (s *EcommerceService) GetInventoryMetrics(ctx context.Context, userID pgtype.UUID) (*InventoryMetrics, error) {
	totalProducts, err := s.queries.CountProductos(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("count products: %w", err)
	}

	totalCatalog, err := s.queries.CountMovimientosStock(ctx, userID)
	if err != nil {
		// Non-critical, default to 0
		totalCatalog = 0
	}

	return &InventoryMetrics{
		TotalProducts:  totalProducts,
		TotalCatalog:   totalCatalog,
		LowStockAlerts: 0, // Would require a dedicated query; keeping simple for now
	}, nil
}

// --- Helpers ---

func generateAPIKey() (string, error) {
	b := make([]byte, 16) // 32 hex chars
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "ec_" + hex.EncodeToString(b), nil
}

func generateAPISecret() (string, error) {
	b := make([]byte, 24) // 48 hex chars
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func toApiClientResponse(c repository.ApiClient) ApiClientResponse {
	var lastUsed string
	if c.LastUsedAt.Valid {
		lastUsed = c.LastUsedAt.Time.Format(time.RFC3339)
	}

	corsOrigins := c.CorsOrigins
	if corsOrigins == nil {
		corsOrigins = []string{}
	}

	return ApiClientResponse{
		ID:          uuidStrFromPg(c.ID),
		Nombre:      c.Nombre,
		ApiKey:      c.ApiKey,
		CorsOrigins: corsOrigins,
		Activo:      c.Activo,
		LastUsedAt:  lastUsed,
		CreatedAt:   c.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:   c.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func toApiClientListResponse(c repository.ListApiClientsRow) ApiClientResponse {
	var lastUsed string
	if c.LastUsedAt.Valid {
		lastUsed = c.LastUsedAt.Time.Format(time.RFC3339)
	}

	corsOrigins := c.CorsOrigins
	if corsOrigins == nil {
		corsOrigins = []string{}
	}

	return ApiClientResponse{
		ID:          uuidStrFromPg(c.ID),
		Nombre:      c.Nombre,
		ApiKey:      c.ApiKey,
		CorsOrigins: corsOrigins,
		Activo:      c.Activo,
		LastUsedAt:  lastUsed,
		CreatedAt:   c.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:   c.UpdatedAt.Time.Format(time.RFC3339),
	}
}
