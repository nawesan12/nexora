-- name: CreateTask :one
INSERT INTO tasks (titulo, descripcion, prioridad, estado, asignado_a, fecha_limite, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetTaskByID :one
SELECT t.*,
       e.nombre || ' ' || e.apellido AS asignado_nombre
FROM tasks t
LEFT JOIN empleados e ON e.id = t.asignado_a
WHERE t.id = $1 AND t.usuario_id = $2 AND t.active = TRUE;

-- name: ListTasks :many
SELECT t.*,
       e.nombre || ' ' || e.apellido AS asignado_nombre
FROM tasks t
LEFT JOIN empleados e ON e.id = t.asignado_a
WHERE t.usuario_id = $1 AND t.active = TRUE
ORDER BY
  CASE t.prioridad
    WHEN 'URGENTE' THEN 1
    WHEN 'ALTA' THEN 2
    WHEN 'MEDIA' THEN 3
    WHEN 'BAJA' THEN 4
  END,
  t.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountTasks :one
SELECT COUNT(*) FROM tasks
WHERE usuario_id = $1 AND active = TRUE;

-- name: UpdateTask :one
UPDATE tasks
SET titulo = $3, descripcion = $4, prioridad = $5, estado = $6,
    asignado_a = $7, fecha_limite = $8, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING *;

-- name: SoftDeleteTask :exec
UPDATE tasks
SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2;

-- name: ListTaskComments :many
SELECT tc.*,
       u.nombre || ' ' || u.apellido AS usuario_nombre
FROM task_comments tc
JOIN usuarios u ON u.id = tc.usuario_id
WHERE tc.task_id = $1
ORDER BY tc.created_at ASC;

-- name: CreateTaskComment :one
INSERT INTO task_comments (task_id, contenido, usuario_id)
VALUES ($1, $2, $3)
RETURNING *;
