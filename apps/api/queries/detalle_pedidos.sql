-- name: CreateDetallePedido :one
INSERT INTO detalle_pedidos (
  pedido_id, producto_id, producto_nombre, producto_codigo, producto_unidad,
  cantidad, precio_unitario, descuento_porcentaje, descuento_monto,
  subtotal, cantidad_entregada, orden
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9,
  $10, $11, $12
) RETURNING *;

-- name: ListDetallePedido :many
SELECT * FROM detalle_pedidos
WHERE pedido_id = $1
ORDER BY orden;

-- name: DeleteDetallePedidoByPedido :exec
DELETE FROM detalle_pedidos WHERE pedido_id = $1;

-- name: UpdateDetalleCantidadEntregada :exec
UPDATE detalle_pedidos
SET cantidad_entregada = $2
WHERE id = $1;
