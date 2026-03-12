-- name: CreateArqueoCaja :one
INSERT INTO arqueos_caja (caja_id, monto_sistema, monto_fisico, diferencia, estado, observaciones, desglose, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListArqueosByCaja :many
SELECT * FROM arqueos_caja
WHERE caja_id = $1 AND usuario_id = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: CountArqueosByCaja :one
SELECT COUNT(*) FROM arqueos_caja
WHERE caja_id = $1 AND usuario_id = $2;

-- name: UpdateArqueoEstado :one
UPDATE arqueos_caja
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
RETURNING *;
