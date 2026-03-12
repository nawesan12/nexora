-- name: CreateDireccion :one
INSERT INTO direcciones (cliente_id, calle, numero, piso, departamento, ciudad, provincia, codigo_postal, latitud, longitud, principal)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetDireccionByID :one
SELECT * FROM direcciones
WHERE id = $1;

-- name: ListDireccionesByCliente :many
SELECT * FROM direcciones
WHERE cliente_id = $1
ORDER BY principal DESC, created_at;

-- name: UpdateDireccion :one
UPDATE direcciones
SET calle = $2, numero = $3, piso = $4, departamento = $5,
    ciudad = $6, provincia = $7, codigo_postal = $8,
    latitud = $9, longitud = $10, principal = $11,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteDireccion :exec
DELETE FROM direcciones
WHERE id = $1;

-- name: UnsetDireccionesPrincipal :exec
UPDATE direcciones
SET principal = FALSE, updated_at = NOW()
WHERE cliente_id = $1;

-- name: SetDireccionPrincipal :exec
UPDATE direcciones
SET principal = TRUE, updated_at = NOW()
WHERE id = $1;

-- name: CountDireccionesByCliente :one
SELECT COUNT(*) FROM direcciones
WHERE cliente_id = $1;
