-- name: CreateCategoriaProducto :one
INSERT INTO categorias_producto (nombre, descripcion, familia_id, usuario_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetCategoriaProductoByID :one
SELECT * FROM categorias_producto
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListCategoriasProducto :many
SELECT * FROM categorias_producto
WHERE usuario_id = $1 AND active = TRUE
ORDER BY nombre
LIMIT $2 OFFSET $3;

-- name: ListCategoriasProductoByFamilia :many
SELECT * FROM categorias_producto
WHERE familia_id = $1 AND usuario_id = $2 AND active = TRUE
ORDER BY nombre;

-- name: CountCategoriasProducto :one
SELECT COUNT(*) FROM categorias_producto
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdateCategoriaProducto :one
UPDATE categorias_producto
SET nombre = $3, descripcion = $4, familia_id = $5, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteCategoriaProducto :exec
UPDATE categorias_producto
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
