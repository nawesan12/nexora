-- name: CreateProveedor :one
INSERT INTO proveedores (nombre, cuit, condicion_iva, email, telefono, direccion, contacto, banco, cbu, alias, notas, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: GetProveedorByID :one
SELECT * FROM proveedores
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: UpdateProveedor :one
UPDATE proveedores SET
  nombre = $3,
  cuit = $4,
  condicion_iva = $5,
  email = $6,
  telefono = $7,
  direccion = $8,
  contacto = $9,
  banco = $10,
  cbu = $11,
  alias = $12,
  notas = $13,
  updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteProveedor :exec
UPDATE proveedores SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListProveedores :many
SELECT * FROM proveedores
WHERE usuario_id = $1 AND active = TRUE
ORDER BY nombre ASC
LIMIT $2 OFFSET $3;

-- name: CountProveedores :one
SELECT COUNT(*) FROM proveedores
WHERE usuario_id = $1 AND active = TRUE;

-- name: SearchProveedores :many
SELECT * FROM proveedores
WHERE usuario_id = $1 AND active = TRUE
  AND (nombre ILIKE $2 OR COALESCE(cuit, '') ILIKE $2)
ORDER BY nombre ASC
LIMIT $3 OFFSET $4;

-- name: CountSearchProveedores :one
SELECT COUNT(*) FROM proveedores
WHERE usuario_id = $1 AND active = TRUE
  AND (nombre ILIKE $2 OR COALESCE(cuit, '') ILIKE $2);

-- name: GetProveedorByCuit :one
SELECT * FROM proveedores
WHERE cuit = $1 AND usuario_id = $2 AND active = TRUE;
