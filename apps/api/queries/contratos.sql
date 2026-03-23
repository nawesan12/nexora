-- name: CreateContrato :one
INSERT INTO contratos (empleado_id, tipo, salario, fecha_inicio, fecha_fin, descripcion, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetContratoByID :one
SELECT c.*
FROM contratos c
JOIN empleados e ON e.id = c.empleado_id
WHERE c.id = $1 AND c.usuario_id = $2 AND c.active = TRUE;

-- name: ListContratosByEmpleado :many
SELECT c.*
FROM contratos c
WHERE c.empleado_id = $1 AND c.usuario_id = $2 AND c.active = TRUE
ORDER BY c.fecha_inicio DESC
LIMIT $3 OFFSET $4;

-- name: CountContratosByEmpleado :one
SELECT COUNT(*) FROM contratos
WHERE empleado_id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: UpdateContrato :one
UPDATE contratos
SET tipo = $3, salario = $4, fecha_inicio = $5, fecha_fin = $6, descripcion = $7
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteContrato :exec
UPDATE contratos
SET active = FALSE
WHERE id = $1 AND usuario_id = $2;
