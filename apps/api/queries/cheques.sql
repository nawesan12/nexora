-- name: CreateCheque :one
INSERT INTO cheques (numero, monto, fecha_emision, fecha_vencimiento, estado, banco, emisor, receptor, entidad_bancaria_id, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: GetChequeByID :one
SELECT * FROM cheques
WHERE id = $1 AND usuario_id = $2;

-- name: ListCheques :many
SELECT * FROM cheques
WHERE usuario_id = $1
ORDER BY fecha_vencimiento DESC
LIMIT $2 OFFSET $3;

-- name: CountCheques :one
SELECT COUNT(*) FROM cheques
WHERE usuario_id = $1;

-- name: ListChequesByEstado :many
SELECT * FROM cheques
WHERE usuario_id = $1 AND estado = $2
ORDER BY fecha_vencimiento DESC
LIMIT $3 OFFSET $4;

-- name: CountChequesByEstado :one
SELECT COUNT(*) FROM cheques
WHERE usuario_id = $1 AND estado = $2;

-- name: UpdateCheque :one
UPDATE cheques
SET numero = $3, monto = $4, fecha_emision = $5, fecha_vencimiento = $6,
    banco = $7, emisor = $8, receptor = $9, entidad_bancaria_id = $10,
    updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
RETURNING *;

-- name: UpdateChequeEstado :one
UPDATE cheques
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
RETURNING *;

-- name: SearchCheques :many
SELECT * FROM cheques
WHERE usuario_id = $1
  AND (numero ILIKE $2 OR banco ILIKE $2 OR emisor ILIKE $2 OR receptor ILIKE $2)
ORDER BY fecha_vencimiento DESC
LIMIT $3 OFFSET $4;

-- name: CountSearchCheques :one
SELECT COUNT(*) FROM cheques
WHERE usuario_id = $1
  AND (numero ILIKE $2 OR banco ILIKE $2 OR emisor ILIKE $2 OR receptor ILIKE $2);
