-- name: CreateUser :one
INSERT INTO usuarios (email, password_hash, nombre, apellido, rol)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM usuarios WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM usuarios WHERE id = $1;

-- name: UpdateUserEmailVerified :exec
UPDATE usuarios SET email_verified = TRUE, updated_at = NOW() WHERE email = $1;

-- name: UpdateUserPassword :exec
UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE email = $2;
