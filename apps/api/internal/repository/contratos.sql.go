package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type Contrato struct {
	ID          pgtype.UUID        `json:"id"`
	EmpleadoID  pgtype.UUID        `json:"empleado_id"`
	Tipo        string             `json:"tipo"`
	Salario     pgtype.Numeric     `json:"salario"`
	FechaInicio pgtype.Date        `json:"fecha_inicio"`
	FechaFin    pgtype.Date        `json:"fecha_fin"`
	Descripcion pgtype.Text        `json:"descripcion"`
	UsuarioID   pgtype.UUID        `json:"usuario_id"`
	Active      bool               `json:"active"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
}

const createContrato = `-- name: CreateContrato :one
INSERT INTO contratos (empleado_id, tipo, salario, fecha_inicio, fecha_fin, descripcion, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, empleado_id, tipo, salario, fecha_inicio, fecha_fin, descripcion, usuario_id, active, created_at
`

type CreateContratoParams struct {
	EmpleadoID  pgtype.UUID    `json:"empleado_id"`
	Tipo        string         `json:"tipo"`
	Salario     pgtype.Numeric `json:"salario"`
	FechaInicio pgtype.Date    `json:"fecha_inicio"`
	FechaFin    pgtype.Date    `json:"fecha_fin"`
	Descripcion pgtype.Text    `json:"descripcion"`
	UsuarioID   pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateContrato(ctx context.Context, arg CreateContratoParams) (Contrato, error) {
	row := q.db.QueryRow(ctx, createContrato,
		arg.EmpleadoID, arg.Tipo, arg.Salario, arg.FechaInicio,
		arg.FechaFin, arg.Descripcion, arg.UsuarioID,
	)
	var c Contrato
	err := row.Scan(
		&c.ID, &c.EmpleadoID, &c.Tipo, &c.Salario,
		&c.FechaInicio, &c.FechaFin, &c.Descripcion,
		&c.UsuarioID, &c.Active, &c.CreatedAt,
	)
	return c, err
}

const getContratoByID = `-- name: GetContratoByID :one
SELECT c.id, c.empleado_id, c.tipo, c.salario, c.fecha_inicio, c.fecha_fin, c.descripcion, c.usuario_id, c.active, c.created_at
FROM contratos c
JOIN empleados e ON e.id = c.empleado_id
WHERE c.id = $1 AND c.usuario_id = $2 AND c.active = TRUE
`

type GetContratoByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetContratoByID(ctx context.Context, arg GetContratoByIDParams) (Contrato, error) {
	row := q.db.QueryRow(ctx, getContratoByID, arg.ID, arg.UsuarioID)
	var c Contrato
	err := row.Scan(
		&c.ID, &c.EmpleadoID, &c.Tipo, &c.Salario,
		&c.FechaInicio, &c.FechaFin, &c.Descripcion,
		&c.UsuarioID, &c.Active, &c.CreatedAt,
	)
	return c, err
}

const listContratosByEmpleado = `-- name: ListContratosByEmpleado :many
SELECT c.id, c.empleado_id, c.tipo, c.salario, c.fecha_inicio, c.fecha_fin, c.descripcion, c.usuario_id, c.active, c.created_at
FROM contratos c
WHERE c.empleado_id = $1 AND c.usuario_id = $2 AND c.active = TRUE
ORDER BY c.fecha_inicio DESC
LIMIT $3 OFFSET $4
`

type ListContratosByEmpleadoParams struct {
	EmpleadoID  pgtype.UUID `json:"empleado_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListContratosByEmpleado(ctx context.Context, arg ListContratosByEmpleadoParams) ([]Contrato, error) {
	rows, err := q.db.Query(ctx, listContratosByEmpleado,
		arg.EmpleadoID, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Contrato
	for rows.Next() {
		var c Contrato
		if err := rows.Scan(
			&c.ID, &c.EmpleadoID, &c.Tipo, &c.Salario,
			&c.FechaInicio, &c.FechaFin, &c.Descripcion,
			&c.UsuarioID, &c.Active, &c.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, rows.Err()
}

const countContratosByEmpleado = `-- name: CountContratosByEmpleado :one
SELECT COUNT(*) FROM contratos
WHERE empleado_id = $1 AND usuario_id = $2 AND active = TRUE
`

type CountContratosByEmpleadoParams struct {
	EmpleadoID pgtype.UUID `json:"empleado_id"`
	UsuarioID  pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CountContratosByEmpleado(ctx context.Context, arg CountContratosByEmpleadoParams) (int64, error) {
	row := q.db.QueryRow(ctx, countContratosByEmpleado, arg.EmpleadoID, arg.UsuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const updateContrato = `-- name: UpdateContrato :one
UPDATE contratos
SET tipo = $3, salario = $4, fecha_inicio = $5, fecha_fin = $6, descripcion = $7
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, empleado_id, tipo, salario, fecha_inicio, fecha_fin, descripcion, usuario_id, active, created_at
`

type UpdateContratoParams struct {
	ID          pgtype.UUID    `json:"id"`
	UsuarioID   pgtype.UUID    `json:"usuario_id"`
	Tipo        string         `json:"tipo"`
	Salario     pgtype.Numeric `json:"salario"`
	FechaInicio pgtype.Date    `json:"fecha_inicio"`
	FechaFin    pgtype.Date    `json:"fecha_fin"`
	Descripcion pgtype.Text    `json:"descripcion"`
}

func (q *Queries) UpdateContrato(ctx context.Context, arg UpdateContratoParams) (Contrato, error) {
	row := q.db.QueryRow(ctx, updateContrato,
		arg.ID, arg.UsuarioID, arg.Tipo, arg.Salario,
		arg.FechaInicio, arg.FechaFin, arg.Descripcion,
	)
	var c Contrato
	err := row.Scan(
		&c.ID, &c.EmpleadoID, &c.Tipo, &c.Salario,
		&c.FechaInicio, &c.FechaFin, &c.Descripcion,
		&c.UsuarioID, &c.Active, &c.CreatedAt,
	)
	return c, err
}

const softDeleteContrato = `-- name: SoftDeleteContrato :exec
UPDATE contratos
SET active = FALSE
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteContratoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteContrato(ctx context.Context, arg SoftDeleteContratoParams) error {
	_, err := q.db.Exec(ctx, softDeleteContrato, arg.ID, arg.UsuarioID)
	return err
}
