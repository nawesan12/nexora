-- name: CreateProducto :one
INSERT INTO productos (codigo, nombre, descripcion, precio_base, unidad, categoria_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetProductoByID :one
SELECT p.*,
       c.nombre AS categoria_nombre,
       f.nombre AS familia_nombre
FROM productos p
LEFT JOIN categorias_producto c ON c.id = p.categoria_id
LEFT JOIN familias_producto f ON f.id = c.familia_id
WHERE p.id = $1 AND p.usuario_id = $2 AND p.active = TRUE;

-- name: ListProductos :many
SELECT p.*,
       c.nombre AS categoria_nombre,
       f.nombre AS familia_nombre
FROM productos p
LEFT JOIN categorias_producto c ON c.id = p.categoria_id
LEFT JOIN familias_producto f ON f.id = c.familia_id
WHERE p.usuario_id = $1 AND p.active = TRUE
ORDER BY p.nombre
LIMIT $2 OFFSET $3;

-- name: CountProductos :one
SELECT COUNT(*) FROM productos
WHERE usuario_id = $1 AND active = TRUE;

-- name: SearchProductos :many
SELECT p.*,
       c.nombre AS categoria_nombre,
       f.nombre AS familia_nombre
FROM productos p
LEFT JOIN categorias_producto c ON c.id = p.categoria_id
LEFT JOIN familias_producto f ON f.id = c.familia_id
WHERE p.usuario_id = $1 AND p.active = TRUE
  AND (p.nombre ILIKE $2 OR p.codigo ILIKE $2)
ORDER BY p.nombre
LIMIT $3 OFFSET $4;

-- name: CountSearchProductos :one
SELECT COUNT(*) FROM productos
WHERE usuario_id = $1 AND active = TRUE
  AND (nombre ILIKE $2 OR codigo ILIKE $2);

-- name: ListProductosByCategoria :many
SELECT p.*,
       c.nombre AS categoria_nombre,
       f.nombre AS familia_nombre
FROM productos p
LEFT JOIN categorias_producto c ON c.id = p.categoria_id
LEFT JOIN familias_producto f ON f.id = c.familia_id
WHERE p.categoria_id = $1 AND p.usuario_id = $2 AND p.active = TRUE
ORDER BY p.nombre;

-- name: UpdateProducto :one
UPDATE productos
SET codigo = $3, nombre = $4, descripcion = $5, precio_base = $6,
    unidad = $7, categoria_id = $8, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteProducto :exec
UPDATE productos
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: GetProductoByCodigo :one
SELECT * FROM productos
WHERE codigo = $1 AND usuario_id = $2 AND active = TRUE;
