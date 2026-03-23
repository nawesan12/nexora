-- name: CreatePromocion :one
INSERT INTO promociones (nombre, tipo, valor, cantidad_minima, producto_id, categoria_id, fecha_inicio, fecha_fin, activa, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetPromocionByID :one
SELECT p.*,
       prod.nombre AS producto_nombre,
       cat.nombre AS categoria_nombre,
       s.nombre AS sucursal_nombre
FROM promociones p
LEFT JOIN productos prod ON prod.id = p.producto_id
LEFT JOIN categorias_producto cat ON cat.id = p.categoria_id
LEFT JOIN sucursales s ON s.id = p.sucursal_id
WHERE p.id = $1 AND p.usuario_id = $2 AND p.active = TRUE;

-- name: ListPromociones :many
SELECT p.*,
       prod.nombre AS producto_nombre,
       cat.nombre AS categoria_nombre,
       s.nombre AS sucursal_nombre
FROM promociones p
LEFT JOIN productos prod ON prod.id = p.producto_id
LEFT JOIN categorias_producto cat ON cat.id = p.categoria_id
LEFT JOIN sucursales s ON s.id = p.sucursal_id
WHERE p.usuario_id = $1 AND p.active = TRUE
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountPromociones :one
SELECT COUNT(*) FROM promociones
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdatePromocion :one
UPDATE promociones
SET nombre = $3, tipo = $4, valor = $5, cantidad_minima = $6,
    producto_id = $7, categoria_id = $8, fecha_inicio = $9,
    fecha_fin = $10, activa = $11, sucursal_id = $12
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeletePromocion :exec
UPDATE promociones
SET active = FALSE
WHERE id = $1 AND usuario_id = $2;

-- name: CreateCategoriaCliente :one
INSERT INTO categorias_cliente (nombre, descripcion, descuento_porcentaje, usuario_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetCategoriaClienteByID :one
SELECT * FROM categorias_cliente
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListCategoriasCliente :many
SELECT * FROM categorias_cliente
WHERE usuario_id = $1 AND active = TRUE
ORDER BY nombre
LIMIT $2 OFFSET $3;

-- name: CountCategoriasCliente :one
SELECT COUNT(*) FROM categorias_cliente
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdateCategoriaCliente :one
UPDATE categorias_cliente
SET nombre = $3, descripcion = $4, descuento_porcentaje = $5
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteCategoriaCliente :exec
UPDATE categorias_cliente
SET active = FALSE
WHERE id = $1 AND usuario_id = $2;
