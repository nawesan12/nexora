package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// --- Models ---

type DevolucionProveedor struct {
	ID            pgtype.UUID        `json:"id"`
	Numero        string             `json:"numero"`
	ProveedorID   pgtype.UUID        `json:"proveedor_id"`
	OrdenCompraID pgtype.UUID        `json:"orden_compra_id"`
	SucursalID    pgtype.UUID        `json:"sucursal_id"`
	Motivo        string             `json:"motivo"`
	Estado        string             `json:"estado"`
	Fecha         pgtype.Date        `json:"fecha"`
	Observaciones pgtype.Text        `json:"observaciones"`
	UsuarioID     pgtype.UUID        `json:"usuario_id"`
	Active        bool               `json:"active"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
}

type DetalleDevolucionProveedor struct {
	ID           pgtype.UUID `json:"id"`
	DevolucionID pgtype.UUID `json:"devolucion_id"`
	ProductoID   pgtype.UUID `json:"producto_id"`
	Cantidad     int32       `json:"cantidad"`
	MotivoItem   pgtype.Text `json:"motivo_item"`
}

// --- Params ---

type CreateDevolucionProveedorParams struct {
	Numero        string      `json:"numero"`
	ProveedorID   pgtype.UUID `json:"proveedor_id"`
	OrdenCompraID pgtype.UUID `json:"orden_compra_id"`
	SucursalID    pgtype.UUID `json:"sucursal_id"`
	Motivo        string      `json:"motivo"`
	Fecha         pgtype.Date `json:"fecha"`
	Observaciones pgtype.Text `json:"observaciones"`
	UsuarioID     pgtype.UUID `json:"usuario_id"`
}

type CreateDetalleDevolucionProveedorParams struct {
	DevolucionID pgtype.UUID `json:"devolucion_id"`
	ProductoID   pgtype.UUID `json:"producto_id"`
	Cantidad     int32       `json:"cantidad"`
	MotivoItem   pgtype.Text `json:"motivo_item"`
}

type ListDevolucionesProveedorParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

type GetDevolucionProveedorByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type UpdateDevolucionProveedorEstadoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Estado    string      `json:"estado"`
}

type SoftDeleteDevolucionProveedorParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

// --- Row types ---

type ListDevolucionesProveedorRow struct {
	ID              pgtype.UUID        `json:"id"`
	Numero          string             `json:"numero"`
	ProveedorID     pgtype.UUID        `json:"proveedor_id"`
	Motivo          string             `json:"motivo"`
	Estado          string             `json:"estado"`
	Fecha           pgtype.Date        `json:"fecha"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	ProveedorNombre string             `json:"proveedor_nombre"`
}

