-- name: CreateMovimientoStock :one
INSERT INTO movimientos_stock (
    producto_id, sucursal_id, tipo, cantidad, stock_anterior, stock_nuevo,
    motivo, referencia_id, referencia_tipo, empleado_id, usuario_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: ListMovimientosStock :many
SELECT ms.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       s.nombre AS sucursal_nombre
FROM movimientos_stock ms
JOIN productos p ON p.id = ms.producto_id
JOIN sucursales s ON s.id = ms.sucursal_id
WHERE ms.usuario_id = $1
ORDER BY ms.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountMovimientosStock :one
SELECT COUNT(*) FROM movimientos_stock
WHERE usuario_id = $1;

-- name: ListMovimientosStockByProducto :many
SELECT ms.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       s.nombre AS sucursal_nombre
FROM movimientos_stock ms
JOIN productos p ON p.id = ms.producto_id
JOIN sucursales s ON s.id = ms.sucursal_id
WHERE ms.usuario_id = $1 AND ms.producto_id = $2
ORDER BY ms.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountMovimientosStockByProducto :one
SELECT COUNT(*) FROM movimientos_stock
WHERE usuario_id = $1 AND producto_id = $2;

-- name: ListMovimientosStockByTipo :many
SELECT ms.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       s.nombre AS sucursal_nombre
FROM movimientos_stock ms
JOIN productos p ON p.id = ms.producto_id
JOIN sucursales s ON s.id = ms.sucursal_id
WHERE ms.usuario_id = $1 AND ms.tipo = $2
ORDER BY ms.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountMovimientosStockByTipo :one
SELECT COUNT(*) FROM movimientos_stock
WHERE usuario_id = $1 AND tipo = $2;

-- name: ListMovimientosStockBySucursal :many
SELECT ms.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       s.nombre AS sucursal_nombre
FROM movimientos_stock ms
JOIN productos p ON p.id = ms.producto_id
JOIN sucursales s ON s.id = ms.sucursal_id
WHERE ms.usuario_id = $1 AND ms.sucursal_id = $2
ORDER BY ms.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountMovimientosStockBySucursal :one
SELECT COUNT(*) FROM movimientos_stock
WHERE usuario_id = $1 AND sucursal_id = $2;

-- name: ListMovimientosStockFiltered :many
SELECT ms.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       s.nombre AS sucursal_nombre,
       e.nombre AS empleado_nombre
FROM movimientos_stock ms
JOIN productos p ON p.id = ms.producto_id
JOIN sucursales s ON s.id = ms.sucursal_id
LEFT JOIN empleados e ON e.id = ms.empleado_id
WHERE ms.usuario_id = sqlc.arg(usuario_id)
  AND (sqlc.narg(producto_id)::uuid IS NULL OR ms.producto_id = sqlc.narg(producto_id))
  AND (sqlc.narg(sucursal_id)::uuid IS NULL OR ms.sucursal_id = sqlc.narg(sucursal_id))
  AND (sqlc.narg(tipo)::text IS NULL OR sqlc.narg(tipo)::text = '' OR ms.tipo::text = sqlc.narg(tipo))
  AND (sqlc.narg(fecha_desde)::timestamptz IS NULL OR ms.created_at >= sqlc.narg(fecha_desde))
  AND (sqlc.narg(fecha_hasta)::timestamptz IS NULL OR ms.created_at <= sqlc.narg(fecha_hasta))
ORDER BY ms.created_at DESC
LIMIT sqlc.arg(query_limit) OFFSET sqlc.arg(query_offset);

-- name: CountMovimientosStockFiltered :one
SELECT COUNT(*) FROM movimientos_stock ms
WHERE ms.usuario_id = sqlc.arg(usuario_id)
  AND (sqlc.narg(producto_id)::uuid IS NULL OR ms.producto_id = sqlc.narg(producto_id))
  AND (sqlc.narg(sucursal_id)::uuid IS NULL OR ms.sucursal_id = sqlc.narg(sucursal_id))
  AND (sqlc.narg(tipo)::text IS NULL OR sqlc.narg(tipo)::text = '' OR ms.tipo::text = sqlc.narg(tipo))
  AND (sqlc.narg(fecha_desde)::timestamptz IS NULL OR ms.created_at >= sqlc.narg(fecha_desde))
  AND (sqlc.narg(fecha_hasta)::timestamptz IS NULL OR ms.created_at <= sqlc.narg(fecha_hasta));
