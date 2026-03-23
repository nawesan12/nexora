package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// --- Models ---

type VarianteProducto struct {
	ID         pgtype.UUID        `json:"id"`
	ProductoID pgtype.UUID        `json:"producto_id"`
	Nombre     string             `json:"nombre"`
	UsuarioID  pgtype.UUID        `json:"usuario_id"`
	Active     bool               `json:"active"`
	CreatedAt  pgtype.Timestamptz `json:"created_at"`
}

type OpcionVariante struct {
	ID         pgtype.UUID `json:"id"`
	VarianteID pgtype.UUID `json:"variante_id"`
	Valor      string      `json:"valor"`
	Orden      int32       `json:"orden"`
	Active     bool        `json:"active"`
}

type SkuVariante struct {
	ID              pgtype.UUID        `json:"id"`
	ProductoID      pgtype.UUID        `json:"producto_id"`
	Sku             pgtype.Text        `json:"sku"`
	PrecioAdicional pgtype.Numeric     `json:"precio_adicional"`
	StockAdicional  int32              `json:"stock_adicional"`
	OpcionesIDs     []pgtype.UUID      `json:"opciones_ids"`
	UsuarioID       pgtype.UUID        `json:"usuario_id"`
	Active          bool               `json:"active"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	UpdatedAt       pgtype.Timestamptz `json:"updated_at"`
}

// --- Variantes ---

const createVariante = `-- name: CreateVariante :one
INSERT INTO variantes_producto (producto_id, nombre, usuario_id)
VALUES ($1, $2, $3)
RETURNING id, producto_id, nombre, usuario_id, active, created_at
`

type CreateVarianteParams struct {
	ProductoID pgtype.UUID `json:"producto_id"`
	Nombre     string      `json:"nombre"`
	UsuarioID  pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CreateVariante(ctx context.Context, arg CreateVarianteParams) (VarianteProducto, error) {
	row := q.db.QueryRow(ctx, createVariante, arg.ProductoID, arg.Nombre, arg.UsuarioID)
	var i VarianteProducto
	err := row.Scan(&i.ID, &i.ProductoID, &i.Nombre, &i.UsuarioID, &i.Active, &i.CreatedAt)
	return i, err
}

const listVariantesByProducto = `-- name: ListVariantesByProducto :many
SELECT id, producto_id, nombre, usuario_id, active, created_at
FROM variantes_producto
WHERE producto_id = $1 AND usuario_id = $2 AND active = TRUE
ORDER BY created_at ASC
`

type ListVariantesByProductoParams struct {
	ProductoID pgtype.UUID `json:"producto_id"`
	UsuarioID  pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) ListVariantesByProducto(ctx context.Context, arg ListVariantesByProductoParams) ([]VarianteProducto, error) {
	rows, err := q.db.Query(ctx, listVariantesByProducto, arg.ProductoID, arg.UsuarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []VarianteProducto
	for rows.Next() {
		var i VarianteProducto
		if err := rows.Scan(&i.ID, &i.ProductoID, &i.Nombre, &i.UsuarioID, &i.Active, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const deleteVariante = `-- name: DeleteVariante :exec
UPDATE variantes_producto SET active = FALSE
WHERE id = $1 AND usuario_id = $2
`

type DeleteVarianteParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) DeleteVariante(ctx context.Context, arg DeleteVarianteParams) error {
	_, err := q.db.Exec(ctx, deleteVariante, arg.ID, arg.UsuarioID)
	return err
}

// --- Opciones ---

const createOpcion = `-- name: CreateOpcion :one
INSERT INTO opciones_variante (variante_id, valor, orden)
VALUES ($1, $2, $3)
RETURNING id, variante_id, valor, orden, active
`

type CreateOpcionParams struct {
	VarianteID pgtype.UUID `json:"variante_id"`
	Valor      string      `json:"valor"`
	Orden      int32       `json:"orden"`
}

func (q *Queries) CreateOpcion(ctx context.Context, arg CreateOpcionParams) (OpcionVariante, error) {
	row := q.db.QueryRow(ctx, createOpcion, arg.VarianteID, arg.Valor, arg.Orden)
	var i OpcionVariante
	err := row.Scan(&i.ID, &i.VarianteID, &i.Valor, &i.Orden, &i.Active)
	return i, err
}

const listOpcionesByVariante = `-- name: ListOpcionesByVariante :many
SELECT id, variante_id, valor, orden, active
FROM opciones_variante
WHERE variante_id = $1 AND active = TRUE
ORDER BY orden ASC, valor ASC
`

func (q *Queries) ListOpcionesByVariante(ctx context.Context, varianteID pgtype.UUID) ([]OpcionVariante, error) {
	rows, err := q.db.Query(ctx, listOpcionesByVariante, varianteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []OpcionVariante
	for rows.Next() {
		var i OpcionVariante
		if err := rows.Scan(&i.ID, &i.VarianteID, &i.Valor, &i.Orden, &i.Active); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const deleteOpcion = `-- name: DeleteOpcion :exec
UPDATE opciones_variante SET active = FALSE
WHERE id = $1
`

func (q *Queries) DeleteOpcion(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteOpcion, id)
	return err
}

// --- SKU Variantes ---

const createSKU = `-- name: CreateSKU :one
INSERT INTO sku_variantes (producto_id, sku, precio_adicional, stock_adicional, opciones_ids, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, producto_id, sku, precio_adicional, stock_adicional, opciones_ids, usuario_id, active, created_at, updated_at
`

type CreateSKUParams struct {
	ProductoID      pgtype.UUID    `json:"producto_id"`
	Sku             pgtype.Text    `json:"sku"`
	PrecioAdicional pgtype.Numeric `json:"precio_adicional"`
	StockAdicional  int32          `json:"stock_adicional"`
	OpcionesIDs     []pgtype.UUID  `json:"opciones_ids"`
	UsuarioID       pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateSKU(ctx context.Context, arg CreateSKUParams) (SkuVariante, error) {
	row := q.db.QueryRow(ctx, createSKU,
		arg.ProductoID, arg.Sku, arg.PrecioAdicional, arg.StockAdicional, arg.OpcionesIDs, arg.UsuarioID,
	)
	var i SkuVariante
	err := row.Scan(
		&i.ID, &i.ProductoID, &i.Sku, &i.PrecioAdicional, &i.StockAdicional,
		&i.OpcionesIDs, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listSKUsByProducto = `-- name: ListSKUsByProducto :many
SELECT id, producto_id, sku, precio_adicional, stock_adicional, opciones_ids, usuario_id, active, created_at, updated_at
FROM sku_variantes
WHERE producto_id = $1 AND usuario_id = $2 AND active = TRUE
ORDER BY created_at ASC
`

type ListSKUsByProductoParams struct {
	ProductoID pgtype.UUID `json:"producto_id"`
	UsuarioID  pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) ListSKUsByProducto(ctx context.Context, arg ListSKUsByProductoParams) ([]SkuVariante, error) {
	rows, err := q.db.Query(ctx, listSKUsByProducto, arg.ProductoID, arg.UsuarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []SkuVariante
	for rows.Next() {
		var i SkuVariante
		if err := rows.Scan(
			&i.ID, &i.ProductoID, &i.Sku, &i.PrecioAdicional, &i.StockAdicional,
			&i.OpcionesIDs, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const getSKU = `-- name: GetSKU :one
SELECT id, producto_id, sku, precio_adicional, stock_adicional, opciones_ids, usuario_id, active, created_at, updated_at
FROM sku_variantes
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

type GetSKUParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetSKU(ctx context.Context, arg GetSKUParams) (SkuVariante, error) {
	row := q.db.QueryRow(ctx, getSKU, arg.ID, arg.UsuarioID)
	var i SkuVariante
	err := row.Scan(
		&i.ID, &i.ProductoID, &i.Sku, &i.PrecioAdicional, &i.StockAdicional,
		&i.OpcionesIDs, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const updateSKU = `-- name: UpdateSKU :one
UPDATE sku_variantes
SET sku = $3, precio_adicional = $4, stock_adicional = $5, opciones_ids = $6, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, producto_id, sku, precio_adicional, stock_adicional, opciones_ids, usuario_id, active, created_at, updated_at
`

type UpdateSKUParams struct {
	ID              pgtype.UUID    `json:"id"`
	UsuarioID       pgtype.UUID    `json:"usuario_id"`
	Sku             pgtype.Text    `json:"sku"`
	PrecioAdicional pgtype.Numeric `json:"precio_adicional"`
	StockAdicional  int32          `json:"stock_adicional"`
	OpcionesIDs     []pgtype.UUID  `json:"opciones_ids"`
}

func (q *Queries) UpdateSKU(ctx context.Context, arg UpdateSKUParams) (SkuVariante, error) {
	row := q.db.QueryRow(ctx, updateSKU,
		arg.ID, arg.UsuarioID, arg.Sku, arg.PrecioAdicional, arg.StockAdicional, arg.OpcionesIDs,
	)
	var i SkuVariante
	err := row.Scan(
		&i.ID, &i.ProductoID, &i.Sku, &i.PrecioAdicional, &i.StockAdicional,
		&i.OpcionesIDs, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const softDeleteSKU = `-- name: SoftDeleteSKU :exec
UPDATE sku_variantes SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteSKUParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteSKU(ctx context.Context, arg SoftDeleteSKUParams) error {
	_, err := q.db.Exec(ctx, softDeleteSKU, arg.ID, arg.UsuarioID)
	return err
}
