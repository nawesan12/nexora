-- name: FinanceResumenSaldoCajas :one
SELECT COALESCE(SUM(saldo), 0)::NUMERIC(14,2) AS total
FROM cajas
WHERE usuario_id = $1 AND activa = TRUE;

-- name: FinanceResumenIngresosMes :one
SELECT COALESCE(SUM(total), 0)::NUMERIC(14,2) AS total
FROM pedidos
WHERE usuario_id = $1
  AND active = TRUE
  AND estado IN ('ENTREGADO', 'ENTREGADO_PARCIALMENTE')
  AND fecha_pedido >= date_trunc('month', CURRENT_DATE)
  AND fecha_pedido < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

-- name: FinanceResumenEgresosMes :one
SELECT COALESCE(SUM(monto), 0)::NUMERIC(14,2) AS total
FROM movimientos_caja
WHERE usuario_id = $1
  AND tipo = 'EGRESO'
  AND created_at >= date_trunc('month', CURRENT_DATE)
  AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

-- name: FinanceResumenChequesPendientes :one
SELECT COUNT(*) FROM cheques
WHERE usuario_id = $1
  AND estado IN ('RECIBIDO', 'DEPOSITADO');

-- name: FinanceResumenGastosMes :one
SELECT COALESCE(SUM(monto), 0)::NUMERIC(14,2) AS total
FROM gastos
WHERE usuario_id = $1
  AND active = TRUE
  AND fecha >= date_trunc('month', CURRENT_DATE)
  AND fecha < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

-- name: FinanceResumenUltimosMovimientos :many
SELECT mc.id, mc.tipo::TEXT AS tipo, mc.monto, mc.concepto, mc.created_at,
       c.nombre AS caja_nombre
FROM movimientos_caja mc
JOIN cajas c ON c.id = mc.caja_id
WHERE mc.usuario_id = $1
ORDER BY mc.created_at DESC
LIMIT $2;

-- name: FinanceResumenChequesPorVencer :many
SELECT id, numero, monto, fecha_vencimiento, estado::TEXT AS estado, banco, emisor
FROM cheques
WHERE usuario_id = $1
  AND estado IN ('RECIBIDO', 'DEPOSITADO')
  AND fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY fecha_vencimiento ASC
LIMIT $2;
