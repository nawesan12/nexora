package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// --- Model Structs ---

type PagoProveedor struct {
	ID            pgtype.UUID        `json:"id"`
	Numero        string             `json:"numero"`
	ProveedorID   pgtype.UUID        `json:"proveedor_id"`
	SucursalID    pgtype.UUID        `json:"sucursal_id"`
	Tipo          TipoPago           `json:"tipo"`
	Estado        EstadoPago         `json:"estado"`
	Monto         pgtype.Numeric     `json:"monto"`
	FechaPago     pgtype.Date        `json:"fecha_pago"`
	Referencia    pgtype.Text        `json:"referencia"`
	MetodoPagoID  pgtype.UUID        `json:"metodo_pago_id"`
	CajaID        pgtype.UUID        `json:"caja_id"`
	Observaciones pgtype.Text        `json:"observaciones"`
	UsuarioID     pgtype.UUID        `json:"usuario_id"`
	Active        bool               `json:"active"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
}

type AplicacionPagoProveedor struct {
	ID            pgtype.UUID        `json:"id"`
	PagoID        pgtype.UUID        `json:"pago_id"`
	OrdenCompraID pgtype.UUID        `json:"orden_compra_id"`
	MontoAplicado pgtype.Numeric     `json:"monto_aplicado"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
}

// --- Param Structs ---

type CreatePagoProveedorParams struct {
	Numero        string         `json:"numero"`
	ProveedorID   pgtype.UUID    `json:"proveedor_id"`
	SucursalID    pgtype.UUID    `json:"sucursal_id"`
	Tipo          TipoPago       `json:"tipo"`
	Monto         pgtype.Numeric `json:"monto"`
	FechaPago     pgtype.Date    `json:"fecha_pago"`
	Referencia    pgtype.Text    `json:"referencia"`
	MetodoPagoID  pgtype.UUID    `json:"metodo_pago_id"`
	CajaID        pgtype.UUID    `json:"caja_id"`
	Observaciones pgtype.Text    `json:"observaciones"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
}

type ListPagosProveedorParams struct {
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Search    string      `json:"search"`
	Limit     int32       `json:"limit"`
	Offset    int32       `json:"offset"`
}

type CountPagosProveedorParams struct {
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Search    string      `json:"search"`
}

type GetPagoProveedorByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type CreateAplicacionPagoProveedorParams struct {
	PagoID        pgtype.UUID    `json:"pago_id"`
	OrdenCompraID pgtype.UUID    `json:"orden_compra_id"`
	MontoAplicado pgtype.Numeric `json:"monto_aplicado"`
}

type ListAplicacionesByPagoProveedorParams struct {
	PagoID pgtype.UUID `json:"pago_id"`
}

type ListAplicacionesByOrdenCompraParams struct {
	OrdenCompraID pgtype.UUID `json:"orden_compra_id"`
}

type UpdateOrdenCompraDeudaParams struct {
	ID          pgtype.UUID    `json:"id"`
	MontoPagado pgtype.Numeric `json:"monto_pagado"`
	EstadoDeuda EstadoDeuda    `json:"estado_deuda"`
}

type AnularPagoProveedorParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type GetSaldoProveedorParams struct {
	ProveedorID pgtype.UUID `json:"proveedor_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
}

type UpdateProveedorSaldoParams struct {
	ID          pgtype.UUID    `json:"id"`
	SaldoDeudor pgtype.Numeric `json:"saldo_deudor"`
}

type ListOrdenesCompraConDeudaParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	ProveedorID pgtype.UUID `json:"proveedor_id"`
	Limit       int32       `json:"limit"`
	Offset      int32       `json:"offset"`
}

type ListPagosProveedorByProveedorParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	ProveedorID pgtype.UUID `json:"proveedor_id"`
	Limit       int32       `json:"limit"`
	Offset      int32       `json:"offset"`
}

type CountPagosByProveedorParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	ProveedorID pgtype.UUID `json:"proveedor_id"`
}

// --- Result Row Structs ---

