-- name: CreatePresupuesto :one
INSERT INTO presupuestos (nombre, monto_asignado, monto_utilizado, periodo, fecha_inicio, fecha_fin, estado, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetPresupuestoByID :one
SELECT * FROM presupuestos
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListPresupuestos :many
SELECT * FROM presupuestos
WHERE usuario_id = $1 AND active = TRUE
ORDER BY fecha_inicio DESC
LIMIT $2 OFFSET $3;

-- name: CountPresupuestos :one
SELECT COUNT(*) FROM presupuestos
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListPresupuestosByEstado :many
SELECT * FROM presupuestos
WHERE usuario_id = $1 AND estado = $2 AND active = TRUE
ORDER BY fecha_inicio DESC
LIMIT $3 OFFSET $4;

-- name: CountPresupuestosByEstado :one
SELECT COUNT(*) FROM presupuestos
WHERE usuario_id = $1 AND estado = $2 AND active = TRUE;

-- name: UpdatePresupuesto :one
UPDATE presupuestos
SET nombre = $3, monto_asignado = $4, periodo = $5, fecha_inicio = $6, fecha_fin = $7,
    estado = $8, sucursal_id = $9, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: UpdatePresupuestoMontoUtilizado :one
UPDATE presupuestos
SET monto_utilizado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeletePresupuesto :exec
UPDATE presupuestos
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
