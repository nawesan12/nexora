package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type MetaVenta struct {
	ID             pgtype.UUID        `json:"id"`
	Nombre         string             `json:"nombre"`
	Tipo           string             `json:"tipo"`
	EmpleadoID     pgtype.UUID        `json:"empleado_id"`
	SucursalID     pgtype.UUID        `json:"sucursal_id"`
	MontoObjetivo  pgtype.Numeric     `json:"monto_objetivo"`
	MontoActual    pgtype.Numeric     `json:"monto_actual"`
	FechaInicio    pgtype.Date        `json:"fecha_inicio"`
	FechaFin       pgtype.Date        `json:"fecha_fin"`
	UsuarioID      pgtype.UUID        `json:"usuario_id"`
	Active         bool               `json:"active"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
	UpdatedAt      pgtype.Timestamptz `json:"updated_at"`
}

const createMetaVenta = `-- name: CreateMetaVenta :one
INSERT INTO metas_venta (nombre, tipo, empleado_id, sucursal_id, monto_objetivo, fecha_inicio, fecha_fin, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, nombre, tipo, empleado_id, sucursal_id, monto_objetivo, monto_actual, fecha_inicio, fecha_fin, usuario_id, active, created_at, updated_at
`

type CreateMetaVentaParams struct {
	Nombre        string         `json:"nombre"`
	Tipo          string         `json:"tipo"`
	EmpleadoID    pgtype.UUID    `json:"empleado_id"`
	SucursalID    pgtype.UUID    `json:"sucursal_id"`
	MontoObjetivo pgtype.Numeric `json:"monto_objetivo"`
	FechaInicio   pgtype.Date    `json:"fecha_inicio"`
	FechaFin      pgtype.Date    `json:"fecha_fin"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateMetaVenta(ctx context.Context, arg CreateMetaVentaParams) (MetaVenta, error) {
	row := q.db.QueryRow(ctx, createMetaVenta,
		arg.Nombre, arg.Tipo, arg.EmpleadoID, arg.SucursalID,
		arg.MontoObjetivo, arg.FechaInicio, arg.FechaFin, arg.UsuarioID,
	)
	var i MetaVenta
	err := row.Scan(
		&i.ID, &i.Nombre, &i.Tipo, &i.EmpleadoID, &i.SucursalID,
		&i.MontoObjetivo, &i.MontoActual, &i.FechaInicio, &i.FechaFin,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const getMetaVentaByID = `-- name: GetMetaVentaByID :one
SELECT id, nombre, tipo, empleado_id, sucursal_id, monto_objetivo, monto_actual, fecha_inicio, fecha_fin, usuario_id, active, created_at, updated_at
FROM metas_venta
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

type GetMetaVentaByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetMetaVentaByID(ctx context.Context, arg GetMetaVentaByIDParams) (MetaVenta, error) {
	row := q.db.QueryRow(ctx, getMetaVentaByID, arg.ID, arg.UsuarioID)
	var i MetaVenta
	err := row.Scan(
		&i.ID, &i.Nombre, &i.Tipo, &i.EmpleadoID, &i.SucursalID,
		&i.MontoObjetivo, &i.MontoActual, &i.FechaInicio, &i.FechaFin,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listMetasVenta = `-- name: ListMetasVenta :many
SELECT id, nombre, tipo, empleado_id, sucursal_id, monto_objetivo, monto_actual, fecha_inicio, fecha_fin, usuario_id, active, created_at, updated_at
FROM metas_venta
WHERE usuario_id = $1 AND active = TRUE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
`

type ListMetasVentaParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListMetasVenta(ctx context.Context, arg ListMetasVentaParams) ([]MetaVenta, error) {
	rows, err := q.db.Query(ctx, listMetasVenta, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MetaVenta
	for rows.Next() {
		var i MetaVenta
		if err := rows.Scan(
			&i.ID, &i.Nombre, &i.Tipo, &i.EmpleadoID, &i.SucursalID,
			&i.MontoObjetivo, &i.MontoActual, &i.FechaInicio, &i.FechaFin,
			&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countMetasVenta = `-- name: CountMetasVenta :one
SELECT COUNT(*) FROM metas_venta
WHERE usuario_id = $1 AND active = TRUE
`

func (q *Queries) CountMetasVenta(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countMetasVenta, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const updateMetaVenta = `-- name: UpdateMetaVenta :one
UPDATE metas_venta
SET nombre = $3, tipo = $4, empleado_id = $5, sucursal_id = $6, monto_objetivo = $7, fecha_inicio = $8, fecha_fin = $9, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, nombre, tipo, empleado_id, sucursal_id, monto_objetivo, monto_actual, fecha_inicio, fecha_fin, usuario_id, active, created_at, updated_at
`

type UpdateMetaVentaParams struct {
	ID            pgtype.UUID    `json:"id"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
	Nombre        string         `json:"nombre"`
	Tipo          string         `json:"tipo"`
	EmpleadoID    pgtype.UUID    `json:"empleado_id"`
	SucursalID    pgtype.UUID    `json:"sucursal_id"`
	MontoObjetivo pgtype.Numeric `json:"monto_objetivo"`
	FechaInicio   pgtype.Date    `json:"fecha_inicio"`
	FechaFin      pgtype.Date    `json:"fecha_fin"`
}

func (q *Queries) UpdateMetaVenta(ctx context.Context, arg UpdateMetaVentaParams) (MetaVenta, error) {
	row := q.db.QueryRow(ctx, updateMetaVenta,
		arg.ID, arg.UsuarioID, arg.Nombre, arg.Tipo,
		arg.EmpleadoID, arg.SucursalID, arg.MontoObjetivo,
		arg.FechaInicio, arg.FechaFin,
	)
	var i MetaVenta
	err := row.Scan(
		&i.ID, &i.Nombre, &i.Tipo, &i.EmpleadoID, &i.SucursalID,
		&i.MontoObjetivo, &i.MontoActual, &i.FechaInicio, &i.FechaFin,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const updateMetaMontoActual = `-- name: UpdateMetaMontoActual :one
UPDATE metas_venta
SET monto_actual = monto_actual + $2, updated_at = NOW()
WHERE id = $1 AND active = TRUE
RETURNING id, nombre, tipo, empleado_id, sucursal_id, monto_objetivo, monto_actual, fecha_inicio, fecha_fin, usuario_id, active, created_at, updated_at
`

type UpdateMetaMontoActualParams struct {
	ID    pgtype.UUID    `json:"id"`
	Monto pgtype.Numeric `json:"monto"`
}

func (q *Queries) UpdateMetaMontoActual(ctx context.Context, arg UpdateMetaMontoActualParams) (MetaVenta, error) {
	row := q.db.QueryRow(ctx, updateMetaMontoActual, arg.ID, arg.Monto)
	var i MetaVenta
	err := row.Scan(
		&i.ID, &i.Nombre, &i.Tipo, &i.EmpleadoID, &i.SucursalID,
		&i.MontoObjetivo, &i.MontoActual, &i.FechaInicio, &i.FechaFin,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const softDeleteMetaVenta = `-- name: SoftDeleteMetaVenta :exec
UPDATE metas_venta SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteMetaVentaParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteMetaVenta(ctx context.Context, arg SoftDeleteMetaVentaParams) error {
	_, err := q.db.Exec(ctx, softDeleteMetaVenta, arg.ID, arg.UsuarioID)
	return err
}