type ListPagosProveedorRow struct {
	ID              pgtype.UUID        `json:"id"`
	Numero          string             `json:"numero"`
	ProveedorID     pgtype.UUID        `json:"proveedor_id"`
	SucursalID      pgtype.UUID        `json:"sucursal_id"`
	Tipo            TipoPago           `json:"tipo"`
	Estado          EstadoPago         `json:"estado"`
	Monto           pgtype.Numeric     `json:"monto"`
	FechaPago       pgtype.Date        `json:"fecha_pago"`
	Referencia      pgtype.Text        `json:"referencia"`
	Observaciones   pgtype.Text        `json:"observaciones"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	ProveedorNombre string             `json:"proveedor_nombre"`
}

type GetPagoProveedorByIDRow struct {
	ID              pgtype.UUID        `json:"id"`
	Numero          string             `json:"numero"`
	ProveedorID     pgtype.UUID        `json:"proveedor_id"`
	SucursalID      pgtype.UUID        `json:"sucursal_id"`
	Tipo            TipoPago           `json:"tipo"`
	Estado          EstadoPago         `json:"estado"`
	Monto           pgtype.Numeric     `json:"monto"`
	FechaPago       pgtype.Date        `json:"fecha_pago"`
	Referencia      pgtype.Text        `json:"referencia"`
	MetodoPagoID    pgtype.UUID        `json:"metodo_pago_id"`
	CajaID          pgtype.UUID        `json:"caja_id"`
	Observaciones   pgtype.Text        `json:"observaciones"`
	Active          bool               `json:"active"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	UpdatedAt       pgtype.Timestamptz `json:"updated_at"`
	ProveedorNombre string             `json:"proveedor_nombre"`
}

type ListAplicacionesByPagoProveedorRow struct {
	ID               pgtype.UUID        `json:"id"`
	OrdenCompraID    pgtype.UUID        `json:"orden_compra_id"`
	MontoAplicado    pgtype.Numeric     `json:"monto_aplicado"`
	CreatedAt        pgtype.Timestamptz `json:"created_at"`
	OrdenCompraNum   string             `json:"orden_compra_numero"`
	OrdenCompraTotal pgtype.Numeric     `json:"orden_compra_total"`
}

