-- name: NextPedidoNumero :one
SELECT nextval('pedido_numero_seq')::bigint;

-- name: CreatePedido :one
INSERT INTO pedidos (
  numero, cliente_id, direccion_id, sucursal_id, empleado_id,
  estado, condicion_pago, fecha_entrega_estimada,
  subtotal, descuento_porcentaje, descuento_monto,
  base_imponible, total_impuestos, total,
  observaciones, observaciones_internas, usuario_id
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8,
  $9, $10, $11,
  $12, $13, $14,
  $15, $16, $17
) RETURNING *;

-- name: GetPedidoByID :one
SELECT p.*,
       c.nombre AS cliente_nombre,
       c.apellido AS cliente_apellido,
       c.cuit AS cliente_cuit,
       s.nombre AS sucursal_nombre,
       e.nombre AS empleado_nombre,
       e.apellido AS empleado_apellido
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
JOIN sucursales s ON s.id = p.sucursal_id
LEFT JOIN empleados e ON e.id = p.empleado_id
WHERE p.id = $1 AND p.usuario_id = $2 AND p.active = TRUE;

-- name: ListPedidos :many
SELECT p.*,
       c.nombre AS cliente_nombre,
       c.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
JOIN sucursales s ON s.id = p.sucursal_id
WHERE p.usuario_id = $1 AND p.active = TRUE
ORDER BY p.fecha_pedido DESC
LIMIT $2 OFFSET $3;

-- name: CountPedidos :one
SELECT COUNT(*) FROM pedidos
WHERE usuario_id = $1 AND active = TRUE;

-- name: SearchPedidos :many
SELECT p.*,
       c.nombre AS cliente_nombre,
       c.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
JOIN sucursales s ON s.id = p.sucursal_id
WHERE p.usuario_id = $1 AND p.active = TRUE
  AND (p.numero ILIKE $2 OR c.nombre ILIKE $2 OR c.apellido ILIKE $2 OR c.razon_social ILIKE $2)
ORDER BY p.fecha_pedido DESC
LIMIT $3 OFFSET $4;

-- name: CountSearchPedidos :one
SELECT COUNT(*)
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
WHERE p.usuario_id = $1 AND p.active = TRUE
  AND (p.numero ILIKE $2 OR c.nombre ILIKE $2 OR c.apellido ILIKE $2 OR c.razon_social ILIKE $2);

-- name: ListPedidosByEstado :many
SELECT p.*,
       c.nombre AS cliente_nombre,
       c.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
JOIN sucursales s ON s.id = p.sucursal_id
WHERE p.usuario_id = $1 AND p.estado = $2 AND p.active = TRUE
ORDER BY p.fecha_pedido DESC
LIMIT $3 OFFSET $4;

-- name: CountPedidosByEstado :one
SELECT COUNT(*) FROM pedidos
WHERE usuario_id = $1 AND estado = $2 AND active = TRUE;

-- name: ListPedidosByCliente :many
SELECT p.*,
       c.nombre AS cliente_nombre,
       c.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
JOIN sucursales s ON s.id = p.sucursal_id
WHERE p.usuario_id = $1 AND p.cliente_id = $2 AND p.active = TRUE
ORDER BY p.fecha_pedido DESC
LIMIT $3 OFFSET $4;

-- name: CountPedidosByCliente :one
SELECT COUNT(*) FROM pedidos
WHERE usuario_id = $1 AND cliente_id = $2 AND active = TRUE;

-- name: UpdatePedido :one
UPDATE pedidos
SET cliente_id = $3, direccion_id = $4, sucursal_id = $5, empleado_id = $6,
    condicion_pago = $7, fecha_entrega_estimada = $8,
    subtotal = $9, descuento_porcentaje = $10, descuento_monto = $11,
    base_imponible = $12, total_impuestos = $13, total = $14,
    observaciones = $15, observaciones_internas = $16, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE AND estado = 'PENDIENTE_APROBACION'
RETURNING *;

-- name: UpdatePedidoEstado :one
UPDATE pedidos
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: UpdatePedidoFechaEntregaReal :exec
UPDATE pedidos
SET fecha_entrega_real = NOW(), updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: SoftDeletePedido :exec
UPDATE pedidos
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND estado = 'PENDIENTE_APROBACION';
