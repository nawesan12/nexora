package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type PlantillaPedido struct {
	ID                 pgtype.UUID        `json:"id"`
	Nombre             string             `json:"nombre"`
	ClienteID          pgtype.UUID        `json:"cliente_id"`
	SucursalID         pgtype.UUID        `json:"sucursal_id"`
	FrecuenciaDias     int32              `json:"frecuencia_dias"`
	ProximoGeneracion  pgtype.Date        `json:"proximo_generacion"`
	Activa             bool               `json:"activa"`
	UsuarioID          pgtype.UUID        `json:"usuario_id"`
	Active             bool               `json:"active"`
	CreatedAt          pgtype.Timestamptz `json:"created_at"`
	UpdatedAt          pgtype.Timestamptz `json:"updated_at"`
}

type DetallePlantillaPedido struct {
	ID          pgtype.UUID    `json:"id"`
	PlantillaID pgtype.UUID    `json:"plantilla_id"`
	ProductoID  pgtype.UUID    `json:"producto_id"`
	Cantidad    pgtype.Numeric `json:"cantidad"`
	Precio      pgtype.Numeric `json:"precio"`
}

const createPlantilla = `-- name: CreatePlantilla :one
INSERT INTO plantilla_pedido (nombre, cliente_id, sucursal_id, frecuencia_dias, proximo_generacion, activa, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, nombre, cliente_id, sucursal_id, frecuencia_dias, proximo_generacion, activa, usuario_id, active, created_at, updated_at
`

