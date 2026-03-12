-- name: CreateAfipConfig :one
INSERT INTO afip_config (sucursal_id, cuit, punto_venta, certificado_pem, clave_privada_pem, modo, activo, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetAfipConfigBySucursal :one
SELECT ac.*, s.nombre AS sucursal_nombre
FROM afip_config ac
JOIN sucursales s ON s.id = ac.sucursal_id
WHERE ac.sucursal_id = $1 AND ac.usuario_id = $2;

-- name: UpdateAfipConfig :one
UPDATE afip_config
SET cuit = $3, punto_venta = $4, certificado_pem = $5, clave_privada_pem = $6, modo = $7, activo = $8, updated_at = NOW()
WHERE sucursal_id = $1 AND usuario_id = $2
RETURNING *;

-- name: UpdateAfipToken :exec
UPDATE afip_config
SET token = $3, sign = $4, token_expiracion = $5, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: ListAfipConfigs :many
SELECT ac.*, s.nombre AS sucursal_nombre
FROM afip_config ac
JOIN sucursales s ON s.id = ac.sucursal_id
WHERE ac.usuario_id = $1
ORDER BY s.nombre;

-- name: DeleteAfipConfig :exec
DELETE FROM afip_config WHERE sucursal_id = $1 AND usuario_id = $2;

-- name: UpdateComprobanteAfipEstado :exec
UPDATE comprobantes SET afip_estado = $2::afip_estado WHERE id = $1;
