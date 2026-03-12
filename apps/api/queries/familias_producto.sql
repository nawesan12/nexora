-- name: CreateFamiliaProducto :one
INSERT INTO familias_producto (nombre, descripcion, usuario_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetFamiliaProductoByID :one
SELECT * FROM familias_producto
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListFamiliasProducto :many
SELECT * FROM familias_producto
WHERE usuario_id = $1 AND active = TRUE
ORDER BY nombre
LIMIT $2 OFFSET $3;

-- name: CountFamiliasProducto :one
SELECT COUNT(*) FROM familias_producto
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdateFamiliaProducto :one
UPDATE familias_producto
SET nombre = $3, descripcion = $4, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteFamiliaProducto :exec
UPDATE familias_producto
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