type CreatePlantillaParams struct {
	Nombre            string      `json:"nombre"`
	ClienteID         pgtype.UUID `json:"cliente_id"`
	SucursalID        pgtype.UUID `json:"sucursal_id"`
	FrecuenciaDias    int32       `json:"frecuencia_dias"`
	ProximoGeneracion pgtype.Date `json:"proximo_generacion"`
	Activa            bool        `json:"activa"`
	UsuarioID         pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CreatePlantilla(ctx context.Context, arg CreatePlantillaParams) (PlantillaPedido, error) {
	row := q.db.QueryRow(ctx, createPlantilla,
		arg.Nombre, arg.ClienteID, arg.SucursalID,
		arg.FrecuenciaDias, arg.ProximoGeneracion, arg.Activa, arg.UsuarioID,
	)
	var i PlantillaPedido
	err := row.Scan(
		&i.ID, &i.Nombre, &i.ClienteID, &i.SucursalID,
		&i.FrecuenciaDias, &i.ProximoGeneracion, &i.Activa,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listPlantillas = `-- name: ListPlantillas :many
SELECT pp.id, pp.nombre, pp.cliente_id, pp.sucursal_id, pp.frecuencia_dias, pp.proximo_generacion, pp.activa, pp.usuario_id, pp.active, pp.created_at, pp.updated_at, c.nombre as cliente_nombre, s.nombre as sucursal_nombre
FROM plantilla_pedido pp
LEFT JOIN clientes c ON c.id = pp.cliente_id
LEFT JOIN sucursales s ON s.id = pp.sucursal_id
WHERE pp.usuario_id = $1 AND pp.active = true
ORDER BY pp.created_at DESC
LIMIT $2 OFFSET $3
`

type ListPlantillasParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

type ListPlantillasRow struct {
	ID                pgtype.UUID        `json:"id"`
	Nombre            string             `json:"nombre"`
	ClienteID         pgtype.UUID        `json:"cliente_id"`
	SucursalID        pgtype.UUID        `json:"sucursal_id"`
	FrecuenciaDias    int32              `json:"frecuencia_dias"`
	ProximoGeneracion pgtype.Date        `json:"proximo_generacion"`
	Activa            bool               `json:"activa"`
	UsuarioID         pgtype.UUID        `json:"usuario_id"`
	Active            bool               `json:"active"`
	CreatedAt         pgtype.Timestamptz `json:"created_at"`
	UpdatedAt         pgtype.Timestamptz `json:"updated_at"`
	ClienteNombre     pgtype.Text        `json:"cliente_nombre"`
	SucursalNombre    pgtype.Text        `json:"sucursal_nombre"`
}

func (q *Queries) ListPlantillas(ctx context.Context, arg ListPlantillasParams) ([]ListPlantillasRow, error) {
	rows, err := q.db.Query(ctx, listPlantillas, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListPlantillasRow
	for rows.Next() {
		var i ListPlantillasRow
		if err := rows.Scan(
			&i.ID, &i.Nombre, &i.ClienteID, &i.SucursalID,
			&i.FrecuenciaDias, &i.ProximoGeneracion, &i.Activa,
			&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
			&i.ClienteNombre, &i.SucursalNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countPlantillas = `-- name: CountPlantillas :one
SELECT COUNT(*) FROM plantilla_pedido WHERE usuario_id = $1 AND active = true
`

func (q *Queries) CountPlantillas(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countPlantillas, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const getPlantilla = `-- name: GetPlantilla :one
SELECT pp.id, pp.nombre, pp.cliente_id, pp.sucursal_id, pp.frecuencia_dias, pp.proximo_generacion, pp.activa, pp.usuario_id, pp.active, pp.created_at, pp.updated_at, c.nombre as cliente_nombre, s.nombre as sucursal_nombre
FROM plantilla_pedido pp
LEFT JOIN clientes c ON c.id = pp.cliente_id
LEFT JOIN sucursales s ON s.id = pp.sucursal_id
WHERE pp.id = $1 AND pp.usuario_id = $2 AND pp.active = true
`

type GetPlantillaParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type GetPlantillaRow struct {
	ID                pgtype.UUID        `json:"id"`
	Nombre            string             `json:"nombre"`
	ClienteID         pgtype.UUID        `json:"cliente_id"`
	SucursalID        pgtype.UUID        `json:"sucursal_id"`
	FrecuenciaDias    int32              `json:"frecuencia_dias"`
	ProximoGeneracion pgtype.Date        `json:"proximo_generacion"`
	Activa            bool               `json:"activa"`
	UsuarioID         pgtype.UUID        `json:"usuario_id"`
	Active            bool               `json:"active"`
	CreatedAt         pgtype.Timestamptz `json:"created_at"`
	UpdatedAt         pgtype.Timestamptz `json:"updated_at"`
	ClienteNombre     pgtype.Text        `json:"cliente_nombre"`
	SucursalNombre    pgtype.Text        `json:"sucursal_nombre"`
}

func (q *Queries) GetPlantilla(ctx context.Context, arg GetPlantillaParams) (GetPlantillaRow, error) {
	row := q.db.QueryRow(ctx, getPlantilla, arg.ID, arg.UsuarioID)
	var i GetPlantillaRow
	err := row.Scan(
		&i.ID, &i.Nombre, &i.ClienteID, &i.SucursalID,
		&i.FrecuenciaDias, &i.ProximoGeneracion, &i.Activa,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		&i.ClienteNombre, &i.SucursalNombre,
	)
	return i, err
}

const updatePlantilla = `-- name: UpdatePlantilla :one
UPDATE plantilla_pedido
SET nombre = $1, cliente_id = $2, sucursal_id = $3, frecuencia_dias = $4,
    proximo_generacion = $5, activa = $6, updated_at = NOW()
WHERE id = $7 AND usuario_id = $8 AND active = true
RETURNING id, nombre, cliente_id, sucursal_id, frecuencia_dias, proximo_generacion, activa, usuario_id, active, created_at, updated_at
`

type UpdatePlantillaParams struct {
	Nombre            string      `json:"nombre"`
	ClienteID         pgtype.UUID `json:"cliente_id"`
	SucursalID        pgtype.UUID `json:"sucursal_id"`
	FrecuenciaDias    int32       `json:"frecuencia_dias"`
	ProximoGeneracion pgtype.Date `json:"proximo_generacion"`
	Activa            bool        `json:"activa"`
	ID                pgtype.UUID `json:"id"`
	UsuarioID         pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) UpdatePlantilla(ctx context.Context, arg UpdatePlantillaParams) (PlantillaPedido, error) {
	row := q.db.QueryRow(ctx, updatePlantilla,
		arg.Nombre, arg.ClienteID, arg.SucursalID,
		arg.FrecuenciaDias, arg.ProximoGeneracion, arg.Activa,
		arg.ID, arg.UsuarioID,
	)
	var i PlantillaPedido
	err := row.Scan(
		&i.ID, &i.Nombre, &i.ClienteID, &i.SucursalID,
		&i.FrecuenciaDias, &i.ProximoGeneracion, &i.Activa,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const softDeletePlantilla = `-- name: SoftDeletePlantilla :exec
UPDATE plantilla_pedido SET active = false, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeletePlantillaParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeletePlantilla(ctx context.Context, arg SoftDeletePlantillaParams) error {
	_, err := q.db.Exec(ctx, softDeletePlantilla, arg.ID, arg.UsuarioID)
	return err
}

const createDetallePlantilla = `-- name: CreateDetallePlantilla :one
INSERT INTO detalle_plantilla_pedido (plantilla_id, producto_id, cantidad, precio)
VALUES ($1, $2, $3, $4)
RETURNING id, plantilla_id, producto_id, cantidad, precio
`

type CreateDetallePlantillaParams struct {
	PlantillaID pgtype.UUID    `json:"plantilla_id"`
	ProductoID  pgtype.UUID    `json:"producto_id"`
	Cantidad    pgtype.Numeric `json:"cantidad"`
	Precio      pgtype.Numeric `json:"precio"`
}

func (q *Queries) CreateDetallePlantilla(ctx context.Context, arg CreateDetallePlantillaParams) (DetallePlantillaPedido, error) {
	row := q.db.QueryRow(ctx, createDetallePlantilla,
		arg.PlantillaID, arg.ProductoID, arg.Cantidad, arg.Precio,
	)
	var i DetallePlantillaPedido
	err := row.Scan(&i.ID, &i.PlantillaID, &i.ProductoID, &i.Cantidad, &i.Precio)
	return i, err
}

const listDetallePlantilla = `-- name: ListDetallePlantilla :many
SELECT dpp.id, dpp.plantilla_id, dpp.producto_id, dpp.cantidad, dpp.precio, p.nombre as producto_nombre, p.codigo as producto_codigo, p.unidad as producto_unidad
FROM detalle_plantilla_pedido dpp
LEFT JOIN productos p ON p.id = dpp.producto_id
WHERE dpp.plantilla_id = $1
ORDER BY dpp.id
`

type ListDetallePlantillaRow struct {
	ID              pgtype.UUID    `json:"id"`
	PlantillaID     pgtype.UUID    `json:"plantilla_id"`
	ProductoID      pgtype.UUID    `json:"producto_id"`
	Cantidad        pgtype.Numeric `json:"cantidad"`
	Precio          pgtype.Numeric `json:"precio"`
	ProductoNombre  pgtype.Text    `json:"producto_nombre"`
	ProductoCodigo  pgtype.Text    `json:"producto_codigo"`
	ProductoUnidad  pgtype.Text    `json:"producto_unidad"`
}

func (q *Queries) ListDetallePlantilla(ctx context.Context, plantillaID pgtype.UUID) ([]ListDetallePlantillaRow, error) {
	rows, err := q.db.Query(ctx, listDetallePlantilla, plantillaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListDetallePlantillaRow
	for rows.Next() {
		var i ListDetallePlantillaRow
		if err := rows.Scan(
			&i.ID, &i.PlantillaID, &i.ProductoID, &i.Cantidad, &i.Precio,
			&i.ProductoNombre, &i.ProductoCodigo, &i.ProductoUnidad,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const deleteDetallePlantillaByPlantilla = `-- name: DeleteDetallePlantillaByPlantilla :exec
DELETE FROM detalle_plantilla_pedido WHERE plantilla_id = $1
`

func (q *Queries) DeleteDetallePlantillaByPlantilla(ctx context.Context, plantillaID pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteDetallePlantillaByPlantilla, plantillaID)
	return err
}
