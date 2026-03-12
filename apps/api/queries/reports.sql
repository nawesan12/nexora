-- name: ReportVentasPorPeriodo :many
SELECT
  TO_CHAR(DATE_TRUNC('month', p.fecha_pedido), 'YYYY-MM') AS month,
  COALESCE(SUM(p.total), 0) AS total,
  COUNT(*)::bigint AS count
FROM pedidos p
WHERE p.usuario_id = $1
  AND p.active = TRUE
  AND p.estado IN ('ENTREGADO', 'FACTURADO')
  AND (sqlc.narg('fecha_desde')::date IS NULL OR p.fecha_pedido >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR p.fecha_pedido <= sqlc.narg('fecha_hasta')::date)
GROUP BY DATE_TRUNC('month', p.fecha_pedido)
ORDER BY month;

-- name: ReportVentasPorCliente :many
SELECT
  c.nombre || COALESCE(' ' || c.apellido, '') AS label,
  COALESCE(SUM(p.total), 0) AS value,
  COUNT(*)::bigint AS count
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
WHERE p.usuario_id = $1
  AND p.active = TRUE
  AND p.estado IN ('ENTREGADO', 'FACTURADO')
  AND (sqlc.narg('fecha_desde')::date IS NULL OR p.fecha_pedido >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR p.fecha_pedido <= sqlc.narg('fecha_hasta')::date)
GROUP BY c.id, c.nombre, c.apellido
ORDER BY value DESC
LIMIT 20;

-- name: ReportVentasPorProducto :many
SELECT
  pr.nombre AS label,
  COALESCE(SUM(dp.subtotal), 0) AS value,
  SUM(dp.cantidad)::bigint AS count
FROM detalle_pedidos dp
JOIN pedidos p ON p.id = dp.pedido_id
JOIN productos pr ON pr.id = dp.producto_id
WHERE p.usuario_id = $1
  AND p.active = TRUE
  AND p.estado IN ('ENTREGADO', 'FACTURADO')
  AND (sqlc.narg('fecha_desde')::date IS NULL OR p.fecha_pedido >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR p.fecha_pedido <= sqlc.narg('fecha_hasta')::date)
GROUP BY pr.id, pr.nombre
ORDER BY value DESC
LIMIT 20;

-- name: ReportVentasPorEmpleado :many
SELECT
  COALESCE(e.nombre || ' ' || e.apellido, 'Sin asignar') AS label,
  COALESCE(SUM(p.total), 0) AS value,
  COUNT(*)::bigint AS count
FROM pedidos p
LEFT JOIN empleados e ON e.id = p.empleado_id
WHERE p.usuario_id = $1
  AND p.active = TRUE
  AND p.estado IN ('ENTREGADO', 'FACTURADO')
  AND (sqlc.narg('fecha_desde')::date IS NULL OR p.fecha_pedido >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR p.fecha_pedido <= sqlc.narg('fecha_hasta')::date)
GROUP BY e.id, e.nombre, e.apellido
ORDER BY value DESC
LIMIT 20;

-- name: ReportComprasPorPeriodo :many
SELECT
  TO_CHAR(DATE_TRUNC('month', oc.fecha_orden), 'YYYY-MM') AS month,
  COALESCE(SUM(oc.total), 0) AS total,
  COUNT(*)::bigint AS count
FROM ordenes_compra oc
WHERE oc.usuario_id = $1
  AND oc.active = TRUE
  AND oc.estado IN ('RECIBIDA', 'RECIBIDA_PARCIALMENTE')
  AND (sqlc.narg('fecha_desde')::date IS NULL OR oc.fecha_orden >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR oc.fecha_orden <= sqlc.narg('fecha_hasta')::date)
GROUP BY DATE_TRUNC('month', oc.fecha_orden)
ORDER BY month;

-- name: ReportComprasPorProveedor :many
SELECT
  pv.nombre AS label,
  COALESCE(SUM(oc.total), 0) AS value,
  COUNT(*)::bigint AS count
FROM ordenes_compra oc
JOIN proveedores pv ON pv.id = oc.proveedor_id
WHERE oc.usuario_id = $1
  AND oc.active = TRUE
  AND oc.estado IN ('RECIBIDA', 'RECIBIDA_PARCIALMENTE')
  AND (sqlc.narg('fecha_desde')::date IS NULL OR oc.fecha_orden >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR oc.fecha_orden <= sqlc.narg('fecha_hasta')::date)
