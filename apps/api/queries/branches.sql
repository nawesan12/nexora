-- name: CreateBranch :one
INSERT INTO sucursales (nombre, direccion, telefono, usuario_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetBranchByID :one
SELECT * FROM sucursales WHERE id = $1;

-- name: ListBranchesByUser :many
SELECT * FROM sucursales WHERE usuario_id = $1 AND active = TRUE ORDER BY nombre;

-- name: UpdateBranch :one
UPDATE sucursales
SET nombre = $3, direccion = $4, telefono = $5, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteBranch :exec
UPDATE sucursales SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: CountBranchesByUser :one
SELECT COUNT(*) FROM sucursales WHERE usuario_id = $1 AND active = TRUE;
