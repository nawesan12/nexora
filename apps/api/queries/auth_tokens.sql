-- name: CreatePasswordResetToken :one
INSERT INTO password_reset_tokens (email, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetPasswordResetToken :one
SELECT * FROM password_reset_tokens
WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW();

-- name: MarkPasswordResetTokenUsed :exec
UPDATE password_reset_tokens SET used = TRUE WHERE id = $1;

-- name: CreateEmailVerificationToken :one
INSERT INTO email_verification_tokens (email, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetEmailVerificationToken :one
SELECT * FROM email_verification_tokens
WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW();

-- name: MarkEmailVerificationTokenUsed :exec
UPDATE email_verification_tokens SET used = TRUE WHERE id = $1;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetRefreshToken :one
SELECT * FROM refresh_tokens
WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW();

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1;

-- name: RevokeAllUserRefreshTokens :exec
UPDATE refresh_tokens SET revoked = TRUE WHERE usuario_id = $1;
