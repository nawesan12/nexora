-- name: CreateVehiculo :one
INSERT INTO vehiculos (marca, modelo, patente, anio, capacidad_kg, capacidad_volumen, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetVehiculoByID :one
SELECT v.*, s.nombre AS sucursal_nombre
FROM vehiculos v
LEFT JOIN sucursales s ON s.id = v.sucursal_id
WHERE v.id = $1 AND v.usuario_id = $2 AND v.active = TRUE;

-- name: ListVehiculos :many
SELECT v.*, s.nombre AS sucursal_nombre
FROM vehiculos v
LEFT JOIN sucursales s ON s.id = v.sucursal_id
WHERE v.usuario_id = $1 AND v.active = TRUE
ORDER BY v.patente
LIMIT $2 OFFSET $3;

-- name: CountVehiculos :one
SELECT COUNT(*) FROM vehiculos
WHERE usuario_id = $1 AND active = TRUE;

-- name: ListVehiculosBySucursal :many
SELECT v.*, s.nombre AS sucursal_nombre
FROM vehiculos v
LEFT JOIN sucursales s ON s.id = v.sucursal_id
WHERE v.usuario_id = $1 AND v.sucursal_id = $2 AND v.active = TRUE
ORDER BY v.patente;

-- name: UpdateVehiculo :one
UPDATE vehiculos
SET marca = $3, modelo = $4, patente = $5, anio = $6,
    capacidad_kg = $7, capacidad_volumen = $8, sucursal_id = $9, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteVehiculo :exec
UPDATE vehiculos
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
