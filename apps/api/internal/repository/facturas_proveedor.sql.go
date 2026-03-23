package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// --- Models ---

type FacturaProveedor struct {
	ID               pgtype.UUID        `json:"id"`
	Numero           string             `json:"numero"`
	ProveedorID      pgtype.UUID        `json:"proveedor_id"`
	OrdenCompraID    pgtype.UUID        `json:"orden_compra_id"`
	SucursalID       pgtype.UUID        `json:"sucursal_id"`
	Tipo             string             `json:"tipo"`
	FechaEmision     pgtype.Date        `json:"fecha_emision"`
	FechaVencimiento pgtype.Date        `json:"fecha_vencimiento"`
	Subtotal         pgtype.Numeric     `json:"subtotal"`
	Impuestos        pgtype.Numeric     `json:"impuestos"`
	Total            pgtype.Numeric     `json:"total"`
	Estado           string             `json:"estado"`
	Observaciones    pgtype.Text        `json:"observaciones"`
	UsuarioID        pgtype.UUID        `json:"usuario_id"`
	Active           bool               `json:"active"`
	CreatedAt        pgtype.Timestamptz `json:"created_at"`
	UpdatedAt        pgtype.Timestamptz `json:"updated_at"`
}

type DetalleFacturaProveedor struct {
	ID             pgtype.UUID    `json:"id"`
	FacturaID      pgtype.UUID    `json:"factura_id"`
	ProductoID     pgtype.UUID    `json:"producto_id"`
	Descripcion    string         `json:"descripcion"`
	Cantidad       pgtype.Numeric `json:"cantidad"`
	PrecioUnitario pgtype.Numeric `json:"precio_unitario"`
	Subtotal       pgtype.Numeric `json:"subtotal"`
}

// --- Params ---

type CreateFacturaProveedorParams struct {
	Numero           string         `json:"numero"`
	ProveedorID      pgtype.UUID    `json:"proveedor_id"`
	OrdenCompraID    pgtype.UUID    `json:"orden_compra_id"`
	SucursalID       pgtype.UUID    `json:"sucursal_id"`
	Tipo             string         `json:"tipo"`
	FechaEmision     pgtype.Date    `json:"fecha_emision"`
	FechaVencimiento pgtype.Date    `json:"fecha_vencimiento"`
	Subtotal         pgtype.Numeric `json:"subtotal"`
	Impuestos        pgtype.Numeric `json:"impuestos"`
	Total            pgtype.Numeric `json:"total"`
	Observaciones    pgtype.Text    `json:"observaciones"`
	UsuarioID        pgtype.UUID    `json:"usuario_id"`
}

type CreateDetalleFacturaProveedorParams struct {
	FacturaID      pgtype.UUID    `json:"factura_id"`
	ProductoID     pgtype.UUID    `json:"producto_id"`
	Descripcion    string         `json:"descripcion"`
	Cantidad       pgtype.Numeric `json:"cantidad"`
	PrecioUnitario pgtype.Numeric `json:"precio_unitario"`
	Subtotal       pgtype.Numeric `json:"subtotal"`
}

type ListFacturasProveedorParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

type GetFacturaProveedorByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type UpdateFacturaProveedorEstadoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Estado    string      `json:"estado"`
}

type SoftDeleteFacturaProveedorParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

// --- Row types ---

