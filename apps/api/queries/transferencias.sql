-- name: NextTransferenciaNumero :one
SELECT 'TR-' || LPAD(nextval('transferencia_numero_seq')::text, 6, '0');

-- name: CreateTransferencia :one
INSERT INTO transferencias_sucursal (
    numero, sucursal_origen_id, sucursal_destino_id, observaciones,
    solicitado_por, usuario_id
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetTransferenciaByID :one
SELECT t.*,
       so.nombre AS sucursal_origen_nombre,
       sd.nombre AS sucursal_destino_nombre,
       es.nombre AS solicitado_por_nombre,
       ea.nombre AS aprobado_por_nombre
FROM transferencias_sucursal t
JOIN sucursales so ON so.id = t.sucursal_origen_id
JOIN sucursales sd ON sd.id = t.sucursal_destino_id
LEFT JOIN empleados es ON es.id = t.solicitado_por
LEFT JOIN empleados ea ON ea.id = t.aprobado_por
WHERE t.id = $1 AND t.usuario_id = $2 AND t.active = TRUE;

-- name: ListTransferencias :many
SELECT t.*,
       so.nombre AS sucursal_origen_nombre,
       sd.nombre AS sucursal_destino_nombre,
       (SELECT COUNT(*) FROM items_transferencia it WHERE it.transferencia_id = t.id) AS items_count
FROM transferencias_sucursal t
JOIN sucursales so ON so.id = t.sucursal_origen_id
JOIN sucursales sd ON sd.id = t.sucursal_destino_id
WHERE t.usuario_id = $1 AND t.active = TRUE
ORDER BY t.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountTransferencias :one
SELECT COUNT(*) FROM transferencias_sucursal
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListTransferenciasByEstado :many
SELECT t.*,
       so.nombre AS sucursal_origen_nombre,
       sd.nombre AS sucursal_destino_nombre,
       (SELECT COUNT(*) FROM items_transferencia it WHERE it.transferencia_id = t.id) AS items_count
FROM transferencias_sucursal t
JOIN sucursales so ON so.id = t.sucursal_origen_id
JOIN sucursales sd ON sd.id = t.sucursal_destino_id
WHERE t.usuario_id = $1 AND t.active = TRUE AND t.estado = $2
ORDER BY t.created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountTransferenciasByEstado :one
SELECT COUNT(*) FROM transferencias_sucursal
WHERE usuario_id = $1 AND active = TRUE AND estado = $2;

-- name: UpdateTransferenciaEstado :exec
UPDATE transferencias_sucursal
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: UpdateTransferenciaAprobacion :exec
UPDATE transferencias_sucursal
SET estado = 'APROBADA', fecha_aprobacion = NOW(), aprobado_por = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: UpdateTransferenciaEnvio :exec
UPDATE transferencias_sucursal
SET estado = 'EN_TRANSITO', fecha_envio = NOW(), updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: UpdateTransferenciaRecepcion :exec
UPDATE transferencias_sucursal
SET estado = 'COMPLETADA', fecha_recepcion = NOW(), updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: ListItemsTransferenciaSimple :many
SELECT id, producto_id, producto_nombre, producto_codigo,
       cantidad_solicitada, cantidad_enviada, cantidad_recibida
FROM items_transferencia
WHERE transferencia_id = $1;

-- name: SoftDeleteTransferencia :exec
UPDATE transferencias_sucursal
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: CreateItemTransferencia :one
INSERT INTO items_transferencia (
    transferencia_id, producto_id, producto_nombre, producto_codigo, cantidad_solicitada
) VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListItemsTransferencia :many
SELECT * FROM items_transferencia
WHERE transferencia_id = $1
ORDER BY producto_nombre;

-- name: UpdateItemEnviado :exec
UPDATE items_transferencia
SET cantidad_enviada = $2
WHERE id = $1;

-- name: UpdateItemRecibido :exec
UPDATE items_transferencia
SET cantidad_recibida = $2
WHERE id = $1;