type ListAplicacionesByOrdenCompraRow struct {
	ID            pgtype.UUID        `json:"id"`
	PagoID        pgtype.UUID        `json:"pago_id"`
	MontoAplicado pgtype.Numeric     `json:"monto_aplicado"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	PagoNumero    string             `json:"pago_numero"`
	PagoFecha     pgtype.Date        `json:"pago_fecha"`
}

type ListOrdenesCompraConDeudaRow struct {
	ID                   pgtype.UUID     `json:"id"`
	Numero               string          `json:"numero"`
	Total                pgtype.Numeric  `json:"total"`
	MontoPagado          pgtype.Numeric  `json:"monto_pagado"`
	EstadoDeuda          NullEstadoDeuda `json:"estado_deuda"`
	FechaVencimientoPago pgtype.Date     `json:"fecha_vencimiento_pago"`
	CreatedAt            pgtype.Timestamptz `json:"created_at"`
}

// --- SQL Constants ---

const createPagoProveedor = `
INSERT INTO pagos_proveedor (numero, proveedor_id, sucursal_id, tipo, monto, fecha_pago, referencia, metodo_pago_id, caja_id, observaciones, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, numero, proveedor_id, sucursal_id, tipo, estado, monto, fecha_pago, referencia, metodo_pago_id, caja_id, observaciones, usuario_id, active, created_at, updated_at
`

const getPagoProveedorByID = `
SELECT p.id, p.numero, p.proveedor_id, p.sucursal_id, p.tipo, p.estado, p.monto, p.fecha_pago,
       p.referencia, p.metodo_pago_id, p.caja_id, p.observaciones, p.active, p.created_at, p.updated_at,
       prov.nombre AS proveedor_nombre
FROM pagos_proveedor p
JOIN proveedores prov ON prov.id = p.proveedor_id
WHERE p.id = $1 AND p.usuario_id = $2 AND p.active = TRUE
`

const listPagosProveedor = `
SELECT p.id, p.numero, p.proveedor_id, p.sucursal_id, p.tipo, p.estado, p.monto, p.fecha_pago,
       p.referencia, p.observaciones, p.created_at,
       prov.nombre AS proveedor_nombre
FROM pagos_proveedor p
JOIN proveedores prov ON prov.id = p.proveedor_id
WHERE p.usuario_id = $1 AND p.active = TRUE
  AND ($2::text = '' OR p.numero ILIKE $2 OR prov.nombre ILIKE $2)
ORDER BY p.created_at DESC
LIMIT $3 OFFSET $4
`

const countPagosProveedor = `
SELECT COUNT(*)
FROM pagos_proveedor p
JOIN proveedores prov ON prov.id = p.proveedor_id
WHERE p.usuario_id = $1 AND p.active = TRUE
  AND ($2::text = '' OR p.numero ILIKE $2 OR prov.nombre ILIKE $2)
`

const listPagosProveedorByProveedor = `
SELECT p.id, p.numero, p.proveedor_id, p.sucursal_id, p.tipo, p.estado, p.monto, p.fecha_pago,
       p.referencia, p.observaciones, p.created_at,
       prov.nombre AS proveedor_nombre
FROM pagos_proveedor p
JOIN proveedores prov ON prov.id = p.proveedor_id
WHERE p.usuario_id = $1 AND p.proveedor_id = $2 AND p.active = TRUE
ORDER BY p.created_at DESC
LIMIT $3 OFFSET $4
`

const countPagosByProveedor = `
SELECT COUNT(*)
FROM pagos_proveedor p
WHERE p.usuario_id = $1 AND p.proveedor_id = $2 AND p.active = TRUE
`

const createAplicacionPagoProveedor = `
INSERT INTO aplicacion_pagos_proveedor (pago_id, orden_compra_id, monto_aplicado)
VALUES ($1, $2, $3)
RETURNING id, pago_id, orden_compra_id, monto_aplicado, created_at
`

const listAplicacionesByPagoProveedor = `
SELECT ap.id, ap.orden_compra_id, ap.monto_aplicado, ap.created_at,
       oc.numero AS orden_compra_numero, oc.total AS orden_compra_total
FROM aplicacion_pagos_proveedor ap
JOIN ordenes_compra oc ON oc.id = ap.orden_compra_id
WHERE ap.pago_id = $1
ORDER BY ap.created_at
`

const listAplicacionesByOrdenCompra = `
SELECT ap.id, ap.pago_id, ap.monto_aplicado, ap.created_at,
       p.numero AS pago_numero, p.fecha_pago AS pago_fecha
FROM aplicacion_pagos_proveedor ap
JOIN pagos_proveedor p ON p.id = ap.pago_id
WHERE ap.orden_compra_id = $1
ORDER BY ap.created_at
`

const updateOrdenCompraDeuda = `
UPDATE ordenes_compra SET monto_pagado = $2, estado_deuda = $3, updated_at = NOW()
WHERE id = $1
`

const anularPagoProveedor = `
UPDATE pagos_proveedor SET estado = 'ANULADO', updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

const getSaldoProveedor = `
SELECT COALESCE(saldo_deudor, 0) AS saldo_deudor
FROM proveedores
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

const updateProveedorSaldo = `
UPDATE proveedores SET saldo_deudor = $2, updated_at = NOW()
WHERE id = $1
`

const listOrdenesCompraConDeuda = `
SELECT oc.id, oc.numero, oc.total, COALESCE(oc.monto_pagado, 0) AS monto_pagado,
       oc.estado_deuda, oc.fecha_vencimiento_pago, oc.created_at
FROM ordenes_compra oc
WHERE oc.usuario_id = $1 AND oc.proveedor_id = $2 AND oc.active = TRUE
  AND oc.estado IN ('RECIBIDA', 'RECIBIDA_PARCIALMENTE')
  AND (oc.estado_deuda IS NULL OR oc.estado_deuda IN ('PENDIENTE', 'PARCIAL', 'VENCIDA'))
ORDER BY oc.created_at ASC
LIMIT $3 OFFSET $4
`

const countOrdenesCompraConDeuda = `
SELECT COUNT(*)
FROM ordenes_compra oc
WHERE oc.usuario_id = $1 AND oc.proveedor_id = $2 AND oc.active = TRUE
  AND oc.estado IN ('RECIBIDA', 'RECIBIDA_PARCIALMENTE')
  AND (oc.estado_deuda IS NULL OR oc.estado_deuda IN ('PENDIENTE', 'PARCIAL', 'VENCIDA'))
`

const getNextPagoProveedorNumero = `
SELECT 'PAGP-' || LPAD((COUNT(*) + 1)::text, 8, '0')
FROM pagos_proveedor
WHERE usuario_id = $1
`

// --- Query Methods ---

func (q *Queries) CreatePagoProveedor(ctx context.Context, arg CreatePagoProveedorParams) (PagoProveedor, error) {
	row := q.db.QueryRow(ctx, createPagoProveedor,
		arg.Numero,
		arg.ProveedorID,
		arg.SucursalID,
		arg.Tipo,
		arg.Monto,
		arg.FechaPago,
		arg.Referencia,
		arg.MetodoPagoID,
		arg.CajaID,
		arg.Observaciones,
		arg.UsuarioID,
	)
	var i PagoProveedor
	err := row.Scan(
		&i.ID,
		&i.Numero,
		&i.ProveedorID,
		&i.SucursalID,
		&i.Tipo,
		&i.Estado,
		&i.Monto,
		&i.FechaPago,
		&i.Referencia,
		&i.MetodoPagoID,
		&i.CajaID,
		&i.Observaciones,
		&i.UsuarioID,
		&i.Active,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

func (q *Queries) GetPagoProveedorByID(ctx context.Context, arg GetPagoProveedorByIDParams) (GetPagoProveedorByIDRow, error) {
	row := q.db.QueryRow(ctx, getPagoProveedorByID, arg.ID, arg.UsuarioID)
	var i GetPagoProveedorByIDRow
	err := row.Scan(
		&i.ID,
		&i.Numero,
		&i.ProveedorID,
		&i.SucursalID,
		&i.Tipo,
		&i.Estado,
		&i.Monto,
		&i.FechaPago,
		&i.Referencia,
		&i.MetodoPagoID,
		&i.CajaID,
		&i.Observaciones,
		&i.Active,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.ProveedorNombre,
	)
	return i, err
}

func (q *Queries) ListPagosProveedor(ctx context.Context, arg ListPagosProveedorParams) ([]ListPagosProveedorRow, error) {
	rows, err := q.db.Query(ctx, listPagosProveedor, arg.UsuarioID, arg.Search, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListPagosProveedorRow
	for rows.Next() {
		var i ListPagosProveedorRow
		if err := rows.Scan(
			&i.ID,
			&i.Numero,
			&i.ProveedorID,
			&i.SucursalID,
			&i.Tipo,
			&i.Estado,
			&i.Monto,
			&i.FechaPago,
			&i.Referencia,
			&i.Observaciones,
			&i.CreatedAt,
			&i.ProveedorNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) CountPagosProveedor(ctx context.Context, arg CountPagosProveedorParams) (int64, error) {
	row := q.db.QueryRow(ctx, countPagosProveedor, arg.UsuarioID, arg.Search)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) ListPagosProveedorByProveedor(ctx context.Context, arg ListPagosProveedorByProveedorParams) ([]ListPagosProveedorRow, error) {
	rows, err := q.db.Query(ctx, listPagosProveedorByProveedor, arg.UsuarioID, arg.ProveedorID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListPagosProveedorRow
	for rows.Next() {
		var i ListPagosProveedorRow
		if err := rows.Scan(
			&i.ID,
			&i.Numero,
			&i.ProveedorID,
			&i.SucursalID,
			&i.Tipo,
			&i.Estado,
			&i.Monto,
			&i.FechaPago,
			&i.Referencia,
			&i.Observaciones,
			&i.CreatedAt,
			&i.ProveedorNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) CountPagosByProveedor(ctx context.Context, arg CountPagosByProveedorParams) (int64, error) {
	row := q.db.QueryRow(ctx, countPagosByProveedor, arg.UsuarioID, arg.ProveedorID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) CreateAplicacionPagoProveedor(ctx context.Context, arg CreateAplicacionPagoProveedorParams) (AplicacionPagoProveedor, error) {
	row := q.db.QueryRow(ctx, createAplicacionPagoProveedor, arg.PagoID, arg.OrdenCompraID, arg.MontoAplicado)
	var i AplicacionPagoProveedor
	err := row.Scan(&i.ID, &i.PagoID, &i.OrdenCompraID, &i.MontoAplicado, &i.CreatedAt)
	return i, err
}

func (q *Queries) ListAplicacionesByPagoProveedor(ctx context.Context, arg ListAplicacionesByPagoProveedorParams) ([]ListAplicacionesByPagoProveedorRow, error) {
	rows, err := q.db.Query(ctx, listAplicacionesByPagoProveedor, arg.PagoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListAplicacionesByPagoProveedorRow
	for rows.Next() {
		var i ListAplicacionesByPagoProveedorRow
		if err := rows.Scan(
			&i.ID,
			&i.OrdenCompraID,
			&i.MontoAplicado,
			&i.CreatedAt,
			&i.OrdenCompraNum,
			&i.OrdenCompraTotal,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) ListAplicacionesByOrdenCompra(ctx context.Context, arg ListAplicacionesByOrdenCompraParams) ([]ListAplicacionesByOrdenCompraRow, error) {
	rows, err := q.db.Query(ctx, listAplicacionesByOrdenCompra, arg.OrdenCompraID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListAplicacionesByOrdenCompraRow
	for rows.Next() {
		var i ListAplicacionesByOrdenCompraRow
		if err := rows.Scan(
			&i.ID,
			&i.PagoID,
			&i.MontoAplicado,
			&i.CreatedAt,
			&i.PagoNumero,
			&i.PagoFecha,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) UpdateOrdenCompraDeuda(ctx context.Context, arg UpdateOrdenCompraDeudaParams) error {
	_, err := q.db.Exec(ctx, updateOrdenCompraDeuda, arg.ID, arg.MontoPagado, arg.EstadoDeuda)
	return err
}

func (q *Queries) AnularPagoProveedor(ctx context.Context, arg AnularPagoProveedorParams) error {
	_, err := q.db.Exec(ctx, anularPagoProveedor, arg.ID, arg.UsuarioID)
	return err
}

func (q *Queries) GetSaldoProveedor(ctx context.Context, arg GetSaldoProveedorParams) (pgtype.Numeric, error) {
	row := q.db.QueryRow(ctx, getSaldoProveedor, arg.ProveedorID, arg.UsuarioID)
	var saldo pgtype.Numeric
	err := row.Scan(&saldo)
	return saldo, err
}

func (q *Queries) UpdateProveedorSaldo(ctx context.Context, arg UpdateProveedorSaldoParams) error {
	_, err := q.db.Exec(ctx, updateProveedorSaldo, arg.ID, arg.SaldoDeudor)
	return err
}

func (q *Queries) ListOrdenesCompraConDeuda(ctx context.Context, arg ListOrdenesCompraConDeudaParams) ([]ListOrdenesCompraConDeudaRow, error) {
	rows, err := q.db.Query(ctx, listOrdenesCompraConDeuda, arg.UsuarioID, arg.ProveedorID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListOrdenesCompraConDeudaRow
	for rows.Next() {
		var i ListOrdenesCompraConDeudaRow
		if err := rows.Scan(
			&i.ID,
			&i.Numero,
			&i.Total,
			&i.MontoPagado,
			&i.EstadoDeuda,
			&i.FechaVencimientoPago,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) CountOrdenesCompraConDeuda(ctx context.Context, arg ListOrdenesCompraConDeudaParams) (int64, error) {
	row := q.db.QueryRow(ctx, countOrdenesCompraConDeuda, arg.UsuarioID, arg.ProveedorID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) GetNextPagoProveedorNumero(ctx context.Context, usuarioID pgtype.UUID) (string, error) {
	_, err := q.db.Exec(ctx, "SELECT pg_advisory_xact_lock(2002)")
	if err != nil {
		return "", err
	}
	row := q.db.QueryRow(ctx, getNextPagoProveedorNumero, usuarioID)
	var numero string
	err = row.Scan(&numero)
	return numero, err
}
