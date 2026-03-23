-- name: CreatePlantilla :one
INSERT INTO plantilla_pedido (nombre, cliente_id, sucursal_id, frecuencia_dias, proximo_generacion, activa, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListPlantillas :many
SELECT pp.*, c.nombre as cliente_nombre, s.nombre as sucursal_nombre
FROM plantilla_pedido pp
LEFT JOIN clientes c ON c.id = pp.cliente_id
LEFT JOIN sucursales s ON s.id = pp.sucursal_id
WHERE pp.usuario_id = $1 AND pp.active = true
ORDER BY pp.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountPlantillas :one
SELECT COUNT(*) FROM plantilla_pedido WHERE usuario_id = $1 AND active = true;

-- name: GetPlantilla :one
SELECT pp.*, c.nombre as cliente_nombre, s.nombre as sucursal_nombre
FROM plantilla_pedido pp
LEFT JOIN clientes c ON c.id = pp.cliente_id
LEFT JOIN sucursales s ON s.id = pp.sucursal_id
WHERE pp.id = $1 AND pp.usuario_id = $2 AND pp.active = true;

-- name: UpdatePlantilla :one
UPDATE plantilla_pedido
SET nombre = $1, cliente_id = $2, sucursal_id = $3, frecuencia_dias = $4,
    proximo_generacion = $5, activa = $6, updated_at = NOW()
WHERE id = $7 AND usuario_id = $8 AND active = true
RETURNING *;

-- name: SoftDeletePlantilla :exec
UPDATE plantilla_pedido SET active = false, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: CreateDetallePlantilla :one
INSERT INTO detalle_plantilla_pedido (plantilla_id, producto_id, cantidad, precio)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListDetallePlantilla :many
SELECT dpp.*, p.nombre as producto_nombre, p.codigo as producto_codigo, p.unidad as producto_unidad
FROM detalle_plantilla_pedido dpp
LEFT JOIN productos p ON p.id = dpp.producto_id
WHERE dpp.plantilla_id = $1
ORDER BY dpp.id;

-- name: DeleteDetallePlantillaByPlantilla :exec
DELETE FROM detalle_plantilla_pedido WHERE plantilla_id = $1;
