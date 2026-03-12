-- name: CreateMetodoPago :one
INSERT INTO metodos_pago (nombre, tipo, comision_porcentaje, descuento_porcentaje, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetMetodoPagoByID :one
SELECT * FROM metodos_pago
WHERE id = $1 AND usuario_id = $2 AND activo = TRUE;

-- name: ListMetodosPago :many
SELECT * FROM metodos_pago
WHERE usuario_id = $1 AND activo = TRUE
ORDER BY nombre
LIMIT $2 OFFSET $3;

-- name: CountMetodosPago :one
SELECT COUNT(*) FROM metodos_pago
WHERE usuario_id = $1 AND activo = TRUE;

-- name: UpdateMetodoPago :one
UPDATE metodos_pago
SET nombre = $3, tipo = $4, comision_porcentaje = $5, descuento_porcentaje = $6, sucursal_id = $7, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND activo = TRUE
RETURNING *;

-- name: SoftDeleteMetodoPago :exec
UPDATE metodos_pago
SET activo = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
