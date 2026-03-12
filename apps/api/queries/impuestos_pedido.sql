-- name: CreateImpuestoPedido :one
INSERT INTO impuestos_pedido (
  pedido_id, tipo, nombre, porcentaje, base_imponible, monto
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListImpuestosPedido :many
SELECT * FROM impuestos_pedido
WHERE pedido_id = $1
ORDER BY tipo, nombre;

-- name: DeleteImpuestosPedidoByPedido :exec
DELETE FROM impuestos_pedido WHERE pedido_id = $1;