type ListFacturasProveedorRow struct {
	ID              pgtype.UUID        `json:"id"`
	Numero          string             `json:"numero"`
	ProveedorID     pgtype.UUID        `json:"proveedor_id"`
	SucursalID      pgtype.UUID        `json:"sucursal_id"`
	Tipo            string             `json:"tipo"`
	FechaEmision    pgtype.Date        `json:"fecha_emision"`
	Total           pgtype.Numeric     `json:"total"`
	Estado          string             `json:"estado"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	ProveedorNombre string             `json:"proveedor_nombre"`
	SucursalNombre  string             `json:"sucursal_nombre"`
}

type GetFacturaProveedorByIDRow struct {
	ID               pgtype.UUID        `json:"id"`
	Numero           string             `json:"numero"`
	ProveedorID      pgtype.UUID        `json:"proveedor_id"`
	OrdenCompraID    pgtype.UUID        `json:"orden_compra_id"`
	SucursalID       pgtype.UUID        `json:"sucursal_id"`
	Tipo             string             `json:"tipo"`
	FechaEmision     pgtype.Date        `json:"fecha_emision"`
	FechaVencimiento pgtype.Date        `json:"fecha_vencimiento"`
	Subtotal         pgtype.Numeric     `json:"subtotal"`
	Impuestos        pgtype.Numeric     `json:"impuestos"`
	Total            pgtype.Numeric     `json:"total"`
	Estado           string             `json:"estado"`
	Observaciones    pgtype.Text        `json:"observaciones"`
	UsuarioID        pgtype.UUID        `json:"usuario_id"`
	Active           bool               `json:"active"`
	CreatedAt        pgtype.Timestamptz `json:"created_at"`
	UpdatedAt        pgtype.Timestamptz `json:"updated_at"`
	ProveedorNombre  string             `json:"proveedor_nombre"`
	SucursalNombre   string             `json:"sucursal_nombre"`
	OrdenCompraNum   pgtype.Text        `json:"orden_compra_num"`
}

// --- SQL constants ---

const createFacturaProveedor = `-- name: CreateFacturaProveedor :one
INSERT INTO facturas_proveedor (
  numero, proveedor_id, orden_compra_id, sucursal_id, tipo,
  fecha_emision, fecha_vencimiento, subtotal, impuestos, total,
  observaciones, usuario_id
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9, $10,
  $11, $12
) RETURNING id, numero, proveedor_id, orden_compra_id, sucursal_id, tipo,
  fecha_emision, fecha_vencimiento, subtotal, impuestos, total,
  estado, observaciones, usuario_id, active, created_at, updated_at
`

func (q *Queries) CreateFacturaProveedor(ctx context.Context, arg CreateFacturaProveedorParams) (FacturaProveedor, error) {
	row := q.db.QueryRow(ctx, createFacturaProveedor,
		arg.Numero, arg.ProveedorID, arg.OrdenCompraID, arg.SucursalID, arg.Tipo,
		arg.FechaEmision, arg.FechaVencimiento, arg.Subtotal, arg.Impuestos, arg.Total,
		arg.Observaciones, arg.UsuarioID,
	)
	var i FacturaProveedor
	err := row.Scan(
		&i.ID, &i.Numero, &i.ProveedorID, &i.OrdenCompraID, &i.SucursalID, &i.Tipo,
		&i.FechaEmision, &i.FechaVencimiento, &i.Subtotal, &i.Impuestos, &i.Total,
		&i.Estado, &i.Observaciones, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const createDetalleFacturaProveedor = `-- name: CreateDetalleFacturaProveedor :one
INSERT INTO detalle_factura_proveedor (factura_id, producto_id, descripcion, cantidad, precio_unitario, subtotal)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, factura_id, producto_id, descripcion, cantidad, precio_unitario, subtotal
`

func (q *Queries) CreateDetalleFacturaProveedor(ctx context.Context, arg CreateDetalleFacturaProveedorParams) (DetalleFacturaProveedor, error) {
	row := q.db.QueryRow(ctx, createDetalleFacturaProveedor,
		arg.FacturaID, arg.ProductoID, arg.Descripcion, arg.Cantidad, arg.PrecioUnitario, arg.Subtotal,
	)
	var i DetalleFacturaProveedor
	err := row.Scan(
		&i.ID, &i.FacturaID, &i.ProductoID, &i.Descripcion, &i.Cantidad, &i.PrecioUnitario, &i.Subtotal,
	)
	return i, err
}

const getFacturaProveedorByID = `-- name: GetFacturaProveedorByID :one
SELECT fp.id, fp.numero, fp.proveedor_id, fp.orden_compra_id, fp.sucursal_id, fp.tipo,
       fp.fecha_emision, fp.fecha_vencimiento, fp.subtotal, fp.impuestos, fp.total,
       fp.estado, fp.observaciones, fp.usuario_id, fp.active, fp.created_at, fp.updated_at,
       p.nombre AS proveedor_nombre,
       s.nombre AS sucursal_nombre,
       oc.numero AS orden_compra_num
FROM facturas_proveedor fp
JOIN proveedores p ON p.id = fp.proveedor_id
JOIN sucursales s ON s.id = fp.sucursal_id
LEFT JOIN ordenes_compra oc ON oc.id = fp.orden_compra_id
WHERE fp.id = $1 AND fp.usuario_id = $2 AND fp.active = TRUE
`

func (q *Queries) GetFacturaProveedorByID(ctx context.Context, arg GetFacturaProveedorByIDParams) (GetFacturaProveedorByIDRow, error) {
	row := q.db.QueryRow(ctx, getFacturaProveedorByID, arg.ID, arg.UsuarioID)
	var i GetFacturaProveedorByIDRow
	err := row.Scan(
		&i.ID, &i.Numero, &i.ProveedorID, &i.OrdenCompraID, &i.SucursalID, &i.Tipo,
		&i.FechaEmision, &i.FechaVencimiento, &i.Subtotal, &i.Impuestos, &i.Total,
		&i.Estado, &i.Observaciones, &i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		&i.ProveedorNombre, &i.SucursalNombre, &i.OrdenCompraNum,
	)
	return i, err
}

const listFacturasProveedor = `-- name: ListFacturasProveedor :many
SELECT fp.id, fp.numero, fp.proveedor_id, fp.sucursal_id, fp.tipo,
       fp.fecha_emision, fp.total, fp.estado, fp.created_at,
       p.nombre AS proveedor_nombre,
       s.nombre AS sucursal_nombre
FROM facturas_proveedor fp
JOIN proveedores p ON p.id = fp.proveedor_id
JOIN sucursales s ON s.id = fp.sucursal_id
WHERE fp.usuario_id = $1 AND fp.active = TRUE
ORDER BY fp.created_at DESC
LIMIT $2 OFFSET $3
`

func (q *Queries) ListFacturasProveedor(ctx context.Context, arg ListFacturasProveedorParams) ([]ListFacturasProveedorRow, error) {
	rows, err := q.db.Query(ctx, listFacturasProveedor, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListFacturasProveedorRow
	for rows.Next() {
		var i ListFacturasProveedorRow
		if err := rows.Scan(
			&i.ID, &i.Numero, &i.ProveedorID, &i.SucursalID, &i.Tipo,
			&i.FechaEmision, &i.Total, &i.Estado, &i.CreatedAt,
			&i.ProveedorNombre, &i.SucursalNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countFacturasProveedor = `-- name: CountFacturasProveedor :one
SELECT COUNT(*) FROM facturas_proveedor
WHERE usuario_id = $1 AND active = TRUE
`

func (q *Queries) CountFacturasProveedor(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countFacturasProveedor, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const updateFacturaProveedorEstado = `-- name: UpdateFacturaProveedorEstado :exec
UPDATE facturas_proveedor
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

func (q *Queries) UpdateFacturaProveedorEstado(ctx context.Context, arg UpdateFacturaProveedorEstadoParams) error {
	_, err := q.db.Exec(ctx, updateFacturaProveedorEstado, arg.ID, arg.UsuarioID, arg.Estado)
	return err
}

const softDeleteFacturaProveedor = `-- name: SoftDeleteFacturaProveedor :exec
UPDATE facturas_proveedor SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

func (q *Queries) SoftDeleteFacturaProveedor(ctx context.Context, arg SoftDeleteFacturaProveedorParams) error {
	_, err := q.db.Exec(ctx, softDeleteFacturaProveedor, arg.ID, arg.UsuarioID)
	return err
}

const listDetallesByFacturaProveedor = `-- name: ListDetallesByFacturaProveedor :many
SELECT id, factura_id, producto_id, descripcion, cantidad, precio_unitario, subtotal
FROM detalle_factura_proveedor
WHERE factura_id = $1
ORDER BY id ASC
`

func (q *Queries) ListDetallesByFacturaProveedor(ctx context.Context, facturaID pgtype.UUID) ([]DetalleFacturaProveedor, error) {
	rows, err := q.db.Query(ctx, listDetallesByFacturaProveedor, facturaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []DetalleFacturaProveedor
	for rows.Next() {
		var i DetalleFacturaProveedor
		if err := rows.Scan(
			&i.ID, &i.FacturaID, &i.ProductoID, &i.Descripcion, &i.Cantidad, &i.PrecioUnitario, &i.Subtotal,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}
