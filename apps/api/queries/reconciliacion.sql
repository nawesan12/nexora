-- name: CreateExtracto :one
INSERT INTO extractos_bancarios (entidad_bancaria_id, fecha_desde, fecha_hasta, archivo_nombre, usuario_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListExtractos :many
SELECT e.*, eb.nombre as entidad_nombre
FROM extractos_bancarios e
LEFT JOIN entidades_bancarias eb ON eb.id = e.entidad_bancaria_id
WHERE e.usuario_id = $1
ORDER BY e.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountExtractos :one
SELECT COUNT(*) FROM extractos_bancarios WHERE usuario_id = $1;

-- name: GetExtracto :one
SELECT e.*, eb.nombre as entidad_nombre
FROM extractos_bancarios e
LEFT JOIN entidades_bancarias eb ON eb.id = e.entidad_bancaria_id
WHERE e.id = $1 AND e.usuario_id = $2;

-- name: CreateMovimientoBancario :one
INSERT INTO movimientos_bancarios (extracto_id, fecha, descripcion, monto, referencia, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListMovimientosBancarios :many
SELECT * FROM movimientos_bancarios
WHERE extracto_id = $1 AND usuario_id = $2
ORDER BY fecha, created_at;

-- name: UpdateConciliacion :one
UPDATE movimientos_bancarios
SET estado_conciliacion = $1, movimiento_caja_id = $2
WHERE id = $3 AND usuario_id = $4
RETURNING *;

-- name: ListMovimientosCajaParaConciliar :many
SELECT mc.id, mc.caja_id, mc.tipo, mc.monto, mc.concepto, mc.created_at,
       c.nombre as caja_nombre
FROM movimientos_caja mc
JOIN cajas c ON c.id = mc.caja_id
WHERE c.sucursal_id IN (SELECT sucursal_id FROM entidades_bancarias WHERE id = $1)
  AND mc.created_at >= $2
  AND mc.created_at <= $3
  AND mc.id NOT IN (SELECT movimiento_caja_id FROM movimientos_bancarios WHERE movimiento_caja_id IS NOT NULL AND usuario_id = $4)
ORDER BY mc.created_at;
