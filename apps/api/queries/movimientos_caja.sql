-- name: CreateMovimientoCaja :one
INSERT INTO movimientos_caja (caja_id, tipo, monto, concepto, referencia_id, referencia_tipo, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetMovimientoByID :one
SELECT * FROM movimientos_caja
WHERE id = $1 AND usuario_id = $2;

-- name: ListMovimientosByCaja :many
SELECT * FROM movimientos_caja
WHERE caja_id = $1 AND usuario_id = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountMovimientosByCaja :one
SELECT COUNT(*) FROM movimientos_caja
WHERE caja_id = $1 AND usuario_id = $2;

-- name: ListMovimientos :many
SELECT * FROM movimientos_caja
WHERE usuario_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountMovimientos :one
SELECT COUNT(*) FROM movimientos_caja
WHERE usuario_id = $1;
