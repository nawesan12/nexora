package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type ConversionUnidad struct {
	ID        pgtype.UUID        `json:"id"`
	FromUnit  string             `json:"from_unit"`
	ToUnit    string             `json:"to_unit"`
	Factor    pgtype.Numeric     `json:"factor"`
	UsuarioID pgtype.UUID        `json:"usuario_id"`
	Active    bool               `json:"active"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

const createConversion = `-- name: CreateConversion :one
INSERT INTO conversiones_unidad (from_unit, to_unit, factor, usuario_id)
VALUES ($1, $2, $3, $4)
RETURNING id, from_unit, to_unit, factor, usuario_id, active, created_at, updated_at
`

type CreateConversionParams struct {
	FromUnit  string         `json:"from_unit"`
	ToUnit    string         `json:"to_unit"`
	Factor    pgtype.Numeric `json:"factor"`
	UsuarioID pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateConversion(ctx context.Context, arg CreateConversionParams) (ConversionUnidad, error) {
	row := q.db.QueryRow(ctx, createConversion,
		arg.FromUnit, arg.ToUnit, arg.Factor, arg.UsuarioID,
	)
	var i ConversionUnidad
	err := row.Scan(
		&i.ID, &i.FromUnit, &i.ToUnit, &i.Factor,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listConversions = `-- name: ListConversions :many
SELECT id, from_unit, to_unit, factor, usuario_id, active, created_at, updated_at
FROM conversiones_unidad
WHERE usuario_id = $1 AND active = TRUE
ORDER BY from_unit, to_unit
LIMIT $2 OFFSET $3
`

type ListConversionsParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListConversions(ctx context.Context, arg ListConversionsParams) ([]ConversionUnidad, error) {
	rows, err := q.db.Query(ctx, listConversions, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ConversionUnidad
	for rows.Next() {
		var i ConversionUnidad
		if err := rows.Scan(
			&i.ID, &i.FromUnit, &i.ToUnit, &i.Factor,
			&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const getConversion = `-- name: GetConversion :one
SELECT id, from_unit, to_unit, factor, usuario_id, active, created_at, updated_at
FROM conversiones_unidad
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

type GetConversionParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetConversion(ctx context.Context, arg GetConversionParams) (ConversionUnidad, error) {
	row := q.db.QueryRow(ctx, getConversion, arg.ID, arg.UsuarioID)
	var i ConversionUnidad
	err := row.Scan(
		&i.ID, &i.FromUnit, &i.ToUnit, &i.Factor,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const updateConversion = `-- name: UpdateConversion :one
UPDATE conversiones_unidad
SET factor = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, from_unit, to_unit, factor, usuario_id, active, created_at, updated_at
`

type UpdateConversionParams struct {
	ID        pgtype.UUID    `json:"id"`
	UsuarioID pgtype.UUID    `json:"usuario_id"`
	Factor    pgtype.Numeric `json:"factor"`
}

func (q *Queries) UpdateConversion(ctx context.Context, arg UpdateConversionParams) (ConversionUnidad, error) {
	row := q.db.QueryRow(ctx, updateConversion, arg.ID, arg.UsuarioID, arg.Factor)
	var i ConversionUnidad
	err := row.Scan(
		&i.ID, &i.FromUnit, &i.ToUnit, &i.Factor,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const softDeleteConversion = `-- name: SoftDeleteConversion :exec
UPDATE conversiones_unidad SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteConversionParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteConversion(ctx context.Context, arg SoftDeleteConversionParams) error {
	_, err := q.db.Exec(ctx, softDeleteConversion, arg.ID, arg.UsuarioID)
	return err
}

const countConversions = `-- name: CountConversions :one
SELECT COUNT(*) FROM conversiones_unidad
WHERE usuario_id = $1 AND active = TRUE
`

func (q *Queries) CountConversions(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countConversions, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const convertUnits = `-- name: ConvertUnits :one
SELECT factor FROM conversiones_unidad
WHERE from_unit = $1 AND to_unit = $2 AND usuario_id = $3 AND active = TRUE
`

type ConvertUnitsParams struct {
	FromUnit  string      `json:"from_unit"`
	ToUnit    string      `json:"to_unit"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) ConvertUnits(ctx context.Context, arg ConvertUnitsParams) (pgtype.Numeric, error) {
	row := q.db.QueryRow(ctx, convertUnits, arg.FromUnit, arg.ToUnit, arg.UsuarioID)
	var factor pgtype.Numeric
	err := row.Scan(&factor)
	return factor, err
}
