-- name: UpsertCatalogoProducto :one
INSERT INTO catalogo_productos (producto_id, sucursal_id, precio, stock)
VALUES ($1, $2, $3, $4)
ON CONFLICT (producto_id, sucursal_id)
DO UPDATE SET precio = EXCLUDED.precio, stock = EXCLUDED.stock, active = TRUE, updated_at = NOW()
RETURNING *;

-- name: GetCatalogoProducto :one
SELECT * FROM catalogo_productos
WHERE producto_id = $1 AND sucursal_id = $2 AND active = TRUE;

-- name: ListCatalogoBySucursal :many
SELECT cp.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       p.unidad AS producto_unidad,
       p.precio_base AS producto_precio_base
FROM catalogo_productos cp
JOIN productos p ON p.id = cp.producto_id
WHERE cp.sucursal_id = $1 AND cp.active = TRUE AND p.active = TRUE
ORDER BY p.nombre
LIMIT $2 OFFSET $3;

-- name: CountCatalogoBySucursal :one
SELECT COUNT(*)
FROM catalogo_productos cp
JOIN productos p ON p.id = cp.producto_id
WHERE cp.sucursal_id = $1 AND cp.active = TRUE AND p.active = TRUE;

-- name: UpdateCatalogoStock :one
UPDATE catalogo_productos
SET stock = $3, updated_at = NOW()
WHERE producto_id = $1 AND sucursal_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteCatalogoProducto :exec
UPDATE catalogo_productos
SET active = FALSE, updated_at = NOW()
WHERE producto_id = $1 AND sucursal_id = $2;

-- name: ListLowStockBySucursal :many
SELECT cp.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       p.unidad AS producto_unidad,
       p.precio_base AS producto_precio_base
FROM catalogo_productos cp
JOIN productos p ON p.id = cp.producto_id
WHERE cp.sucursal_id = $1 AND cp.active = TRUE AND p.active = TRUE
  AND cp.stock <= $2
ORDER BY cp.stock ASC
LIMIT $3 OFFSET $4;
