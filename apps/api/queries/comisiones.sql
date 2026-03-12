-- name: CreateConfiguracionComision :one
INSERT INTO configuracion_comisiones (empleado_id, tipo_comision, porcentaje_base, escalonamiento, usuario_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetConfiguracionComisionByID :one
SELECT * FROM configuracion_comisiones
WHERE id = $1 AND usuario_id = $2 AND activa = TRUE;

-- name: ListConfiguracionComisiones :many
SELECT * FROM configuracion_comisiones
WHERE usuario_id = $1 AND activa = TRUE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountConfiguracionComisiones :one
SELECT COUNT(*) FROM configuracion_comisiones
WHERE usuario_id = $1 AND activa = TRUE;

-- name: GetConfiguracionComisionByEmpleado :one
SELECT * FROM configuracion_comisiones
WHERE empleado_id = $1 AND usuario_id = $2 AND activa = TRUE;

-- name: UpdateConfiguracionComision :one
UPDATE configuracion_comisiones
SET tipo_comision = $3, porcentaje_base = $4, escalonamiento = $5, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND activa = TRUE
RETURNING *;

-- name: SoftDeleteConfiguracionComision :exec
UPDATE configuracion_comisiones
SET activa = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: CreateComisionVendedor :one
INSERT INTO comisiones_vendedor (empleado_id, pedido_id, monto, porcentaje, periodo, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListComisionesVendedor :many
SELECT * FROM comisiones_vendedor
WHERE usuario_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountComisionesVendedor :one
SELECT COUNT(*) FROM comisiones_vendedor
WHERE usuario_id = $1;

-- name: ListComisionesVendedorByEmpleado :many
SELECT * FROM comisiones_vendedor
WHERE empleado_id = $1 AND usuario_id = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountComisionesVendedorByEmpleado :one
SELECT COUNT(*) FROM comisiones_vendedor
WHERE empleado_id = $1 AND usuario_id = $2;
