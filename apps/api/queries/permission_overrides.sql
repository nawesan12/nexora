-- name: ListPermissionOverridesByUser :many
SELECT * FROM permission_overrides
WHERE usuario_id = $1
ORDER BY rol, permission;

-- name: ListPermissionOverridesByUserAndRole :many
SELECT * FROM permission_overrides
WHERE usuario_id = $1 AND rol = $2
ORDER BY permission;

-- name: UpsertPermissionOverride :one
INSERT INTO permission_overrides (rol, permission, granted, usuario_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (rol, permission, usuario_id)
DO UPDATE SET granted = $3, updated_at = NOW()
RETURNING *;

-- name: DeletePermissionOverride :exec
DELETE FROM permission_overrides
WHERE rol = $1 AND permission = $2 AND usuario_id = $3;

-- name: DeleteAllPermissionOverridesForRole :exec
DELETE FROM permission_overrides
WHERE rol = $1 AND usuario_id = $2;
