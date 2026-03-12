-- name: CreateHistorialPedido :one
INSERT INTO historial_pedido (
  pedido_id, estado_anterior, estado_nuevo, empleado_id, comentario
) VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListHistorialPedido :many
SELECT h.*,
       e.nombre AS empleado_nombre,
       e.apellido AS empleado_apellido
FROM historial_pedido h
LEFT JOIN empleados e ON e.id = h.empleado_id
WHERE h.pedido_id = $1
ORDER BY h.created_at ASC;
