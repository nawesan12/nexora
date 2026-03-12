-- name: CreateUserSettings :one
INSERT INTO user_settings (usuario_id)
VALUES ($1)
RETURNING *;

-- name: GetUserSettings :one
SELECT * FROM user_settings WHERE usuario_id = $1;
