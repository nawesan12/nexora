-- name: CreateEmployee :one
INSERT INTO empleados (nombre, apellido, email, cuil, access_code, rol, sucursal_id, usuario_id,
  telefono, fecha_ingreso, fecha_egreso, estado, dni, direccion, salario_base,
  observaciones, tipo_contrato, obra_social, numero_legajo, banco, cbu)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
RETURNING *;

-- name: GetEmployeeByAccessCode :one
SELECT e.*, s.nombre AS sucursal_nombre, u.email AS owner_email
FROM empleados e
JOIN sucursales s ON s.id = e.sucursal_id
JOIN usuarios u ON u.id = e.usuario_id
WHERE e.access_code = $1 AND e.active = TRUE;

-- name: ListEmployeeBranches :many
SELECT s.id, s.nombre, s.direccion
FROM empleado_sucursales es
JOIN sucursales s ON s.id = es.sucursal_id
WHERE es.empleado_id = $1 AND s.active = TRUE;

-- name: CreateEmployeeBranch :exec
INSERT INTO empleado_sucursales (empleado_id, sucursal_id)
VALUES ($1, $2)
ON CONFLICT (empleado_id, sucursal_id) DO NOTHING;

-- name: GetEmployeeByID :one
SELECT * FROM empleados
WHERE id = $1 AND usuario_id = $2 AND active = TRUE;

-- name: ListEmployees :many
SELECT * FROM empleados
WHERE usuario_id = $1 AND active = TRUE
ORDER BY apellido, nombre
LIMIT $2 OFFSET $3;

-- name: CountEmployees :one
SELECT COUNT(*) FROM empleados
WHERE usuario_id = $1 AND active = TRUE;

-- name: SearchEmployees :many
SELECT * FROM empleados
WHERE usuario_id = $1 AND active = TRUE
  AND (nombre ILIKE $2 OR apellido ILIKE $2 OR email ILIKE $2 OR cuil ILIKE $2)
ORDER BY apellido, nombre
LIMIT $3 OFFSET $4;

-- name: CountSearchEmployees :one
SELECT COUNT(*) FROM empleados
WHERE usuario_id = $1 AND active = TRUE
  AND (nombre ILIKE $2 OR apellido ILIKE $2 OR email ILIKE $2 OR cuil ILIKE $2);

-- name: ListEmployeesByRol :many
SELECT * FROM empleados
WHERE usuario_id = $1 AND rol = $2 AND active = TRUE
ORDER BY apellido, nombre
LIMIT $3 OFFSET $4;

-- name: CountEmployeesByRol :one
SELECT COUNT(*) FROM empleados
WHERE usuario_id = $1 AND rol = $2 AND active = TRUE;

-- name: ListEmployeesBySucursal :many
SELECT * FROM empleados
WHERE usuario_id = $1 AND sucursal_id = $2 AND active = TRUE
ORDER BY apellido, nombre
LIMIT $3 OFFSET $4;

-- name: CountEmployeesBySucursal :one
SELECT COUNT(*) FROM empleados
WHERE usuario_id = $1 AND sucursal_id = $2 AND active = TRUE;

-- name: ListEmployeesByEstado :many
SELECT * FROM empleados
WHERE usuario_id = $1 AND estado = $2 AND active = TRUE
ORDER BY apellido, nombre
LIMIT $3 OFFSET $4;

-- name: CountEmployeesByEstado :one
SELECT COUNT(*) FROM empleados
WHERE usuario_id = $1 AND estado = $2 AND active = TRUE;

-- name: UpdateEmployee :one
UPDATE empleados
SET nombre = $3, apellido = $4, email = $5, cuil = $6,
    rol = $7, sucursal_id = $8,
    telefono = $9, fecha_ingreso = $10, fecha_egreso = $11, estado = $12,
    dni = $13, direccion = $14, salario_base = $15, observaciones = $16,
    tipo_contrato = $17, obra_social = $18, numero_legajo = $19,
    banco = $20, cbu = $21,
    updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: UpdateEmployeeAccessCode :one
UPDATE empleados
SET access_code = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: BulkUpdateEmployeeEstado :exec
UPDATE empleados
SET estado = $3, updated_at = NOW()
WHERE id = ANY($1::uuid[]) AND usuario_id = $2 AND active = TRUE;

-- name: BulkUpdateEmployeeRol :exec
UPDATE empleados
SET rol = $3, updated_at = NOW()
WHERE id = ANY($1::uuid[]) AND usuario_id = $2 AND active = TRUE;

-- name: ListEmployeesForExport :many
SELECT * FROM empleados
WHERE usuario_id = $1 AND active = TRUE
ORDER BY apellido, nombre;

-- name: SoftDeleteEmployee :exec
UPDATE empleados
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: GetEmployeeByEmail :one
SELECT * FROM empleados
WHERE email = $1 AND usuario_id = $2 AND active = TRUE;

-- name: DeleteEmployeeBranches :exec
DELETE FROM empleado_sucursales
WHERE empleado_id = $1;
