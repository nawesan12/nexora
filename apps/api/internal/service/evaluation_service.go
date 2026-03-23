package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

type EvaluationService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewEvaluationService(db *pgxpool.Pool) *EvaluationService {
	return &EvaluationService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type CreateEvaluacionInput struct {
	ProveedorID    string `json:"proveedor_id" validate:"required,uuid"`
	OrdenCompraID  string `json:"orden_compra_id" validate:"required,uuid"`
	DeliveryOnTime *bool  `json:"delivery_on_time"`
	QualityScore   *int32 `json:"quality_score" validate:"omitempty,min=1,max=5"`
	PriceCompliance *bool `json:"price_compliance"`
	Comentario     string `json:"comentario"`
}

type EvaluacionResponse struct {
	ID                string `json:"id"`
	ProveedorID       string `json:"proveedor_id"`
	OrdenCompraID     string `json:"orden_compra_id"`
	OrdenCompraNumero string `json:"orden_compra_numero,omitempty"`
	DeliveryOnTime    *bool  `json:"delivery_on_time"`
	QualityScore      *int32 `json:"quality_score"`
	PriceCompliance   *bool  `json:"price_compliance"`
	Comentario        string `json:"comentario,omitempty"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
}

type PromedioResponse struct {
	TotalEvaluaciones int64   `json:"total_evaluaciones"`
	PctOnTime         float64 `json:"pct_on_time"`
	AvgQuality        float64 `json:"avg_quality"`
	PctPriceOk        float64 `json:"pct_price_ok"`
}

// --- Methods ---

func (s *EvaluationService) CreateEvaluacion(ctx context.Context, userID pgtype.UUID, input CreateEvaluacionInput) (*EvaluacionResponse, error) {
	proveedorID, err := pgUUID(input.ProveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}

	ordenCompraID, err := pgUUID(input.OrdenCompraID)
	if err != nil {
		return nil, fmt.Errorf("invalid orden_compra_id")
	}

	var deliveryOnTime pgtype.Bool
	if input.DeliveryOnTime != nil {
		deliveryOnTime = pgtype.Bool{Bool: *input.DeliveryOnTime, Valid: true}
	}

	var qualityScore pgtype.Int4
	if input.QualityScore != nil {
		qualityScore = pgtype.Int4{Int32: *input.QualityScore, Valid: true}
	}

	var priceCompliance pgtype.Bool
	if input.PriceCompliance != nil {
		priceCompliance = pgtype.Bool{Bool: *input.PriceCompliance, Valid: true}
	}

	ev, err := s.queries.CreateEvaluacion(ctx, repository.CreateEvaluacionParams{
		ProveedorID:    proveedorID,
		OrdenCompraID:  ordenCompraID,
		DeliveryOnTime: deliveryOnTime,
		QualityScore:   qualityScore,
		PriceCompliance: priceCompliance,
		Comentario:     pgText(input.Comentario),
		UsuarioID:      userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create evaluacion: %w", err)
	}

	resp := toEvaluacionResponse(ev)
	return &resp, nil
}

func (s *EvaluationService) ListByProveedor(ctx context.Context, userID pgtype.UUID, proveedorID string, limit, offset int32) ([]EvaluacionResponse, int64, error) {
	pgProvID, err := pgUUID(proveedorID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid proveedor_id")
	}

	items, err := s.queries.ListEvaluacionesByProveedor(ctx, repository.ListEvaluacionesByProveedorParams{
		ProveedorID: pgProvID,
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list evaluaciones: %w", err)
	}

	count, err := s.queries.CountEvaluacionesByProveedor(ctx, repository.CountEvaluacionesByProveedorParams{
		ProveedorID: pgProvID,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count evaluaciones: %w", err)
	}

	result := make([]EvaluacionResponse, 0, len(items))
	for _, item := range items {
		result = append(result, toEvaluacionRowResponse(item))
	}
	return result, count, nil
}

func (s *EvaluationService) GetPromedio(ctx context.Context, userID pgtype.UUID, proveedorID string) (*PromedioResponse, error) {
	pgProvID, err := pgUUID(proveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}

	row, err := s.queries.GetEvaluacionPromedio(ctx, repository.GetEvaluacionPromedioParams{
		ProveedorID: pgProvID,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("get promedio: %w", err)
	}

	return &PromedioResponse{
		TotalEvaluaciones: row.TotalEvaluaciones,
		PctOnTime:         floatFromNumeric(row.PctOnTime),
		AvgQuality:        floatFromNumeric(row.AvgQuality),
		PctPriceOk:        floatFromNumeric(row.PctPriceOk),
	}, nil
}

// --- Converters ---

func toEvaluacionResponse(ev repository.EvaluacionProveedor) EvaluacionResponse {
	var deliveryOnTime *bool
	if ev.DeliveryOnTime.Valid {
		deliveryOnTime = &ev.DeliveryOnTime.Bool
	}
	var qualityScore *int32
	if ev.QualityScore.Valid {
		qualityScore = &ev.QualityScore.Int32
	}
	var priceCompliance *bool
	if ev.PriceCompliance.Valid {
		priceCompliance = &ev.PriceCompliance.Bool
	}

	return EvaluacionResponse{
		ID:              uuidStrFromPg(ev.ID),
		ProveedorID:     uuidStrFromPg(ev.ProveedorID),
		OrdenCompraID:   uuidStrFromPg(ev.OrdenCompraID),
		DeliveryOnTime:  deliveryOnTime,
		QualityScore:    qualityScore,
		PriceCompliance: priceCompliance,
		Comentario:      textFromPg(ev.Comentario),
		CreatedAt:       ev.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:       ev.UpdatedAt.Time.Format(time.RFC3339),
	}
}

func toEvaluacionRowResponse(row repository.ListEvaluacionesByProveedorRow) EvaluacionResponse {
	var deliveryOnTime *bool
	if row.DeliveryOnTime.Valid {
		deliveryOnTime = &row.DeliveryOnTime.Bool
	}
	var qualityScore *int32
	if row.QualityScore.Valid {
		qualityScore = &row.QualityScore.Int32
	}
	var priceCompliance *bool
	if row.PriceCompliance.Valid {
		priceCompliance = &row.PriceCompliance.Bool
	}

	return EvaluacionResponse{
		ID:                uuidStrFromPg(row.ID),
		ProveedorID:       uuidStrFromPg(row.ProveedorID),
		OrdenCompraID:     uuidStrFromPg(row.OrdenCompraID),
		OrdenCompraNumero: textFromPg(row.OrdenCompraNumero),
		DeliveryOnTime:    deliveryOnTime,
		QualityScore:      qualityScore,
		PriceCompliance:   priceCompliance,
		Comentario:        textFromPg(row.Comentario),
		CreatedAt:         row.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:         row.UpdatedAt.Time.Format(time.RFC3339),
	}
}
