-- name: DashboardCountPedidosHoy :one
SELECT COUNT(*) FROM pedidos
WHERE usuario_id = $1
  AND active = TRUE
  AND fecha_pedido >= CURRENT_DATE
  AND fecha_pedido < CURRENT_DATE + INTERVAL '1 day';

-- name: DashboardCountProductosActivos :one
SELECT COUNT(*) FROM productos
WHERE usuario_id = $1 AND active = TRUE;

-- name: DashboardCountClientesActivos :one
SELECT COUNT(*) FROM clientes
WHERE usuario_id = $1 AND active = TRUE;

-- name: DashboardFacturacionMes :one
SELECT COALESCE(SUM(total), 0)::NUMERIC(14,2) AS total
FROM pedidos
WHERE usuario_id = $1
  AND active = TRUE
  AND estado IN ('ENTREGADO', 'ENTREGADO_PARCIALMENTE')
  AND fecha_pedido >= date_trunc('month', CURRENT_DATE)
  AND fecha_pedido < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

-- name: DashboardIngresosMensuales :many
SELECT to_char(date_trunc('month', fecha_pedido), 'YYYY-MM') AS month,
       COALESCE(SUM(total), 0)::NUMERIC(14,2) AS total
FROM pedidos
WHERE usuario_id = $1
  AND active = TRUE
  AND estado IN ('ENTREGADO', 'ENTREGADO_PARCIALMENTE')
  AND fecha_pedido >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
GROUP BY date_trunc('month', fecha_pedido)
ORDER BY date_trunc('month', fecha_pedido);

-- name: DashboardGastosMensuales :many
SELECT to_char(date_trunc('month', fecha), 'YYYY-MM') AS month,
       COALESCE(SUM(monto), 0)::NUMERIC(14,2) AS total
FROM gastos
WHERE usuario_id = $1
  AND active = TRUE
  AND fecha >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
GROUP BY date_trunc('month', fecha)
ORDER BY date_trunc('month', fecha);

-- name: DashboardPedidosPorEstado :many
SELECT estado::TEXT AS estado, COUNT(*) AS count
FROM pedidos
WHERE usuario_id = $1 AND active = TRUE
GROUP BY estado
ORDER BY count DESC;

-- name: DashboardPedidosSemana :many
SELECT d::DATE AS day, COUNT(p.id) AS count
FROM generate_series(
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE,
  '1 day'
) AS d
LEFT JOIN pedidos p
  ON p.fecha_pedido >= d AND p.fecha_pedido < d + INTERVAL '1 day'
  AND p.usuario_id = $1
  AND p.active = TRUE
GROUP BY d
ORDER BY d;

-- name: DashboardActividadReciente :many
SELECT h.id,
       h.estado_anterior::TEXT AS estado_anterior,
       h.estado_nuevo::TEXT AS estado_nuevo,
       h.comentario,
       h.created_at,
       p.numero AS pedido_numero,
       c.nombre AS cliente_nombre,
       e.nombre AS empleado_nombre
FROM historial_pedido h
JOIN pedidos p ON p.id = h.pedido_id
JOIN clientes c ON c.id = p.cliente_id
LEFT JOIN empleados e ON e.id = h.empleado_id
WHERE p.usuario_id = $1
ORDER BY h.created_at DESC
LIMIT $2;
