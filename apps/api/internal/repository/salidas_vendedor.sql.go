package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type SalidaVendedor struct {
	ID            pgtype.UUID        `json:"id"`
	EmpleadoID    pgtype.UUID        `json:"empleado_id"`
	SucursalID    pgtype.UUID        `json:"sucursal_id"`
	Fecha         pgtype.Date        `json:"fecha"`
	HoraSalida    pgtype.Timestamptz `json:"hora_salida"`
	HoraRegreso   pgtype.Timestamptz `json:"hora_regreso"`
	KmInicio      pgtype.Numeric     `json:"km_inicio"`
	KmFin         pgtype.Numeric     `json:"km_fin"`
	KmRecorridos  pgtype.Numeric     `json:"km_recorridos"`
	Estado        string             `json:"estado"`
	Observaciones pgtype.Text        `json:"observaciones"`
	UsuarioID     pgtype.UUID        `json:"usuario_id"`
	Active        bool               `json:"active"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
}

// --- CreateSalidaVendedor ---

const createSalidaVendedor = `-- name: CreateSalidaVendedor :one
INSERT INTO salidas_vendedor (empleado_id, sucursal_id, fecha, hora_salida, km_inicio, estado, observaciones, usuario_id)
VALUES ($1, $2, CURRENT_DATE, NOW(), $3, 'EN_CAMPO', $4, $5)
RETURNING id, empleado_id, sucursal_id, fecha, hora_salida, hora_regreso, km_inicio, km_fin, km_recorridos, estado, observaciones, usuario_id, active, created_at, updated_at
`

type CreateSalidaVendedorParams struct {
	EmpleadoID    pgtype.UUID    `json:"empleado_id"`
	SucursalID    pgtype.UUID    `json:"sucursal_id"`
	KmInicio      pgtype.Numeric `json:"km_inicio"`
	Observaciones pgtype.Text    `json:"observaciones"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateSalidaVendedor(ctx context.Context, arg CreateSalidaVendedorParams) (SalidaVendedor, error) {
	row := q.db.QueryRow(ctx, createSalidaVendedor,
		arg.EmpleadoID, arg.SucursalID, arg.KmInicio, arg.Observaciones, arg.UsuarioID,
	)
	var i SalidaVendedor
	err := row.Scan(
		&i.ID, &i.EmpleadoID, &i.SucursalID, &i.Fecha,
		&i.HoraSalida, &i.HoraRegreso, &i.KmInicio, &i.KmFin,
		&i.KmRecorridos, &i.Estado, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- GetSalidaByID ---

const getSalidaByID = `-- name: GetSalidaByID :one
SELECT s.id, s.empleado_id, s.sucursal_id, s.fecha, s.hora_salida, s.hora_regreso,
       s.km_inicio, s.km_fin, s.km_recorridos, s.estado, s.observaciones,
       s.usuario_id, s.active, s.created_at, s.updated_at,
       e.nombre || ' ' || e.apellido AS empleado_nombre,
       su.nombre AS sucursal_nombre
FROM salidas_vendedor s
JOIN empleados e ON e.id = s.empleado_id
JOIN sucursales su ON su.id = s.sucursal_id
WHERE s.id = $1 AND s.usuario_id = $2 AND s.active = TRUE
`

type GetSalidaByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type GetSalidaByIDRow struct {
	ID             pgtype.UUID        `json:"id"`
	EmpleadoID     pgtype.UUID        `json:"empleado_id"`
	SucursalID     pgtype.UUID        `json:"sucursal_id"`
	Fecha          pgtype.Date        `json:"fecha"`
	HoraSalida     pgtype.Timestamptz `json:"hora_salida"`
	HoraRegreso    pgtype.Timestamptz `json:"hora_regreso"`
	KmInicio       pgtype.Numeric     `json:"km_inicio"`
	KmFin          pgtype.Numeric     `json:"km_fin"`
	KmRecorridos   pgtype.Numeric     `json:"km_recorridos"`
	Estado         string             `json:"estado"`
	Observaciones  pgtype.Text        `json:"observaciones"`
	UsuarioID      pgtype.UUID        `json:"usuario_id"`
	Active         bool               `json:"active"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
	UpdatedAt      pgtype.Timestamptz `json:"updated_at"`
	EmpleadoNombre string             `json:"empleado_nombre"`
	SucursalNombre string             `json:"sucursal_nombre"`
}

func (q *Queries) GetSalidaByID(ctx context.Context, arg GetSalidaByIDParams) (GetSalidaByIDRow, error) {
	row := q.db.QueryRow(ctx, getSalidaByID, arg.ID, arg.UsuarioID)
	var i GetSalidaByIDRow
	err := row.Scan(
		&i.ID, &i.EmpleadoID, &i.SucursalID, &i.Fecha,
		&i.HoraSalida, &i.HoraRegreso, &i.KmInicio, &i.KmFin,
		&i.KmRecorridos, &i.Estado, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		&i.EmpleadoNombre, &i.SucursalNombre,
	)
	return i, err
}

// --- ListSalidasByFecha ---

const listSalidasByFecha = `-- name: ListSalidasByFecha :many
SELECT s.id, s.empleado_id,
       e.nombre || ' ' || e.apellido AS empleado_nombre,
       su.nombre AS sucursal_nombre,
       s.fecha, s.hora_salida, s.hora_regreso,
       s.km_inicio, s.km_fin, s.km_recorridos,
       s.estado, s.observaciones, s.created_at
FROM salidas_vendedor s
JOIN empleados e ON e.id = s.empleado_id
JOIN sucursales su ON su.id = s.sucursal_id
WHERE s.fecha = $1 AND s.usuario_id = $2 AND s.active = TRUE
ORDER BY s.hora_salida ASC NULLS LAST
LIMIT $3 OFFSET $4
`

type ListSalidasByFechaParams struct {
	Fecha       pgtype.Date `json:"fecha"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

type ListSalidasByFechaRow struct {
	ID             pgtype.UUID        `json:"id"`
	EmpleadoID     pgtype.UUID        `json:"empleado_id"`
	EmpleadoNombre string             `json:"empleado_nombre"`
	SucursalNombre string             `json:"sucursal_nombre"`
	Fecha          pgtype.Date        `json:"fecha"`
	HoraSalida     pgtype.Timestamptz `json:"hora_salida"`
	HoraRegreso    pgtype.Timestamptz `json:"hora_regreso"`
	KmInicio       pgtype.Numeric     `json:"km_inicio"`
	KmFin          pgtype.Numeric     `json:"km_fin"`
	KmRecorridos   pgtype.Numeric     `json:"km_recorridos"`
	Estado         string             `json:"estado"`
	Observaciones  pgtype.Text        `json:"observaciones"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
}

func (q *Queries) ListSalidasByFecha(ctx context.Context, arg ListSalidasByFechaParams) ([]ListSalidasByFechaRow, error) {
	rows, err := q.db.Query(ctx, listSalidasByFecha,
		arg.Fecha, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListSalidasByFechaRow
	for rows.Next() {
		var i ListSalidasByFechaRow
		if err := rows.Scan(
			&i.ID, &i.EmpleadoID, &i.EmpleadoNombre, &i.SucursalNombre,
			&i.Fecha, &i.HoraSalida, &i.HoraRegreso,
			&i.KmInicio, &i.KmFin, &i.KmRecorridos,
			&i.Estado, &i.Observaciones, &i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- CountSalidasByFecha ---

const countSalidasByFecha = `-- name: CountSalidasByFecha :one
SELECT COUNT(*) FROM salidas_vendedor
WHERE fecha = $1 AND usuario_id = $2 AND active = TRUE
`

type CountSalidasByFechaParams struct {
	Fecha     pgtype.Date `json:"fecha"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CountSalidasByFecha(ctx context.Context, arg CountSalidasByFechaParams) (int64, error) {
	row := q.db.QueryRow(ctx, countSalidasByFecha, arg.Fecha, arg.UsuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

// --- ListSalidasByEmpleado ---

const listSalidasByEmpleado = `-- name: ListSalidasByEmpleado :many
SELECT s.id, s.empleado_id,
       e.nombre || ' ' || e.apellido AS empleado_nombre,
       su.nombre AS sucursal_nombre,
       s.fecha, s.hora_salida, s.hora_regreso,
       s.km_inicio, s.km_fin, s.km_recorridos,
       s.estado, s.observaciones, s.created_at
FROM salidas_vendedor s
JOIN empleados e ON e.id = s.empleado_id
JOIN sucursales su ON su.id = s.sucursal_id
WHERE s.empleado_id = $1 AND s.usuario_id = $2 AND s.active = TRUE
ORDER BY s.fecha DESC, s.hora_salida DESC
LIMIT $3 OFFSET $4
`

type ListSalidasByEmpleadoParams struct {
	EmpleadoID  pgtype.UUID `json:"empleado_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListSalidasByEmpleado(ctx context.Context, arg ListSalidasByEmpleadoParams) ([]ListSalidasByFechaRow, error) {
	rows, err := q.db.Query(ctx, listSalidasByEmpleado,
		arg.EmpleadoID, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListSalidasByFechaRow
	for rows.Next() {
		var i ListSalidasByFechaRow
		if err := rows.Scan(
			&i.ID, &i.EmpleadoID, &i.EmpleadoNombre, &i.SucursalNombre,
			&i.Fecha, &i.HoraSalida, &i.HoraRegreso,
			&i.KmInicio, &i.KmFin, &i.KmRecorridos,
			&i.Estado, &i.Observaciones, &i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- CountSalidasByEmpleado ---

const countSalidasByEmpleado = `-- name: CountSalidasByEmpleado :one
SELECT COUNT(*) FROM salidas_vendedor
WHERE empleado_id = $1 AND usuario_id = $2 AND active = TRUE
`

type CountSalidasByEmpleadoParams struct {
	EmpleadoID pgtype.UUID `json:"empleado_id"`
	UsuarioID  pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CountSalidasByEmpleado(ctx context.Context, arg CountSalidasByEmpleadoParams) (int64, error) {
	row := q.db.QueryRow(ctx, countSalidasByEmpleado, arg.EmpleadoID, arg.UsuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

// --- UpdateSalidaRegreso ---

const updateSalidaRegreso = `-- name: UpdateSalidaRegreso :one
UPDATE salidas_vendedor
SET hora_regreso = NOW(), km_fin = $3, estado = 'REGRESADO', observaciones = COALESCE(NULLIF($4, ''), observaciones), updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE AND estado = 'EN_CAMPO'
RETURNING id, empleado_id, sucursal_id, fecha, hora_salida, hora_regreso, km_inicio, km_fin, km_recorridos, estado, observaciones, usuario_id, active, created_at, updated_at
`

type UpdateSalidaRegresoParams struct {
	ID            pgtype.UUID    `json:"id"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
	KmFin         pgtype.Numeric `json:"km_fin"`
	Observaciones pgtype.Text    `json:"observaciones"`
}

func (q *Queries) UpdateSalidaRegreso(ctx context.Context, arg UpdateSalidaRegresoParams) (SalidaVendedor, error) {
	row := q.db.QueryRow(ctx, updateSalidaRegreso,
		arg.ID, arg.UsuarioID, arg.KmFin, arg.Observaciones,
	)
	var i SalidaVendedor
	err := row.Scan(
		&i.ID, &i.EmpleadoID, &i.SucursalID, &i.Fecha,
		&i.HoraSalida, &i.HoraRegreso, &i.KmInicio, &i.KmFin,
		&i.KmRecorridos, &i.Estado, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- UpdateSalidaEstado ---

const updateSalidaEstado = `-- name: UpdateSalidaEstado :one
UPDATE salidas_vendedor
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, empleado_id, sucursal_id, fecha, hora_salida, hora_regreso, km_inicio, km_fin, km_recorridos, estado, observaciones, usuario_id, active, created_at, updated_at
`

type UpdateSalidaEstadoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Estado    string      `json:"estado"`
}

func (q *Queries) UpdateSalidaEstado(ctx context.Context, arg UpdateSalidaEstadoParams) (SalidaVendedor, error) {
	row := q.db.QueryRow(ctx, updateSalidaEstado,
		arg.ID, arg.UsuarioID, arg.Estado,
	)
	var i SalidaVendedor
	err := row.Scan(
		&i.ID, &i.EmpleadoID, &i.SucursalID, &i.Fecha,
		&i.HoraSalida, &i.HoraRegreso, &i.KmInicio, &i.KmFin,
		&i.KmRecorridos, &i.Estado, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- SoftDeleteSalida ---

const softDeleteSalida = `-- name: SoftDeleteSalida :exec
UPDATE salidas_vendedor SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteSalidaParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteSalida(ctx context.Context, arg SoftDeleteSalidaParams) error {
	_, err := q.db.Exec(ctx, softDeleteSalida, arg.ID, arg.UsuarioID)
	return err
}
