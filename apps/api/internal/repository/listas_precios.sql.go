package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type ListaPrecio struct {
	ID          pgtype.UUID        `json:"id"`
	Nombre      string             `json:"nombre"`
	Descripcion pgtype.Text        `json:"descripcion"`
	Tipo        string             `json:"tipo"`
	Activa      bool               `json:"activa"`
	FechaDesde  pgtype.Date        `json:"fecha_desde"`
	FechaHasta  pgtype.Date        `json:"fecha_hasta"`
	SucursalID  pgtype.UUID        `json:"sucursal_id"`
	UsuarioID   pgtype.UUID        `json:"usuario_id"`
	Active      bool               `json:"active"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

type PrecioLista struct {
	ID                   pgtype.UUID    `json:"id"`
	ListaID              pgtype.UUID    `json:"lista_id"`
	ProductoID           pgtype.UUID    `json:"producto_id"`
	Precio               pgtype.Numeric `json:"precio"`
	DescuentoPorcentaje  pgtype.Numeric `json:"descuento_porcentaje"`
}

// --- Listas CRUD ---

const createListaPrecio = `-- name: CreateListaPrecio :one
INSERT INTO listas_precios (nombre, descripcion, tipo, activa, fecha_desde, fecha_hasta, sucursal_id, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, nombre, descripcion, tipo, activa, fecha_desde, fecha_hasta, sucursal_id, usuario_id, active, created_at, updated_at
`

type CreateListaPrecioParams struct {
	Nombre      string      `json:"nombre"`
	Descripcion pgtype.Text `json:"descripcion"`
	Tipo        string      `json:"tipo"`
	Activa      bool        `json:"activa"`
	FechaDesde  pgtype.Date `json:"fecha_desde"`
	FechaHasta  pgtype.Date `json:"fecha_hasta"`
	SucursalID  pgtype.UUID `json:"sucursal_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CreateListaPrecio(ctx context.Context, arg CreateListaPrecioParams) (ListaPrecio, error) {
	row := q.db.QueryRow(ctx, createListaPrecio,
		arg.Nombre,
		arg.Descripcion,
		arg.Tipo,
		arg.Activa,
		arg.FechaDesde,
		arg.FechaHasta,
		arg.SucursalID,
		arg.UsuarioID,
	)
	var i ListaPrecio
	err := row.Scan(
		&i.ID, &i.Nombre, &i.Descripcion, &i.Tipo, &i.Activa,
		&i.FechaDesde, &i.FechaHasta, &i.SucursalID, &i.UsuarioID,
		&i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const getListaPrecioByID = `-- name: GetListaPrecioByID :one
SELECT id, nombre, descripcion, tipo, activa, fecha_desde, fecha_hasta, sucursal_id, usuario_id, active, created_at, updated_at
FROM listas_precios
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

type GetListaPrecioByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetListaPrecioByID(ctx context.Context, arg GetListaPrecioByIDParams) (ListaPrecio, error) {
	row := q.db.QueryRow(ctx, getListaPrecioByID, arg.ID, arg.UsuarioID)
	var i ListaPrecio
	err := row.Scan(
		&i.ID, &i.Nombre, &i.Descripcion, &i.Tipo, &i.Activa,
		&i.FechaDesde, &i.FechaHasta, &i.SucursalID, &i.UsuarioID,
		&i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listListasPrecios = `-- name: ListListasPrecios :many
SELECT id, nombre, descripcion, tipo, activa, fecha_desde, fecha_hasta, sucursal_id, usuario_id, active, created_at, updated_at
FROM listas_precios
WHERE usuario_id = $1 AND active = TRUE
ORDER BY nombre ASC
LIMIT $2 OFFSET $3
`

type ListListasPreciosParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListListasPrecios(ctx context.Context, arg ListListasPreciosParams) ([]ListaPrecio, error) {
	rows, err := q.db.Query(ctx, listListasPrecios, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListaPrecio
	for rows.Next() {
		var i ListaPrecio
		if err := rows.Scan(
			&i.ID, &i.Nombre, &i.Descripcion, &i.Tipo, &i.Activa,
			&i.FechaDesde, &i.FechaHasta, &i.SucursalID, &i.UsuarioID,
			&i.Active, &i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countListasPrecios = `-- name: CountListasPrecios :one
SELECT COUNT(*) FROM listas_precios
WHERE usuario_id = $1 AND active = TRUE
`

func (q *Queries) CountListasPrecios(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countListasPrecios, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const updateListaPrecio = `-- name: UpdateListaPrecio :one
UPDATE listas_precios
SET nombre = $3, descripcion = $4, tipo = $5, activa = $6, fecha_desde = $7, fecha_hasta = $8, sucursal_id = $9, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, nombre, descripcion, tipo, activa, fecha_desde, fecha_hasta, sucursal_id, usuario_id, active, created_at, updated_at
`

type UpdateListaPrecioParams struct {
	ID          pgtype.UUID `json:"id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	Nombre      string      `json:"nombre"`
	Descripcion pgtype.Text `json:"descripcion"`
	Tipo        string      `json:"tipo"`
	Activa      bool        `json:"activa"`
	FechaDesde  pgtype.Date `json:"fecha_desde"`
	FechaHasta  pgtype.Date `json:"fecha_hasta"`
	SucursalID  pgtype.UUID `json:"sucursal_id"`
}

func (q *Queries) UpdateListaPrecio(ctx context.Context, arg UpdateListaPrecioParams) (ListaPrecio, error) {
	row := q.db.QueryRow(ctx, updateListaPrecio,
		arg.ID, arg.UsuarioID, arg.Nombre, arg.Descripcion, arg.Tipo,
		arg.Activa, arg.FechaDesde, arg.FechaHasta, arg.SucursalID,
	)
	var i ListaPrecio
	err := row.Scan(
		&i.ID, &i.Nombre, &i.Descripcion, &i.Tipo, &i.Activa,
		&i.FechaDesde, &i.FechaHasta, &i.SucursalID, &i.UsuarioID,
		&i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const softDeleteListaPrecio = `-- name: SoftDeleteListaPrecio :exec
UPDATE listas_precios SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteListaPrecioParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteListaPrecio(ctx context.Context, arg SoftDeleteListaPrecioParams) error {
	_, err := q.db.Exec(ctx, softDeleteListaPrecio, arg.ID, arg.UsuarioID)
	return err
}

// --- Precios Lista CRUD ---

const listPreciosLista = `-- name: ListPreciosLista :many
SELECT pl.id, pl.lista_id, pl.producto_id, pl.precio, pl.descuento_porcentaje,
       p.nombre AS producto_nombre, p.codigo AS producto_codigo
FROM precios_lista pl
JOIN productos p ON p.id = pl.producto_id
WHERE pl.lista_id = $1
ORDER BY p.nombre ASC
`

type ListPreciosListaRow struct {
	ID                  pgtype.UUID    `json:"id"`
	ListaID             pgtype.UUID    `json:"lista_id"`
	ProductoID          pgtype.UUID    `json:"producto_id"`
	Precio              pgtype.Numeric `json:"precio"`
	DescuentoPorcentaje pgtype.Numeric `json:"descuento_porcentaje"`
	ProductoNombre      string         `json:"producto_nombre"`
	ProductoCodigo      pgtype.Text    `json:"producto_codigo"`
}

func (q *Queries) ListPreciosLista(ctx context.Context, listaID pgtype.UUID) ([]ListPreciosListaRow, error) {
	rows, err := q.db.Query(ctx, listPreciosLista, listaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListPreciosListaRow
	for rows.Next() {
		var i ListPreciosListaRow
		if err := rows.Scan(
			&i.ID, &i.ListaID, &i.ProductoID, &i.Precio, &i.DescuentoPorcentaje,
			&i.ProductoNombre, &i.ProductoCodigo,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const upsertPrecioLista = `-- name: UpsertPrecioLista :one
INSERT INTO precios_lista (lista_id, producto_id, precio, descuento_porcentaje)
VALUES ($1, $2, $3, $4)
ON CONFLICT (lista_id, producto_id) DO UPDATE SET precio = $3, descuento_porcentaje = $4
RETURNING id, lista_id, producto_id, precio, descuento_porcentaje
`

type UpsertPrecioListaParams struct {
	ListaID             pgtype.UUID    `json:"lista_id"`
	ProductoID          pgtype.UUID    `json:"producto_id"`
	Precio              pgtype.Numeric `json:"precio"`
	DescuentoPorcentaje pgtype.Numeric `json:"descuento_porcentaje"`
}

func (q *Queries) UpsertPrecioLista(ctx context.Context, arg UpsertPrecioListaParams) (PrecioLista, error) {
	row := q.db.QueryRow(ctx, upsertPrecioLista,
		arg.ListaID, arg.ProductoID, arg.Precio, arg.DescuentoPorcentaje,
	)
	var i PrecioLista
	err := row.Scan(&i.ID, &i.ListaID, &i.ProductoID, &i.Precio, &i.DescuentoPorcentaje)
	return i, err
}

const deletePrecioLista = `-- name: DeletePrecioLista :exec
DELETE FROM precios_lista WHERE id = $1 AND lista_id = $2
`

type DeletePrecioListaParams struct {
	ID      pgtype.UUID `json:"id"`
	ListaID pgtype.UUID `json:"lista_id"`
}

func (q *Queries) DeletePrecioLista(ctx context.Context, arg DeletePrecioListaParams) error {
	_, err := q.db.Exec(ctx, deletePrecioLista, arg.ID, arg.ListaID)
	return err
}

const getPrecioByProductoAndLista = `-- name: GetPrecioByProductoAndLista :one
SELECT pl.id, pl.lista_id, pl.producto_id, pl.precio, pl.descuento_porcentaje
FROM precios_lista pl
WHERE pl.producto_id = $1 AND pl.lista_id = $2
`

type GetPrecioByProductoAndListaParams struct {
	ProductoID pgtype.UUID `json:"producto_id"`
	ListaID    pgtype.UUID `json:"lista_id"`
}

func (q *Queries) GetPrecioByProductoAndLista(ctx context.Context, arg GetPrecioByProductoAndListaParams) (PrecioLista, error) {
	row := q.db.QueryRow(ctx, getPrecioByProductoAndLista, arg.ProductoID, arg.ListaID)
	var i PrecioLista
	err := row.Scan(&i.ID, &i.ListaID, &i.ProductoID, &i.Precio, &i.DescuentoPorcentaje)
	return i, err
}
