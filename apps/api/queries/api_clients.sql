-- name: CreateApiClient :one
INSERT INTO api_clients (nombre, api_key, api_secret_hash, cors_origins, usuario_id)
VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- name: ListApiClients :many
SELECT id, nombre, api_key, cors_origins, activo, last_used_at, created_at, updated_at
FROM api_clients WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: CountApiClients :one
SELECT COUNT(*) FROM api_clients WHERE usuario_id = $1;

-- name: GetApiClient :one
SELECT * FROM api_clients WHERE id = $1 AND usuario_id = $2;

-- name: GetApiClientByKey :one
SELECT * FROM api_clients WHERE api_key = $1 AND activo = true;

-- name: UpdateApiClient :one
UPDATE api_clients SET nombre = $1, cors_origins = $2, activo = $3, updated_at = NOW()
WHERE id = $4 AND usuario_id = $5 RETURNING *;

-- name: DeleteApiClient :exec
DELETE FROM api_clients WHERE id = $1 AND usuario_id = $2;

-- name: UpdateApiClientLastUsed :exec
UPDATE api_clients SET last_used_at = NOW() WHERE id = $1;

-- name: RotateApiSecret :one
UPDATE api_clients SET api_secret_hash = $1, updated_at = NOW()
WHERE id = $2 AND usuario_id = $3 RETURNING *;
