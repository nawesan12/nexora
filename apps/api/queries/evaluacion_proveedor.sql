-- name: CreateEvaluacion :one
INSERT INTO evaluacion_proveedor (proveedor_id, orden_compra_id, delivery_on_time, quality_score, price_compliance, comentario, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListEvaluacionesByProveedor :many
SELECT ep.*, oc.numero as orden_compra_numero
FROM evaluacion_proveedor ep
LEFT JOIN ordenes_compra oc ON oc.id = ep.orden_compra_id
WHERE ep.proveedor_id = $1 AND ep.usuario_id = $2
ORDER BY ep.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountEvaluacionesByProveedor :one
SELECT COUNT(*) FROM evaluacion_proveedor WHERE proveedor_id = $1 AND usuario_id = $2;

-- name: GetEvaluacionPromedio :one
SELECT
    COUNT(*) as total_evaluaciones,
    AVG(CASE WHEN delivery_on_time THEN 1.0 ELSE 0.0 END) as pct_on_time,
    AVG(quality_score) as avg_quality,
    AVG(CASE WHEN price_compliance THEN 1.0 ELSE 0.0 END) as pct_price_ok
FROM evaluacion_proveedor
WHERE proveedor_id = $1 AND usuario_id = $2;
