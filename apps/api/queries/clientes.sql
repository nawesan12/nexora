-- name: CreateCliente :one
INSERT INTO clientes (nombre, apellido, razon_social, cuit, condicion_iva, email, telefono, reputacion, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetClienteByID :one
SELECT * FROM clientes
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListClientes :many
SELECT * FROM clientes
WHERE usuario_id = $1 AND active = TRUE
ORDER BY apellido, nombre
LIMIT $2 OFFSET $3;

-- name: CountClientes :one
SELECT COUNT(*) FROM clientes
WHERE usuario_id = $1 AND active = TRUE;

-- name: SearchClientes :many
SELECT * FROM clientes
WHERE usuario_id = $1 AND active = TRUE
  AND (nombre ILIKE $2 OR apellido ILIKE $2 OR razon_social ILIKE $2 OR cuit ILIKE $2)
ORDER BY apellido, nombre
LIMIT $3 OFFSET $4;

-- name: CountSearchClientes :one
SELECT COUNT(*) FROM clientes
WHERE usuario_id = $1 AND active = TRUE
  AND (nombre ILIKE $2 OR apellido ILIKE $2 OR razon_social ILIKE $2 OR cuit ILIKE $2);

-- name: ListClientesByReputacion :many
SELECT * FROM clientes
WHERE usuario_id = $1 AND reputacion = $2 AND active = TRUE
ORDER BY apellido, nombre
LIMIT $3 OFFSET $4;

-- name: CountClientesByReputacion :one
SELECT COUNT(*) FROM clientes
WHERE usuario_id = $1 AND reputacion = $2 AND active = TRUE;

-- name: ListClientesByCondicionIVA :many
SELECT * FROM clientes
WHERE usuario_id = $1 AND condicion_iva = $2 AND active = TRUE
ORDER BY apellido, nombre
LIMIT $3 OFFSET $4;

-- name: CountClientesByCondicionIVA :one
SELECT COUNT(*) FROM clientes
WHERE usuario_id = $1 AND condicion_iva = $2 AND active = TRUE;

-- name: UpdateCliente :one
UPDATE clientes
SET nombre = $3, apellido = $4, razon_social = $5, cuit = $6,
    condicion_iva = $7, email = $8, telefono = $9, reputacion = $10,
    updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteCliente :exec
UPDATE clientes
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: GetClienteByCuit :one
SELECT * FROM clientes
WHERE cuit = $1 AND usuario_id = $2 AND active = TRUE;
