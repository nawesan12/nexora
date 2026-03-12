-- name: CreateZona :one
INSERT INTO zonas (nombre, descripcion, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetZonaByID :one
SELECT z.*, s.nombre AS sucursal_nombre
FROM zonas z
LEFT JOIN sucursales s ON s.id = z.sucursal_id
WHERE z.id = $1 AND z.usuario_id = $2 AND z.active = TRUE;

-- name: ListZonas :many
SELECT z.*, s.nombre AS sucursal_nombre
FROM zonas z
LEFT JOIN sucursales s ON s.id = z.sucursal_id
WHERE z.usuario_id = $1 AND z.active = TRUE
ORDER BY z.nombre
LIMIT $2 OFFSET $3;

-- name: CountZonas :one
SELECT COUNT(*) FROM zonas
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListZonasBySucursal :many
SELECT z.*, s.nombre AS sucursal_nombre
FROM zonas z
LEFT JOIN sucursales s ON s.id = z.sucursal_id
WHERE z.usuario_id = $1 AND z.sucursal_id = $2 AND z.active = TRUE
ORDER BY z.nombre;

-- name: UpdateZona :one
UPDATE zonas
SET nombre = $3, descripcion = $4, sucursal_id = $5, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteZona :exec
UPDATE zonas
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
