package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type Devolucion struct {
	ID            pgtype.UUID        `json:"id"`
	Numero        string             `json:"numero"`
	PedidoID      pgtype.UUID        `json:"pedido_id"`
	ClienteID     pgtype.UUID        `json:"cliente_id"`
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

type DetalleDevolucion struct {
	ID           pgtype.UUID `json:"id"`
	DevolucionID pgtype.UUID `json:"devolucion_id"`
	ProductoID   pgtype.UUID `json:"producto_id"`
	Cantidad     int32       `json:"cantidad"`
	MotivoItem   pgtype.Text `json:"motivo_item"`
}

// --- GetNextDevolucionNumero ---

const getNextDevolucionNumero = `-- name: GetNextDevolucionNumero :one
SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 5) AS BIGINT)), 0) + 1
FROM devoluciones
`

func (q *Queries) GetNextDevolucionNumero(ctx context.Context) (int64, error) {
	row := q.db.QueryRow(ctx, getNextDevolucionNumero)
	var num int64
	err := row.Scan(&num)
	return num, err
}

// --- CreateDevolucion ---

const createDevolucion = `-- name: CreateDevolucion :one
INSERT INTO devoluciones (numero, pedido_id, cliente_id, sucursal_id, motivo, estado, fecha, observaciones, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, numero, pedido_id, cliente_id, sucursal_id, motivo, estado, fecha, observaciones, usuario_id, active, created_at, updated_at
`

type CreateDevolucionParams struct {
	Numero        string      `json:"numero"`
	PedidoID      pgtype.UUID `json:"pedido_id"`
	ClienteID     pgtype.UUID `json:"cliente_id"`
	SucursalID    pgtype.UUID `json:"sucursal_id"`
	Motivo        string      `json:"motivo"`
	Estado        string      `json:"estado"`
	Fecha         pgtype.Date `json:"fecha"`
	Observaciones pgtype.Text `json:"observaciones"`
	UsuarioID     pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CreateDevolucion(ctx context.Context, arg CreateDevolucionParams) (Devolucion, error) {
	row := q.db.QueryRow(ctx, createDevolucion,
		arg.Numero, arg.PedidoID, arg.ClienteID, arg.SucursalID,
		arg.Motivo, arg.Estado, arg.Fecha, arg.Observaciones, arg.UsuarioID,
	)
	var i Devolucion
	err := row.Scan(
		&i.ID, &i.Numero, &i.PedidoID, &i.ClienteID, &i.SucursalID,
		&i.Motivo, &i.Estado, &i.Fecha, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- GetDevolucionByID ---

const getDevolucionByID = `-- name: GetDevolucionByID :one
SELECT d.id, d.numero, d.pedido_id, d.cliente_id, d.sucursal_id, d.motivo, d.estado, d.fecha,
       d.observaciones, d.usuario_id, d.active, d.created_at, d.updated_at,
       c.nombre || ' ' || COALESCE(c.apellido, '') AS cliente_nombre,
       COALESCE(p.numero, '') AS pedido_numero,
       s.nombre AS sucursal_nombre
FROM devoluciones d
JOIN clientes c ON c.id = d.cliente_id
LEFT JOIN pedidos p ON p.id = d.pedido_id
JOIN sucursales s ON s.id = d.sucursal_id
WHERE d.id = $1 AND d.usuario_id = $2 AND d.active = TRUE
`

type GetDevolucionByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type GetDevolucionByIDRow struct {
	Devolucion
	ClienteNombre  string `json:"cliente_nombre"`
	PedidoNumero   string `json:"pedido_numero"`
	SucursalNombre string `json:"sucursal_nombre"`
}

func (q *Queries) GetDevolucionByID(ctx context.Context, arg GetDevolucionByIDParams) (GetDevolucionByIDRow, error) {
	row := q.db.QueryRow(ctx, getDevolucionByID, arg.ID, arg.UsuarioID)
	var i GetDevolucionByIDRow
	err := row.Scan(
		&i.ID, &i.Numero, &i.PedidoID, &i.ClienteID, &i.SucursalID,
		&i.Motivo, &i.Estado, &i.Fecha, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		&i.ClienteNombre, &i.PedidoNumero, &i.SucursalNombre,
	)
	return i, err
}

// --- ListDevoluciones ---

const listDevoluciones = `-- name: ListDevoluciones :many
SELECT d.id, d.numero, d.pedido_id, d.cliente_id, d.sucursal_id, d.motivo, d.estado, d.fecha,
       d.observaciones, d.usuario_id, d.active, d.created_at, d.updated_at,
       c.nombre || ' ' || COALESCE(c.apellido, '') AS cliente_nombre,
       COALESCE(p.numero, '') AS pedido_numero,
       s.nombre AS sucursal_nombre
FROM devoluciones d
JOIN clientes c ON c.id = d.cliente_id
LEFT JOIN pedidos p ON p.id = d.pedido_id
JOIN sucursales s ON s.id = d.sucursal_id
WHERE d.usuario_id = $1 AND d.active = TRUE
ORDER BY d.created_at DESC
LIMIT $2 OFFSET $3
`

type ListDevolucionesParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

type ListDevolucionesRow struct {
	Devolucion
	ClienteNombre  string `json:"cliente_nombre"`
	PedidoNumero   string `json:"pedido_numero"`
	SucursalNombre string `json:"sucursal_nombre"`
}

func (q *Queries) ListDevoluciones(ctx context.Context, arg ListDevolucionesParams) ([]ListDevolucionesRow, error) {
	rows, err := q.db.Query(ctx, listDevoluciones, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListDevolucionesRow
	for rows.Next() {
		var i ListDevolucionesRow
		if err := rows.Scan(
			&i.ID, &i.Numero, &i.PedidoID, &i.ClienteID, &i.SucursalID,
			&i.Motivo, &i.Estado, &i.Fecha, &i.Observaciones,
			&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
			&i.ClienteNombre, &i.PedidoNumero, &i.SucursalNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- CountDevoluciones ---

const countDevoluciones = `-- name: CountDevoluciones :one
SELECT COUNT(*) FROM devoluciones
WHERE usuario_id = $1 AND active = TRUE
`

func (q *Queries) CountDevoluciones(ctx context.Context, usuarioID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countDevoluciones, usuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

// --- UpdateDevolucionEstado ---

const updateDevolucionEstado = `-- name: UpdateDevolucionEstado :one
UPDATE devoluciones SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, numero, pedido_id, cliente_id, sucursal_id, motivo, estado, fecha, observaciones, usuario_id, active, created_at, updated_at
`

type UpdateDevolucionEstadoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Estado    string      `json:"estado"`
}

func (q *Queries) UpdateDevolucionEstado(ctx context.Context, arg UpdateDevolucionEstadoParams) (Devolucion, error) {
	row := q.db.QueryRow(ctx, updateDevolucionEstado, arg.ID, arg.UsuarioID, arg.Estado)
	var i Devolucion
	err := row.Scan(
		&i.ID, &i.Numero, &i.PedidoID, &i.ClienteID, &i.SucursalID,
		&i.Motivo, &i.Estado, &i.Fecha, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- SoftDeleteDevolucion ---

const softDeleteDevolucion = `-- name: SoftDeleteDevolucion :exec
UPDATE devoluciones SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteDevolucionParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteDevolucion(ctx context.Context, arg SoftDeleteDevolucionParams) error {
	_, err := q.db.Exec(ctx, softDeleteDevolucion, arg.ID, arg.UsuarioID)
	return err
}

// --- CreateDetalleDevolucion ---

const createDetalleDevolucion = `-- name: CreateDetalleDevolucion :one
INSERT INTO detalle_devolucion (devolucion_id, producto_id, cantidad, motivo_item)
VALUES ($1, $2, $3, $4)
RETURNING id, devolucion_id, producto_id, cantidad, motivo_item
`

type CreateDetalleDevolucionParams struct {
	DevolucionID pgtype.UUID `json:"devolucion_id"`
	ProductoID   pgtype.UUID `json:"producto_id"`
	Cantidad     int32       `json:"cantidad"`
	MotivoItem   pgtype.Text `json:"motivo_item"`
}

func (q *Queries) CreateDetalleDevolucion(ctx context.Context, arg CreateDetalleDevolucionParams) (DetalleDevolucion, error) {
	row := q.db.QueryRow(ctx, createDetalleDevolucion,
		arg.DevolucionID, arg.ProductoID, arg.Cantidad, arg.MotivoItem,
	)
	var i DetalleDevolucion
	err := row.Scan(&i.ID, &i.DevolucionID, &i.ProductoID, &i.Cantidad, &i.MotivoItem)
	return i, err
}

// --- ListDetallesByDevolucion ---

const listDetallesByDevolucion = `-- name: ListDetallesByDevolucion :many
SELECT dd.id, dd.devolucion_id, dd.producto_id, dd.cantidad, dd.motivo_item,
       pr.nombre AS producto_nombre, pr.codigo AS producto_codigo, pr.unidad AS producto_unidad
FROM detalle_devolucion dd
JOIN productos pr ON pr.id = dd.producto_id
WHERE dd.devolucion_id = $1
ORDER BY pr.nombre
`

type ListDetallesByDevolucionRow struct {
	DetalleDevolucion
	ProductoNombre string      `json:"producto_nombre"`
	ProductoCodigo pgtype.Text `json:"producto_codigo"`
	ProductoUnidad string      `json:"producto_unidad"`
}

func (q *Queries) ListDetallesByDevolucion(ctx context.Context, devolucionID pgtype.UUID) ([]ListDetallesByDevolucionRow, error) {
	rows, err := q.db.Query(ctx, listDetallesByDevolucion, devolucionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListDetallesByDevolucionRow
	for rows.Next() {
		var i ListDetallesByDevolucionRow
		if err := rows.Scan(
			&i.ID, &i.DevolucionID, &i.ProductoID, &i.Cantidad, &i.MotivoItem,
			&i.ProductoNombre, &i.ProductoCodigo, &i.ProductoUnidad,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}
