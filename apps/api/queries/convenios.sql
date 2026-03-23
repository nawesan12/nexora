-- name: CreateConvenio :one
INSERT INTO convenios_proveedor (proveedor_id, nombre, fecha_inicio, fecha_fin, activo, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetConvenioByID :one
SELECT cp.*,
       p.nombre AS proveedor_nombre
FROM convenios_proveedor cp
JOIN proveedores p ON p.id = cp.proveedor_id
WHERE cp.id = $1 AND cp.usuario_id = $2 AND cp.active = TRUE;

-- name: ListConvenios :many
SELECT cp.*,
       p.nombre AS proveedor_nombre
FROM convenios_proveedor cp
JOIN proveedores p ON p.id = cp.proveedor_id
WHERE cp.usuario_id = $1 AND cp.active = TRUE
ORDER BY cp.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountConvenios :one
SELECT COUNT(*) FROM convenios_proveedor
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdateConvenio :one
UPDATE convenios_proveedor
SET nombre = $3, fecha_inicio = $4, fecha_fin = $5, activo = $6
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteConvenio :exec
UPDATE convenios_proveedor
SET active = FALSE
WHERE id = $1 AND usuario_id = $2;

-- name: CreateDetalleConvenio :one
INSERT INTO detalle_convenio (convenio_id, producto_id, precio_convenido, cantidad_minima, descuento_porcentaje)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListDetalleConvenio :many
SELECT dc.*,
       p.nombre AS producto_nombre,
       p.codigo AS producto_codigo
FROM detalle_convenio dc
JOIN productos p ON p.id = dc.producto_id
WHERE dc.convenio_id = $1;

-- name: DeleteDetallesByConvenio :exec
DELETE FROM detalle_convenio WHERE convenio_id = $1;
