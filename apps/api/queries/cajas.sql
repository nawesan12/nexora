-- name: CreateCaja :one
INSERT INTO cajas (nombre, sucursal_id, tipo, saldo, usuario_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetCajaByID :one
SELECT * FROM cajas
WHERE id = $1 AND usuario_id = $2 AND activa = TRUE;

-- name: ListCajas :many
SELECT * FROM cajas
WHERE usuario_id = $1 AND activa = TRUE
ORDER BY nombre
LIMIT $2 OFFSET $3;

-- name: CountCajas :one
SELECT COUNT(*) FROM cajas
WHERE usuario_id = $1 AND activa = TRUE;

-- name: ListCajasBySucursal :many
SELECT * FROM cajas
WHERE usuario_id = $1 AND sucursal_id = $2 AND activa = TRUE
ORDER BY nombre
LIMIT $3 OFFSET $4;

-- name: CountCajasBySucursal :one
SELECT COUNT(*) FROM cajas
WHERE usuario_id = $1 AND sucursal_id = $2 AND activa = TRUE;

-- name: UpdateCaja :one
UPDATE cajas
SET nombre = $3, sucursal_id = $4, tipo = $5, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND activa = TRUE
RETURNING *;

-- name: UpdateCajaSaldo :exec
UPDATE cajas
SET saldo = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND activa = TRUE;

-- name: SoftDeleteCaja :exec
UPDATE cajas
SET activa = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