GROUP BY pv.id, pv.nombre
ORDER BY value DESC
LIMIT 20;

-- name: ReportStockValuation :many
SELECT
  pr.nombre AS producto_nombre,
  COALESCE(pr.codigo, '') AS producto_codigo,
  s.nombre AS sucursal_nombre,
  cp.stock,
  cp.precio,
  (cp.stock * cp.precio) AS valor_total
FROM catalogo_productos cp
JOIN productos pr ON pr.id = cp.producto_id
JOIN sucursales s ON s.id = cp.sucursal_id
WHERE pr.usuario_id = $1
  AND pr.active = TRUE
ORDER BY valor_total DESC
LIMIT 50;

-- name: ReportLowStock :many
SELECT
  pr.nombre AS producto_nombre,
  COALESCE(pr.codigo, '') AS producto_codigo,
  s.nombre AS sucursal_nombre,
  cp.stock,
  10::integer AS stock_minimo
FROM catalogo_productos cp
JOIN productos pr ON pr.id = cp.producto_id
JOIN sucursales s ON s.id = cp.sucursal_id
WHERE pr.usuario_id = $1
  AND pr.active = TRUE
  AND cp.stock < 10
ORDER BY cp.stock ASC
LIMIT 50;

-- name: ReportIngresosVsGastos :many
WITH ingresos AS (
  SELECT
    TO_CHAR(DATE_TRUNC('month', p.fecha_pedido), 'YYYY-MM') AS month,
    COALESCE(SUM(p.total), 0) AS total
  FROM pedidos p
  WHERE p.usuario_id = $1
    AND p.active = TRUE
    AND p.estado IN ('ENTREGADO', 'FACTURADO')
    AND (sqlc.narg('fecha_desde')::date IS NULL OR p.fecha_pedido >= sqlc.narg('fecha_desde')::date)
    AND (sqlc.narg('fecha_hasta')::date IS NULL OR p.fecha_pedido <= sqlc.narg('fecha_hasta')::date)
  GROUP BY DATE_TRUNC('month', p.fecha_pedido)
),
egresos AS (
  SELECT
    TO_CHAR(DATE_TRUNC('month', g.fecha), 'YYYY-MM') AS month,
    COALESCE(SUM(g.monto), 0) AS total
  FROM gastos g
  WHERE g.usuario_id = $1
    AND g.active = TRUE
    AND (sqlc.narg('fecha_desde')::date IS NULL OR g.fecha >= sqlc.narg('fecha_desde')::date)
    AND (sqlc.narg('fecha_hasta')::date IS NULL OR g.fecha <= sqlc.narg('fecha_hasta')::date)
  GROUP BY DATE_TRUNC('month', g.fecha)
)
SELECT
  COALESCE(i.month, e.month) AS month,
  COALESCE(i.total, 0) AS ingresos,
  COALESCE(e.total, 0) AS gastos
FROM ingresos i
FULL OUTER JOIN egresos e ON i.month = e.month
ORDER BY COALESCE(i.month, e.month);

-- name: ReportDesgloseGastos :many
SELECT
  g.categoria::text AS label,
  COALESCE(SUM(g.monto), 0) AS value,
  COUNT(*)::bigint AS count
FROM gastos g
WHERE g.usuario_id = $1
  AND g.active = TRUE
  AND (sqlc.narg('fecha_desde')::date IS NULL OR g.fecha >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR g.fecha <= sqlc.narg('fecha_hasta')::date)
GROUP BY g.categoria
ORDER BY value DESC;

-- name: ReportTopProductos :many
SELECT
  pr.nombre AS label,
  COALESCE(SUM(dp.subtotal), 0) AS value,
  SUM(dp.cantidad)::bigint AS count
FROM detalle_pedidos dp
JOIN pedidos p ON p.id = dp.pedido_id
JOIN productos pr ON pr.id = dp.producto_id
WHERE p.usuario_id = $1
  AND p.active = TRUE
  AND p.estado IN ('ENTREGADO', 'FACTURADO')
  AND (sqlc.narg('fecha_desde')::date IS NULL OR p.fecha_pedido >= sqlc.narg('fecha_desde')::date)
  AND (sqlc.narg('fecha_hasta')::date IS NULL OR p.fecha_pedido <= sqlc.narg('fecha_hasta')::date)
GROUP BY pr.id, pr.nombre
ORDER BY value DESC
LIMIT 10;
