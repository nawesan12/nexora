-- name: NextRepartoNumero :one
SELECT 'REP-' || LPAD(nextval('reparto_numero_seq')::text, 6, '0');

-- name: CreateReparto :one
INSERT INTO repartos (
    numero, fecha, empleado_id, vehiculo_id, zona_id, sucursal_id,
    observaciones, usuario_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetRepartoByID :one
SELECT r.*,
       e.nombre AS empleado_nombre,
       v.patente AS vehiculo_patente,
       v.marca || ' ' || v.modelo AS vehiculo_descripcion,
       z.nombre AS zona_nombre,
       s.nombre AS sucursal_nombre
FROM repartos r
JOIN empleados e ON e.id = r.empleado_id
LEFT JOIN vehiculos v ON v.id = r.vehiculo_id
LEFT JOIN zonas z ON z.id = r.zona_id
JOIN sucursales s ON s.id = r.sucursal_id
WHERE r.id = $1 AND r.usuario_id = $2 AND r.active = TRUE;

-- name: ListRepartos :many
SELECT r.*,
       e.nombre AS empleado_nombre,
       v.patente AS vehiculo_patente,
       z.nombre AS zona_nombre,
       s.nombre AS sucursal_nombre,
       (SELECT COUNT(*) FROM reparto_pedidos rp WHERE rp.reparto_id = r.id) AS pedidos_count
FROM repartos r
JOIN empleados e ON e.id = r.empleado_id
LEFT JOIN vehiculos v ON v.id = r.vehiculo_id
LEFT JOIN zonas z ON z.id = r.zona_id
JOIN sucursales s ON s.id = r.sucursal_id
WHERE r.usuario_id = $1 AND r.active = TRUE
ORDER BY r.fecha DESC, r.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountRepartos :one
SELECT COUNT(*) FROM repartos
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListRepartosByEstado :many
SELECT r.*,
       e.nombre AS empleado_nombre,
       v.patente AS vehiculo_patente,
       z.nombre AS zona_nombre,
       s.nombre AS sucursal_nombre,
       (SELECT COUNT(*) FROM reparto_pedidos rp WHERE rp.reparto_id = r.id) AS pedidos_count
FROM repartos r
JOIN empleados e ON e.id = r.empleado_id
LEFT JOIN vehiculos v ON v.id = r.vehiculo_id
LEFT JOIN zonas z ON z.id = r.zona_id
JOIN sucursales s ON s.id = r.sucursal_id
WHERE r.usuario_id = $1 AND r.active = TRUE AND r.estado = $2
ORDER BY r.fecha DESC, r.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountRepartosByEstado :one
SELECT COUNT(*) FROM repartos
WHERE usuario_id = $1 AND active = TRUE AND estado = $2;

-- name: UpdateRepartoEstado :exec
UPDATE repartos
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: UpdateRepartoSalida :exec
UPDATE repartos
SET hora_salida = NOW(), km_inicio = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: UpdateRepartoRegreso :exec
UPDATE repartos
SET hora_regreso = NOW(), km_fin = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: SoftDeleteReparto :exec
UPDATE repartos
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: CreateRepartoPedido :one
INSERT INTO reparto_pedidos (reparto_id, pedido_id, orden)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListRepartoPedidos :many
SELECT rp.*,
       p.numero AS pedido_numero,
       c.nombre AS cliente_nombre,
       p.estado AS pedido_estado,
       p.total AS pedido_total
FROM reparto_pedidos rp
JOIN pedidos p ON p.id = rp.pedido_id
LEFT JOIN clientes c ON c.id = p.cliente_id
WHERE rp.reparto_id = $1
ORDER BY rp.orden;

-- name: DeleteRepartoPedido :exec
DELETE FROM reparto_pedidos
WHERE reparto_id = $1 AND pedido_id = $2;

-- name: CreateEventoReparto :one
INSERT INTO eventos_reparto (
    reparto_id, pedido_id, tipo, latitud, longitud, comentario,
    monto_cobrado, empleado_id, firma_url
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: ListEventosReparto :many
SELECT er.*,
       p.numero AS pedido_numero,
       e.nombre AS empleado_nombre
FROM eventos_reparto er
LEFT JOIN pedidos p ON p.id = er.pedido_id
LEFT JOIN empleados e ON e.id = er.empleado_id
WHERE er.reparto_id = $1
ORDER BY er.created_at;
