-- name: CreateGasto :one
INSERT INTO gastos (concepto, monto, categoria, fecha, comprobante, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetGastoByID :one
SELECT * FROM gastos
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListGastos :many
SELECT * FROM gastos
WHERE usuario_id = $1 AND active = TRUE
ORDER BY fecha DESC
LIMIT $2 OFFSET $3;

-- name: CountGastos :one
SELECT COUNT(*) FROM gastos
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListGastosByCategoria :many
SELECT * FROM gastos
WHERE usuario_id = $1 AND categoria = $2 AND active = TRUE
ORDER BY fecha DESC
LIMIT $3 OFFSET $4;

-- name: CountGastosByCategoria :one
SELECT COUNT(*) FROM gastos
WHERE usuario_id = $1 AND categoria = $2 AND active = TRUE;

-- name: UpdateGasto :one
UPDATE gastos
SET concepto = $3, monto = $4, categoria = $5, fecha = $6, comprobante = $7, sucursal_id = $8, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteGasto :exec
UPDATE gastos
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: CreateGastoRecurrente :one
INSERT INTO gastos_recurrentes (concepto, monto, categoria, frecuencia, proxima_fecha, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetGastoRecurrenteByID :one
SELECT * FROM gastos_recurrentes
WHERE id = $1 AND usuario_id = $2 AND activo = TRUE;

-- name: ListGastosRecurrentes :many
SELECT * FROM gastos_recurrentes
WHERE usuario_id = $1 AND activo = TRUE
ORDER BY proxima_fecha
LIMIT $2 OFFSET $3;

-- name: CountGastosRecurrentes :one
SELECT COUNT(*) FROM gastos_recurrentes
WHERE usuario_id = $1 AND activo = TRUE;

-- name: UpdateGastoRecurrente :one
UPDATE gastos_recurrentes
SET concepto = $3, monto = $4, categoria = $5, frecuencia = $6, proxima_fecha = $7, sucursal_id = $8, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND activo = TRUE
RETURNING *;

-- name: SoftDeleteGastoRecurrente :exec
UPDATE gastos_recurrentes
SET activo = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
