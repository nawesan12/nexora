-- name: CreateEntidadBancaria :one
INSERT INTO entidades_bancarias (nombre, sucursal_banco, numero_cuenta, cbu, alias, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetEntidadBancariaByID :one
SELECT * FROM entidades_bancarias
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListEntidadesBancarias :many
SELECT * FROM entidades_bancarias
WHERE usuario_id = $1 AND active = TRUE
ORDER BY nombre
LIMIT $2 OFFSET $3;

-- name: CountEntidadesBancarias :one
SELECT COUNT(*) FROM entidades_bancarias
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdateEntidadBancaria :one
UPDATE entidades_bancarias
SET nombre = $3, sucursal_banco = $4, numero_cuenta = $5, cbu = $6, alias = $7, sucursal_id = $8, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteEntidadBancaria :exec
UPDATE entidades_bancarias
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
