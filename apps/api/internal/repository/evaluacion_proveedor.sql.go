package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type EvaluacionProveedor struct {
	ID             pgtype.UUID        `json:"id"`
	ProveedorID    pgtype.UUID        `json:"proveedor_id"`
	OrdenCompraID  pgtype.UUID        `json:"orden_compra_id"`
	DeliveryOnTime pgtype.Bool        `json:"delivery_on_time"`
	QualityScore   pgtype.Int4        `json:"quality_score"`
	PriceCompliance pgtype.Bool       `json:"price_compliance"`
	Comentario     pgtype.Text        `json:"comentario"`
	UsuarioID      pgtype.UUID        `json:"usuario_id"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
	UpdatedAt      pgtype.Timestamptz `json:"updated_at"`
}

const createEvaluacion = `-- name: CreateEvaluacion :one
INSERT INTO evaluacion_proveedor (proveedor_id, orden_compra_id, delivery_on_time, quality_score, price_compliance, comentario, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, proveedor_id, orden_compra_id, delivery_on_time, quality_score, price_compliance, comentario, usuario_id, created_at, updated_at
`

type CreateEvaluacionParams struct {
	ProveedorID    pgtype.UUID `json:"proveedor_id"`
	OrdenCompraID  pgtype.UUID `json:"orden_compra_id"`
	DeliveryOnTime pgtype.Bool `json:"delivery_on_time"`
	QualityScore   pgtype.Int4 `json:"quality_score"`
	PriceCompliance pgtype.Bool `json:"price_compliance"`
	Comentario     pgtype.Text `json:"comentario"`
	UsuarioID      pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CreateEvaluacion(ctx context.Context, arg CreateEvaluacionParams) (EvaluacionProveedor, error) {
	row := q.db.QueryRow(ctx, createEvaluacion,
		arg.ProveedorID, arg.OrdenCompraID, arg.DeliveryOnTime,
		arg.QualityScore, arg.PriceCompliance, arg.Comentario, arg.UsuarioID,
	)
	var i EvaluacionProveedor
	err := row.Scan(
		&i.ID, &i.ProveedorID, &i.OrdenCompraID, &i.DeliveryOnTime,
		&i.QualityScore, &i.PriceCompliance, &i.Comentario,
		&i.UsuarioID, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listEvaluacionesByProveedor = `-- name: ListEvaluacionesByProveedor :many
SELECT ep.id, ep.proveedor_id, ep.orden_compra_id, ep.delivery_on_time, ep.quality_score, ep.price_compliance, ep.comentario, ep.usuario_id, ep.created_at, ep.updated_at, oc.numero as orden_compra_numero
FROM evaluacion_proveedor ep
LEFT JOIN ordenes_compra oc ON oc.id = ep.orden_compra_id
WHERE ep.proveedor_id = $1 AND ep.usuario_id = $2
ORDER BY ep.created_at DESC
LIMIT $3 OFFSET $4
`

type ListEvaluacionesByProveedorParams struct {
	ProveedorID pgtype.UUID `json:"proveedor_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

type ListEvaluacionesByProveedorRow struct {
	ID                 pgtype.UUID        `json:"id"`
	ProveedorID        pgtype.UUID        `json:"proveedor_id"`
	OrdenCompraID      pgtype.UUID        `json:"orden_compra_id"`
	DeliveryOnTime     pgtype.Bool        `json:"delivery_on_time"`
	QualityScore       pgtype.Int4        `json:"quality_score"`
	PriceCompliance    pgtype.Bool        `json:"price_compliance"`
	Comentario         pgtype.Text        `json:"comentario"`
	UsuarioID          pgtype.UUID        `json:"usuario_id"`
	CreatedAt          pgtype.Timestamptz `json:"created_at"`
	UpdatedAt          pgtype.Timestamptz `json:"updated_at"`
	OrdenCompraNumero  pgtype.Text        `json:"orden_compra_numero"`
}

func (q *Queries) ListEvaluacionesByProveedor(ctx context.Context, arg ListEvaluacionesByProveedorParams) ([]ListEvaluacionesByProveedorRow, error) {
	rows, err := q.db.Query(ctx, listEvaluacionesByProveedor,
		arg.ProveedorID, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListEvaluacionesByProveedorRow
	for rows.Next() {
		var i ListEvaluacionesByProveedorRow
		if err := rows.Scan(
			&i.ID, &i.ProveedorID, &i.OrdenCompraID, &i.DeliveryOnTime,
			&i.QualityScore, &i.PriceCompliance, &i.Comentario,
			&i.UsuarioID, &i.CreatedAt, &i.UpdatedAt,
			&i.OrdenCompraNumero,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countEvaluacionesByProveedor = `-- name: CountEvaluacionesByProveedor :one
SELECT COUNT(*) FROM evaluacion_proveedor WHERE proveedor_id = $1 AND usuario_id = $2
`

type CountEvaluacionesByProveedorParams struct {
	ProveedorID pgtype.UUID `json:"proveedor_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CountEvaluacionesByProveedor(ctx context.Context, arg CountEvaluacionesByProveedorParams) (int64, error) {
	row := q.db.QueryRow(ctx, countEvaluacionesByProveedor, arg.ProveedorID, arg.UsuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const getEvaluacionPromedio = `-- name: GetEvaluacionPromedio :one
SELECT
    COUNT(*) as total_evaluaciones,
    AVG(CASE WHEN delivery_on_time THEN 1.0 ELSE 0.0 END) as pct_on_time,
    AVG(quality_score) as avg_quality,
    AVG(CASE WHEN price_compliance THEN 1.0 ELSE 0.0 END) as pct_price_ok
FROM evaluacion_proveedor
WHERE proveedor_id = $1 AND usuario_id = $2
`

type GetEvaluacionPromedioParams struct {
	ProveedorID pgtype.UUID `json:"proveedor_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
}

type GetEvaluacionPromedioRow struct {
	TotalEvaluaciones int64          `json:"total_evaluaciones"`
	PctOnTime         pgtype.Numeric `json:"pct_on_time"`
	AvgQuality        pgtype.Numeric `json:"avg_quality"`
	PctPriceOk        pgtype.Numeric `json:"pct_price_ok"`
}

func (q *Queries) GetEvaluacionPromedio(ctx context.Context, arg GetEvaluacionPromedioParams) (GetEvaluacionPromedioRow, error) {
	row := q.db.QueryRow(ctx, getEvaluacionPromedio, arg.ProveedorID, arg.UsuarioID)
	var i GetEvaluacionPromedioRow
	err := row.Scan(&i.TotalEvaluaciones, &i.PctOnTime, &i.AvgQuality, &i.PctPriceOk)
	return i, err
}
