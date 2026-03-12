-- name: NextOrdenCompraNumero :one
SELECT nextval('orden_compra_numero_seq');

-- name: CreateOrdenCompra :one
INSERT INTO ordenes_compra (
  numero, proveedor_id, sucursal_id, estado, condicion_pago,
  fecha_orden, fecha_entrega_estimada,
  subtotal, descuento_porcentaje, descuento_monto,
  base_imponible, total_impuestos, total,
  observaciones, usuario_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
RETURNING *;

-- name: CreateDetalleOrdenCompra :one
INSERT INTO detalle_ordenes_compra (
  orden_compra_id, producto_id, producto_nombre, producto_codigo,
  cantidad, cantidad_recibida, precio_unitario,
  descuento_porcentaje, descuento_monto, subtotal, orden
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: CreateImpuestoOrdenCompra :one
INSERT INTO impuestos_orden_compra (
  orden_compra_id, tipo, nombre, porcentaje, base_imponible, monto
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetOrdenCompraByID :one
SELECT oc.*,
  p.nombre AS proveedor_nombre,
  p.cuit AS proveedor_cuit,
  p.condicion_iva AS proveedor_condicion_iva,
  s.nombre AS sucursal_nombre
FROM ordenes_compra oc
JOIN proveedores p ON oc.proveedor_id = p.id
JOIN sucursales s ON oc.sucursal_id = s.id
WHERE oc.id = $1 AND oc.usuario_id = $2 AND oc.active = TRUE;

-- name: ListOrdenesCompra :many
SELECT oc.id, oc.numero, oc.proveedor_id,
  p.nombre AS proveedor_nombre,
  oc.sucursal_id, s.nombre AS sucursal_nombre,
  oc.estado, oc.condicion_pago,
  oc.fecha_orden, oc.fecha_entrega_estimada,
  oc.subtotal, oc.total, oc.created_at
FROM ordenes_compra oc
JOIN proveedores p ON oc.proveedor_id = p.id
JOIN sucursales s ON oc.sucursal_id = s.id
WHERE oc.usuario_id = $1 AND oc.active = TRUE
ORDER BY oc.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountOrdenesCompra :one
SELECT COUNT(*) FROM ordenes_compra
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListOrdenesCompraByEstado :many
SELECT oc.id, oc.numero, oc.proveedor_id,
  p.nombre AS proveedor_nombre,
  oc.sucursal_id, s.nombre AS sucursal_nombre,
  oc.estado, oc.condicion_pago,
  oc.fecha_orden, oc.fecha_entrega_estimada,
  oc.subtotal, oc.total, oc.created_at
FROM ordenes_compra oc
JOIN proveedores p ON oc.proveedor_id = p.id
JOIN sucursales s ON oc.sucursal_id = s.id
WHERE oc.usuario_id = $1 AND oc.active = TRUE AND oc.estado = $2
ORDER BY oc.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountOrdenesCompraByEstado :one
SELECT COUNT(*) FROM ordenes_compra
WHERE usuario_id = $1 AND active = TRUE AND estado = $2;

-- name: SearchOrdenesCompra :many
SELECT oc.id, oc.numero, oc.proveedor_id,
  p.nombre AS proveedor_nombre,
  oc.sucursal_id, s.nombre AS sucursal_nombre,
  oc.estado, oc.condicion_pago,
  oc.fecha_orden, oc.fecha_entrega_estimada,
  oc.subtotal, oc.total, oc.created_at
FROM ordenes_compra oc
JOIN proveedores p ON oc.proveedor_id = p.id
JOIN sucursales s ON oc.sucursal_id = s.id
WHERE oc.usuario_id = $1 AND oc.active = TRUE
  AND (oc.numero ILIKE $2 OR p.nombre ILIKE $2)
ORDER BY oc.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountSearchOrdenesCompra :one
SELECT COUNT(*) FROM ordenes_compra oc
JOIN proveedores p ON oc.proveedor_id = p.id
WHERE oc.usuario_id = $1 AND oc.active = TRUE
  AND (oc.numero ILIKE $2 OR p.nombre ILIKE $2);

-- name: ListDetalleOrdenCompra :many
SELECT d.*, pr.unidad AS producto_unidad
FROM detalle_ordenes_compra d
JOIN productos pr ON d.producto_id = pr.id
WHERE d.orden_compra_id = $1
ORDER BY d.orden ASC;

-- name: ListImpuestosOrdenCompra :many
SELECT * FROM impuestos_orden_compra
WHERE orden_compra_id = $1;

-- name: UpdateOrdenCompraEstado :one
UPDATE ordenes_compra SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: UpdateOrdenCompra :one
UPDATE ordenes_compra SET
  proveedor_id = $3,
  sucursal_id = $4,
  condicion_pago = $5,
  fecha_entrega_estimada = $6,
  subtotal = $7,
  descuento_porcentaje = $8,
  descuento_monto = $9,
  base_imponible = $10,
  total_impuestos = $11,
  total = $12,
  observaciones = $13,
  updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE AND estado = 'BORRADOR'
RETURNING *;

-- name: DeleteDetalleOrdenCompra :exec
DELETE FROM detalle_ordenes_compra
WHERE orden_compra_id = $1;

-- name: DeleteImpuestosOrdenCompra :exec
DELETE FROM impuestos_orden_compra
WHERE orden_compra_id = $1;

-- name: SoftDeleteOrdenCompra :exec
UPDATE ordenes_compra SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE AND estado = 'BORRADOR';

-- name: CreateHistorialOrdenCompra :one
INSERT INTO historial_orden_compra (orden_compra_id, estado_anterior, estado_nuevo, comentario, empleado_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListHistorialOrdenCompra :many
SELECT h.*,
  e.nombre AS empleado_nombre,
  e.apellido AS empleado_apellido
FROM historial_orden_compra h
LEFT JOIN empleados e ON h.empleado_id = e.id
WHERE h.orden_compra_id = $1
ORDER BY h.created_at ASC;

-- name: UpdateDetalleRecibida :exec
UPDATE detalle_ordenes_compra
SET cantidad_recibida = $2
WHERE id = $1;

-- name: GetDetalleOrdenCompraByID :one
SELECT d.*, pr.unidad AS producto_unidad
FROM detalle_ordenes_compra d
JOIN productos pr ON d.producto_id = pr.id
WHERE d.id = $1;
