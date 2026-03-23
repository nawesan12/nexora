-- name: CreateRuta :one
INSERT INTO rutas (nombre, zona_id, vehiculo_id, dia_semana, hora_salida_estimada, notas, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetRutaByID :one
SELECT r.*,
       z.nombre AS zona_nombre,
       v.patente AS vehiculo_patente,
       v.marca || ' ' || v.modelo AS vehiculo_descripcion,
       s.nombre AS sucursal_nombre
FROM rutas r
LEFT JOIN zonas z ON z.id = r.zona_id
LEFT JOIN vehiculos v ON v.id = r.vehiculo_id
JOIN sucursales s ON s.id = r.sucursal_id
WHERE r.id = $1 AND r.usuario_id = $2 AND r.active = TRUE;

-- name: ListRutas :many
SELECT r.*,
       z.nombre AS zona_nombre,
       v.patente AS vehiculo_patente,
       s.nombre AS sucursal_nombre,
       (SELECT COUNT(*) FROM ruta_paradas rp WHERE rp.ruta_id = r.id) AS paradas_count
FROM rutas r
LEFT JOIN zonas z ON z.id = r.zona_id
LEFT JOIN vehiculos v ON v.id = r.vehiculo_id
JOIN sucursales s ON s.id = r.sucursal_id
WHERE r.usuario_id = $1 AND r.active = TRUE
ORDER BY r.nombre
LIMIT $2 OFFSET $3;

-- name: CountRutas :one
SELECT COUNT(*) FROM rutas
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdateRuta :one
UPDATE rutas
SET nombre = $3, zona_id = $4, vehiculo_id = $5, dia_semana = $6,
    hora_salida_estimada = $7, notas = $8, sucursal_id = $9, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteRuta :exec
UPDATE rutas
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: CreateRutaParada :one
INSERT INTO ruta_paradas (ruta_id, cliente_id, direccion_id, orden, tiempo_estimado_minutos, notas)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListRutaParadas :many
SELECT rp.*,
       c.nombre AS cliente_nombre,
       c.apellido AS cliente_apellido,
       d.calle AS direccion_calle,
       d.numero AS direccion_numero,
       d.ciudad AS direccion_ciudad
FROM ruta_paradas rp
JOIN clientes c ON c.id = rp.cliente_id
LEFT JOIN direcciones d ON d.id = rp.direccion_id
WHERE rp.ruta_id = $1
ORDER BY rp.orden;

-- name: DeleteRutaParadasByRuta :exec
DELETE FROM ruta_paradas WHERE ruta_id = $1;

-- name: ListPendingPedidosByCliente :many
SELECT p.id, p.numero, p.total, p.estado, p.fecha_pedido,
       c.nombre AS cliente_nombre
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
WHERE p.cliente_id = $1 AND p.usuario_id = $2
  AND p.active = TRUE
  AND p.estado IN ('APROBADO', 'EN_PREPARACION', 'PREPARADO')
ORDER BY p.fecha_pedido;

-- name: ListCatalogoForExport :many
SELECT cp.precio, cp.stock,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo,
       p.unidad AS producto_unidad,
       p.precio_base AS producto_precio_base,
       f.nombre AS familia_nombre,
       cat.nombre AS categoria_nombre,
       s.nombre AS sucursal_nombre
FROM catalogo_productos cp
JOIN productos p ON p.id = cp.producto_id
LEFT JOIN categorias_producto cat ON cat.id = p.categoria_id
LEFT JOIN familias_producto f ON f.id = cat.familia_id
JOIN sucursales s ON s.id = cp.sucursal_id
WHERE cp.sucursal_id = $1 AND cp.active = TRUE AND p.active = TRUE
ORDER BY f.nombre, cat.nombre, p.nombre;
