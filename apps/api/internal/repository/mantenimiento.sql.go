package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type MantenimientoVehiculo struct {
	ID             pgtype.UUID        `json:"id"`
	VehiculoID     pgtype.UUID        `json:"vehiculo_id"`
	Tipo           string             `json:"tipo"`
	Descripcion    pgtype.Text        `json:"descripcion"`
	Fecha          pgtype.Date        `json:"fecha"`
	ProximoFecha   pgtype.Date        `json:"proximo_fecha"`
	ProximoKm      pgtype.Int4        `json:"proximo_km"`
	Costo          pgtype.Numeric     `json:"costo"`
	Proveedor      pgtype.Text        `json:"proveedor"`
	NumeroFactura  pgtype.Text        `json:"numero_factura"`
	UsuarioID      pgtype.UUID        `json:"usuario_id"`
	Active         bool               `json:"active"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
	UpdatedAt      pgtype.Timestamptz `json:"updated_at"`
}

const createMantenimientoVehiculo = `-- name: CreateMantenimientoVehiculo :one
INSERT INTO mantenimiento_vehiculos (vehiculo_id, tipo, descripcion, fecha, proximo_fecha, proximo_km, costo, proveedor, numero_factura, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, vehiculo_id, tipo, descripcion, fecha, proximo_fecha, proximo_km, costo, proveedor, numero_factura, usuario_id, active, created_at, updated_at
`

type CreateMantenimientoVehiculoParams struct {
	VehiculoID    pgtype.UUID    `json:"vehiculo_id"`
	Tipo          string         `json:"tipo"`
	Descripcion   pgtype.Text    `json:"descripcion"`
	Fecha         pgtype.Date    `json:"fecha"`
	ProximoFecha  pgtype.Date    `json:"proximo_fecha"`
	ProximoKm     pgtype.Int4    `json:"proximo_km"`
	Costo         pgtype.Numeric `json:"costo"`
	Proveedor     pgtype.Text    `json:"proveedor"`
	NumeroFactura pgtype.Text    `json:"numero_factura"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateMantenimientoVehiculo(ctx context.Context, arg CreateMantenimientoVehiculoParams) (MantenimientoVehiculo, error) {
	row := q.db.QueryRow(ctx, createMantenimientoVehiculo,
		arg.VehiculoID, arg.Tipo, arg.Descripcion, arg.Fecha,
		arg.ProximoFecha, arg.ProximoKm, arg.Costo, arg.Proveedor,
		arg.NumeroFactura, arg.UsuarioID,
	)
	var i MantenimientoVehiculo
	err := row.Scan(
		&i.ID, &i.VehiculoID, &i.Tipo, &i.Descripcion, &i.Fecha,
		&i.ProximoFecha, &i.ProximoKm, &i.Costo, &i.Proveedor,
		&i.NumeroFactura, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const getMantenimientoVehiculoByID = `-- name: GetMantenimientoVehiculoByID :one
SELECT id, vehiculo_id, tipo, descripcion, fecha, proximo_fecha, proximo_km, costo, proveedor, numero_factura, usuario_id, active, created_at, updated_at
FROM mantenimiento_vehiculos
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

type GetMantenimientoVehiculoByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetMantenimientoVehiculoByID(ctx context.Context, arg GetMantenimientoVehiculoByIDParams) (MantenimientoVehiculo, error) {
	row := q.db.QueryRow(ctx, getMantenimientoVehiculoByID, arg.ID, arg.UsuarioID)
	var i MantenimientoVehiculo
	err := row.Scan(
		&i.ID, &i.VehiculoID, &i.Tipo, &i.Descripcion, &i.Fecha,
		&i.ProximoFecha, &i.ProximoKm, &i.Costo, &i.Proveedor,
		&i.NumeroFactura, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listMantenimientosByVehiculo = `-- name: ListMantenimientosByVehiculo :many
SELECT id, vehiculo_id, tipo, descripcion, fecha, proximo_fecha, proximo_km, costo, proveedor, numero_factura, usuario_id, active, created_at, updated_at
FROM mantenimiento_vehiculos
WHERE vehiculo_id = $1 AND usuario_id = $2 AND active = TRUE
ORDER BY fecha DESC
LIMIT $3 OFFSET $4
`

type ListMantenimientosByVehiculoParams struct {
	VehiculoID  pgtype.UUID `json:"vehiculo_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListMantenimientosByVehiculo(ctx context.Context, arg ListMantenimientosByVehiculoParams) ([]MantenimientoVehiculo, error) {
	rows, err := q.db.Query(ctx, listMantenimientosByVehiculo,
		arg.VehiculoID, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MantenimientoVehiculo
	for rows.Next() {
		var i MantenimientoVehiculo
		if err := rows.Scan(
			&i.ID, &i.VehiculoID, &i.Tipo, &i.Descripcion, &i.Fecha,
			&i.ProximoFecha, &i.ProximoKm, &i.Costo, &i.Proveedor,
			&i.NumeroFactura, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countMantenimientosByVehiculo = `-- name: CountMantenimientosByVehiculo :one
SELECT COUNT(*) FROM mantenimiento_vehiculos
WHERE vehiculo_id = $1 AND usuario_id = $2 AND active = TRUE
`

type CountMantenimientosByVehiculoParams struct {
	VehiculoID pgtype.UUID `json:"vehiculo_id"`
	UsuarioID  pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CountMantenimientosByVehiculo(ctx context.Context, arg CountMantenimientosByVehiculoParams) (int64, error) {
	row := q.db.QueryRow(ctx, countMantenimientosByVehiculo, arg.VehiculoID, arg.UsuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const listMantenimientos = `-- name: ListMantenimientos :many
SELECT id, vehiculo_id, tipo, descripcion, fecha, proximo_fecha, proximo_km, costo, proveedor, numero_factura, usuario_id, active, created_at, updated_at
FROM mantenimiento_vehiculos
WHERE usuario_id = $1 AND active = TRUE
ORDER BY fecha DESC
LIMIT $2 OFFSET $3
`

type ListMantenimientosParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListMantenimientos(ctx context.Context, arg ListMantenimientosParams) ([]MantenimientoVehiculo, error) {
	rows, err := q.db.Query(ctx, listMantenimientos, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MantenimientoVehiculo
	for rows.Next() {
		var i MantenimientoVehiculo
		if err := rows.Scan(
			&i.ID, &i.VehiculoID, &i.Tipo, &i.Descripcion, &i.Fecha,
			&i.ProximoFecha, &i.ProximoKm, &i.Costo, &i.Proveedor,
			&i.NumeroFactura, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countMantenimientos = `-- name: CountMantenimientos :one
SELECT COUNT(*) FROM mantenimiento_vehiculos
WHERE usuario_id = $1 AND active = TRUE
`

func (q *Queries) CountMantenimientos(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countMantenimientos, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const updateMantenimientoVehiculo = `-- name: UpdateMantenimientoVehiculo :one
UPDATE mantenimiento_vehiculos
SET tipo = $3, descripcion = $4, fecha = $5, proximo_fecha = $6, proximo_km = $7, costo = $8, proveedor = $9, numero_factura = $10, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, vehiculo_id, tipo, descripcion, fecha, proximo_fecha, proximo_km, costo, proveedor, numero_factura, usuario_id, active, created_at, updated_at
`

type UpdateMantenimientoVehiculoParams struct {
	ID            pgtype.UUID    `json:"id"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
	Tipo          string         `json:"tipo"`
	Descripcion   pgtype.Text    `json:"descripcion"`
	Fecha         pgtype.Date    `json:"fecha"`
	ProximoFecha  pgtype.Date    `json:"proximo_fecha"`
	ProximoKm     pgtype.Int4    `json:"proximo_km"`
	Costo         pgtype.Numeric `json:"costo"`
	Proveedor     pgtype.Text    `json:"proveedor"`
	NumeroFactura pgtype.Text    `json:"numero_factura"`
}

func (q *Queries) UpdateMantenimientoVehiculo(ctx context.Context, arg UpdateMantenimientoVehiculoParams) (MantenimientoVehiculo, error) {
	row := q.db.QueryRow(ctx, updateMantenimientoVehiculo,
		arg.ID, arg.UsuarioID, arg.Tipo, arg.Descripcion, arg.Fecha,
		arg.ProximoFecha, arg.ProximoKm, arg.Costo, arg.Proveedor, arg.NumeroFactura,
	)
	var i MantenimientoVehiculo
	err := row.Scan(
		&i.ID, &i.VehiculoID, &i.Tipo, &i.Descripcion, &i.Fecha,
		&i.ProximoFecha, &i.ProximoKm, &i.Costo, &i.Proveedor,
		&i.NumeroFactura, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const softDeleteMantenimientoVehiculo = `-- name: SoftDeleteMantenimientoVehiculo :exec
UPDATE mantenimiento_vehiculos SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteMantenimientoVehiculoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteMantenimientoVehiculo(ctx context.Context, arg SoftDeleteMantenimientoVehiculoParams) error {
	_, err := q.db.Exec(ctx, softDeleteMantenimientoVehiculo, arg.ID, arg.UsuarioID)
	return err
}