type GetDevolucionProveedorByIDRow struct {
	ID            pgtype.UUID        `json:"id"`
	Numero        string             `json:"numero"`
	ProveedorID   pgtype.UUID        `json:"proveedor_id"`
	OrdenCompraID pgtype.UUID        `json:"orden_compra_id"`
	SucursalID    pgtype.UUID        `json:"sucursal_id"`
	Motivo        string             `json:"motivo"`
	Estado        string             `json:"estado"`
	Fecha         pgtype.Date        `json:"fecha"`
	Observaciones pgtype.Text        `json:"observaciones"`
	UsuarioID     pgtype.UUID        `json:"usuario_id"`
	Active        bool               `json:"active"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
	ProveedorNombre string           `json:"proveedor_nombre"`
	SucursalNombre  string           `json:"sucursal_nombre"`
	OrdenCompraNum  pgtype.Text      `json:"orden_compra_num"`
}

type ListDetallesDevolucionProveedorRow struct {
	ID             pgtype.UUID `json:"id"`
	DevolucionID   pgtype.UUID `json:"devolucion_id"`
	ProductoID     pgtype.UUID `json:"producto_id"`
	Cantidad       int32       `json:"cantidad"`
	MotivoItem     pgtype.Text `json:"motivo_item"`
	ProductoNombre string      `json:"producto_nombre"`
	ProductoCodigo pgtype.Text `json:"producto_codigo"`
}

// --- SQL constants ---

const createDevolucionProveedor = `-- name: CreateDevolucionProveedor :one
INSERT INTO devoluciones_proveedor (
  numero, proveedor_id, orden_compra_id, sucursal_id, motivo, fecha, observaciones, usuario_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING id, numero, proveedor_id, orden_compra_id, sucursal_id, motivo, estado, fecha,
  observaciones, usuario_id, active, created_at, updated_at
`

func (q *Queries) CreateDevolucionProveedor(ctx context.Context, arg CreateDevolucionProveedorParams) (DevolucionProveedor, error) {
	row := q.db.QueryRow(ctx, createDevolucionProveedor,
		arg.Numero, arg.ProveedorID, arg.OrdenCompraID, arg.SucursalID,
		arg.Motivo, arg.Fecha, arg.Observaciones, arg.UsuarioID,
	)
	var i DevolucionProveedor
	err := row.Scan(
		&i.ID, &i.Numero, &i.ProveedorID, &i.OrdenCompraID, &i.SucursalID,
		&i.Motivo, &i.Estado, &i.Fecha, &i.Observaciones, &i.UsuarioID,
		&i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const createDetalleDevolucionProveedor = `-- name: CreateDetalleDevolucionProveedor :one
INSERT INTO detalle_devolucion_proveedor (devolucion_id, producto_id, cantidad, motivo_item)
VALUES ($1, $2, $3, $4)
RETURNING id, devolucion_id, producto_id, cantidad, motivo_item
`

func (q *Queries) CreateDetalleDevolucionProveedor(ctx context.Context, arg CreateDetalleDevolucionProveedorParams) (DetalleDevolucionProveedor, error) {
	row := q.db.QueryRow(ctx, createDetalleDevolucionProveedor,
		arg.DevolucionID, arg.ProductoID, arg.Cantidad, arg.MotivoItem,
	)
	var i DetalleDevolucionProveedor
	err := row.Scan(
		&i.ID, &i.DevolucionID, &i.ProductoID, &i.Cantidad, &i.MotivoItem,
	)
	return i, err
}

const getDevolucionProveedorByID = `-- name: GetDevolucionProveedorByID :one
SELECT dp.id, dp.numero, dp.proveedor_id, dp.orden_compra_id, dp.sucursal_id,
       dp.motivo, dp.estado, dp.fecha, dp.observaciones, dp.usuario_id,
       dp.active, dp.created_at, dp.updated_at,
       p.nombre AS proveedor_nombre,
       s.nombre AS sucursal_nombre,
       oc.numero AS orden_compra_num
FROM devoluciones_proveedor dp
JOIN proveedores p ON p.id = dp.proveedor_id
JOIN sucursales s ON s.id = dp.sucursal_id
LEFT JOIN ordenes_compra oc ON oc.id = dp.orden_compra_id
WHERE dp.id = $1 AND dp.usuario_id = $2 AND dp.active = TRUE
`

func (q *Queries) GetDevolucionProveedorByID(ctx context.Context, arg GetDevolucionProveedorByIDParams) (GetDevolucionProveedorByIDRow, error) {
	row := q.db.QueryRow(ctx, getDevolucionProveedorByID, arg.ID, arg.UsuarioID)
	var i GetDevolucionProveedorByIDRow
	err := row.Scan(
		&i.ID, &i.Numero, &i.ProveedorID, &i.OrdenCompraID, &i.SucursalID,
		&i.Motivo, &i.Estado, &i.Fecha, &i.Observaciones, &i.UsuarioID,
		&i.Active, &i.CreatedAt, &i.UpdatedAt,
		&i.ProveedorNombre, &i.SucursalNombre, &i.OrdenCompraNum,
	)
	return i, err
}

const listDevolucionesProveedor = `-- name: ListDevolucionesProveedor :many
SELECT dp.id, dp.numero, dp.proveedor_id, dp.motivo, dp.estado, dp.fecha, dp.created_at,
       p.nombre AS proveedor_nombre
FROM devoluciones_proveedor dp
JOIN proveedores p ON p.id = dp.proveedor_id
WHERE dp.usuario_id = $1 AND dp.active = TRUE
ORDER BY dp.created_at DESC
LIMIT $2 OFFSET $3
`

func (q *Queries) ListDevolucionesProveedor(ctx context.Context, arg ListDevolucionesProveedorParams) ([]ListDevolucionesProveedorRow, error) {
	rows, err := q.db.Query(ctx, listDevolucionesProveedor, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListDevolucionesProveedorRow
	for rows.Next() {
		var i ListDevolucionesProveedorRow
		if err := rows.Scan(
			&i.ID, &i.Numero, &i.ProveedorID, &i.Motivo, &i.Estado, &i.Fecha, &i.CreatedAt,
			&i.ProveedorNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countDevolucionesProveedor = `-- name: CountDevolucionesProveedor :one
SELECT COUNT(*) FROM devoluciones_proveedor
WHERE usuario_id = $1 AND active = TRUE
`

func (q *Queries) CountDevolucionesProveedor(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countDevolucionesProveedor, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const updateDevolucionProveedorEstado = `-- name: UpdateDevolucionProveedorEstado :exec
UPDATE devoluciones_proveedor
SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

func (q *Queries) UpdateDevolucionProveedorEstado(ctx context.Context, arg UpdateDevolucionProveedorEstadoParams) error {
	_, err := q.db.Exec(ctx, updateDevolucionProveedorEstado, arg.ID, arg.UsuarioID, arg.Estado)
	return err
}

const softDeleteDevolucionProveedor = `-- name: SoftDeleteDevolucionProveedor :exec
UPDATE devoluciones_proveedor SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND estado = 'PENDIENTE'
`

func (q *Queries) SoftDeleteDevolucionProveedor(ctx context.Context, arg SoftDeleteDevolucionProveedorParams) error {
	_, err := q.db.Exec(ctx, softDeleteDevolucionProveedor, arg.ID, arg.UsuarioID)
	return err
}

const listDetallesByDevolucionProveedor = `-- name: ListDetallesByDevolucionProveedor :many
SELECT dd.id, dd.devolucion_id, dd.producto_id, dd.cantidad, dd.motivo_item,
       pr.nombre AS producto_nombre, pr.codigo AS producto_codigo
FROM detalle_devolucion_proveedor dd
JOIN productos pr ON pr.id = dd.producto_id
WHERE dd.devolucion_id = $1
ORDER BY dd.id ASC
`

func (q *Queries) ListDetallesByDevolucionProveedor(ctx context.Context, devolucionID pgtype.UUID) ([]ListDetallesDevolucionProveedorRow, error) {
	rows, err := q.db.Query(ctx, listDetallesByDevolucionProveedor, devolucionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListDetallesDevolucionProveedorRow
	for rows.Next() {
		var i ListDetallesDevolucionProveedorRow
		if err := rows.Scan(
			&i.ID, &i.DevolucionID, &i.ProductoID, &i.Cantidad, &i.MotivoItem,
			&i.ProductoNombre, &i.ProductoCodigo,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const getNextDevolucionProveedorNumero = `-- name: GetNextDevolucionProveedorNumero :one
SELECT nextval('devolucion_proveedor_numero_seq')::bigint
`

func (q *Queries) GetNextDevolucionProveedorNumero(ctx context.Context) (int64, error) {
	row := q.db.QueryRow(ctx, getNextDevolucionProveedorNumero)
	var n int64
	err := row.Scan(&n)
	return n, err
}
