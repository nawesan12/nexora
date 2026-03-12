-- name: CreateConfiguracionImpuesto :one
INSERT INTO configuracion_impuestos (
  nombre, tipo, porcentaje, aplicar_por_defecto, usuario_id
) VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetConfiguracionImpuesto :one
SELECT * FROM configuracion_impuestos
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListConfiguracionImpuestos :many
SELECT * FROM configuracion_impuestos
WHERE usuario_id = $1 AND active = TRUE
ORDER BY tipo, nombre;

-- name: ListConfiguracionImpuestosDefault :many
SELECT * FROM configuracion_impuestos
WHERE usuario_id = $1 AND active = TRUE AND aplicar_por_defecto = TRUE
ORDER BY tipo, nombre;

-- name: UpdateConfiguracionImpuesto :one
UPDATE configuracion_impuestos
SET nombre = $3, tipo = $4, porcentaje = $5, aplicar_por_defecto = $6, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteConfiguracionImpuesto :exec
UPDATE configuracion_impuestos
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;
