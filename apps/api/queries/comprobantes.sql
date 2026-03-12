-- name: GetNextComprobanteNumero :one
SELECT nextval('comprobante_numero_seq')::bigint;

-- name: CreateComprobante :one
INSERT INTO comprobantes (
  tipo, letra, numero, estado,
  pedido_id, cliente_id, sucursal_id,
  subtotal, descuento_monto, base_imponible,
  total_impuestos, total, impuestos,
  fecha_emision, condicion_pago, observaciones,
  usuario_id
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7,
  $8, $9, $10,
  $11, $12, $13,
  $14, $15, $16,
  $17
) RETURNING *;

-- name: CreateDetalleComprobante :one
INSERT INTO detalle_comprobantes (
  comprobante_id, producto_id, producto_nombre,
  producto_codigo, producto_unidad, cantidad,
  precio_unitario, descuento_porcentaje, descuento_monto,
  subtotal, orden
) VALUES (
  $1, $2, $3,
  $4, $5, $6,
  $7, $8, $9,
  $10, $11
) RETURNING *;

-- name: GetComprobanteByID :one
SELECT c.*,
       cl.nombre AS cliente_nombre,
       cl.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM comprobantes c
JOIN clientes cl ON cl.id = c.cliente_id
JOIN sucursales s ON s.id = c.sucursal_id
WHERE c.id = $1 AND c.usuario_id = $2 AND c.active = TRUE;

-- name: ListComprobantes :many
SELECT c.*,
       cl.nombre AS cliente_nombre,
       cl.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM comprobantes c
JOIN clientes cl ON cl.id = c.cliente_id
JOIN sucursales s ON s.id = c.sucursal_id
WHERE c.usuario_id = $1 AND c.active = TRUE
ORDER BY c.fecha_emision DESC, c.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountComprobantes :one
SELECT COUNT(*) FROM comprobantes
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListComprobantesByEstado :many
SELECT c.*,
       cl.nombre AS cliente_nombre,
       cl.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM comprobantes c
JOIN clientes cl ON cl.id = c.cliente_id
JOIN sucursales s ON s.id = c.sucursal_id
WHERE c.usuario_id = $1 AND c.estado = $2 AND c.active = TRUE
ORDER BY c.fecha_emision DESC, c.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountComprobantesByEstado :one
SELECT COUNT(*) FROM comprobantes
WHERE usuario_id = $1 AND estado = $2 AND active = TRUE;

-- name: ListComprobantesByCliente :many
SELECT c.*,
       cl.nombre AS cliente_nombre,
       cl.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM comprobantes c
JOIN clientes cl ON cl.id = c.cliente_id
JOIN sucursales s ON s.id = c.sucursal_id
WHERE c.usuario_id = $1 AND c.cliente_id = $2 AND c.active = TRUE
ORDER BY c.fecha_emision DESC, c.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountComprobantesByCliente :one
SELECT COUNT(*) FROM comprobantes
WHERE usuario_id = $1 AND cliente_id = $2 AND active = TRUE;

-- name: GetComprobanteByPedido :one
SELECT c.*,
       cl.nombre AS cliente_nombre,
       cl.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM comprobantes c
JOIN clientes cl ON cl.id = c.cliente_id
JOIN sucursales s ON s.id = c.sucursal_id
WHERE c.pedido_id = $1 AND c.usuario_id = $2 AND c.active = TRUE;

-- name: ListDetallesByComprobante :many
SELECT * FROM detalle_comprobantes
WHERE comprobante_id = $1
ORDER BY orden ASC;

-- name: UpdateComprobanteEstado :one
UPDATE comprobantes
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: UpdateComprobanteCae :exec
UPDATE comprobantes
SET cae = $3, fecha_vencimiento_cae = $4, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: SoftDeleteComprobante :exec
UPDATE comprobantes
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND estado = 'BORRADOR';

-- name: SearchComprobantes :many
SELECT c.*,
       cl.nombre AS cliente_nombre,
       cl.apellido AS cliente_apellido,
       s.nombre AS sucursal_nombre
FROM comprobantes c
JOIN clientes cl ON cl.id = c.cliente_id
JOIN sucursales s ON s.id = c.sucursal_id
WHERE c.usuario_id = $1 AND c.active = TRUE
  AND (c.numero ILIKE $2 OR cl.nombre ILIKE $2 OR cl.apellido ILIKE $2 OR cl.razon_social ILIKE $2)
ORDER BY c.fecha_emision DESC, c.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountSearchComprobantes :one
SELECT COUNT(*)
FROM comprobantes c
JOIN clientes cl ON cl.id = c.cliente_id
WHERE c.usuario_id = $1 AND c.active = TRUE
  AND (c.numero ILIKE $2 OR cl.nombre ILIKE $2 OR cl.apellido ILIKE $2 OR cl.razon_social ILIKE $2);
