package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

// --- Enum Types ---

type TipoPago string

const (
	TipoPagoEFECTIVO      TipoPago = "EFECTIVO"
	TipoPagoTRANSFERENCIA TipoPago = "TRANSFERENCIA"
	TipoPagoCHEQUE        TipoPago = "CHEQUE"
	TipoPagoTARJETA       TipoPago = "TARJETA"
	TipoPagoOTRO          TipoPago = "OTRO"
)

func (e *TipoPago) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = TipoPago(s)
	case string:
		*e = TipoPago(s)
	default:
		return fmt.Errorf("unsupported scan type for TipoPago: %T", src)
	}
	return nil
}

type EstadoPago string

const (
	EstadoPagoPENDIENTE  EstadoPago = "PENDIENTE"
	EstadoPagoCONFIRMADO EstadoPago = "CONFIRMADO"
	EstadoPagoANULADO    EstadoPago = "ANULADO"
)

func (e *EstadoPago) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = EstadoPago(s)
	case string:
		*e = EstadoPago(s)
	default:
		return fmt.Errorf("unsupported scan type for EstadoPago: %T", src)
	}
	return nil
}

// --- Model Structs ---

type Pago struct {
	ID           pgtype.UUID        `json:"id"`
	Numero       string             `json:"numero"`
	ClienteID    pgtype.UUID        `json:"cliente_id"`
	SucursalID   pgtype.UUID        `json:"sucursal_id"`
	Tipo         TipoPago           `json:"tipo"`
	Estado       EstadoPago         `json:"estado"`
	Monto        pgtype.Numeric     `json:"monto"`
	FechaPago    pgtype.Date        `json:"fecha_pago"`
	Referencia   pgtype.Text        `json:"referencia"`
	MetodoPagoID pgtype.UUID        `json:"metodo_pago_id"`
	CajaID       pgtype.UUID        `json:"caja_id"`
	Observaciones pgtype.Text       `json:"observaciones"`
	UsuarioID    pgtype.UUID        `json:"usuario_id"`
	Active       bool               `json:"active"`
	CreatedAt    pgtype.Timestamptz `json:"created_at"`
	UpdatedAt    pgtype.Timestamptz `json:"updated_at"`
}

type AplicacionPago struct {
	ID            pgtype.UUID        `json:"id"`
	PagoID        pgtype.UUID        `json:"pago_id"`
	ComprobanteID pgtype.UUID        `json:"comprobante_id"`
	MontoAplicado pgtype.Numeric     `json:"monto_aplicado"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
}

// --- Param Structs ---

type CreatePagoParams struct {
	Numero        string         `json:"numero"`
	ClienteID     pgtype.UUID    `json:"cliente_id"`
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

type ListPagosParams struct {
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Search    string      `json:"search"`
	Limit     int32       `json:"limit"`
	Offset    int32       `json:"offset"`
}

type CountPagosParams struct {
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Search    string      `json:"search"`
}

type GetPagoByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type CreateAplicacionPagoParams struct {
	PagoID        pgtype.UUID    `json:"pago_id"`
	ComprobanteID pgtype.UUID    `json:"comprobante_id"`
	MontoAplicado pgtype.Numeric `json:"monto_aplicado"`
}

type ListAplicacionesByPagoParams struct {
	PagoID pgtype.UUID `json:"pago_id"`
}

type ListAplicacionesByComprobanteParams struct {
	ComprobanteID pgtype.UUID `json:"comprobante_id"`
}

type UpdateComprobanteDeudaParams struct {
	ID          pgtype.UUID    `json:"id"`
	MontoPagado pgtype.Numeric `json:"monto_pagado"`
	EstadoDeuda EstadoDeuda    `json:"estado_deuda"`
}

type AnularPagoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type GetSaldoClienteParams struct {
	ClienteID pgtype.UUID `json:"cliente_id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type GetSaldoClienteRow struct {
	SaldoDeudor   pgtype.Numeric `json:"saldo_deudor"`
	LimiteCredito pgtype.Numeric `json:"limite_credito"`
}

type UpdateClienteSaldoParams struct {
	ID          pgtype.UUID    `json:"id"`
	SaldoDeudor pgtype.Numeric `json:"saldo_deudor"`
}

type UpdateClienteLimiteCreditoParams struct {
	ID            pgtype.UUID    `json:"id"`
	LimiteCredito pgtype.Numeric `json:"limite_credito"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
}

type ListComprobantesConDeudaParams struct {
	UsuarioID pgtype.UUID `json:"usuario_id"`
	ClienteID pgtype.UUID `json:"cliente_id"`
	Limit     int32       `json:"limit"`
	Offset    int32       `json:"offset"`
}

type ListPagosByClienteParams struct {
	UsuarioID pgtype.UUID `json:"usuario_id"`
	ClienteID pgtype.UUID `json:"cliente_id"`
	Limit     int32       `json:"limit"`
	Offset    int32       `json:"offset"`
}

type CountPagosByClienteParams struct {
	UsuarioID pgtype.UUID `json:"usuario_id"`
	ClienteID pgtype.UUID `json:"cliente_id"`
}

// --- Result Row Structs ---

type ListPagosRow struct {
	ID            pgtype.UUID        `json:"id"`
	Numero        string             `json:"numero"`
	ClienteID     pgtype.UUID        `json:"cliente_id"`
	SucursalID    pgtype.UUID        `json:"sucursal_id"`
	Tipo          TipoPago           `json:"tipo"`
	Estado        EstadoPago         `json:"estado"`
	Monto         pgtype.Numeric     `json:"monto"`
	FechaPago     pgtype.Date        `json:"fecha_pago"`
	Referencia    pgtype.Text        `json:"referencia"`
	Observaciones pgtype.Text        `json:"observaciones"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	ClienteNombre string             `json:"cliente_nombre"`
}

type GetPagoByIDRow struct {
	ID            pgtype.UUID        `json:"id"`
	Numero        string             `json:"numero"`
	ClienteID     pgtype.UUID        `json:"cliente_id"`
	SucursalID    pgtype.UUID        `json:"sucursal_id"`
	Tipo          TipoPago           `json:"tipo"`
	Estado        EstadoPago         `json:"estado"`
	Monto         pgtype.Numeric     `json:"monto"`
	FechaPago     pgtype.Date        `json:"fecha_pago"`
	Referencia    pgtype.Text        `json:"referencia"`
	MetodoPagoID  pgtype.UUID        `json:"metodo_pago_id"`
	CajaID        pgtype.UUID        `json:"caja_id"`
	Observaciones pgtype.Text        `json:"observaciones"`
	Active        bool               `json:"active"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
	ClienteNombre string             `json:"cliente_nombre"`
}

type ListAplicacionesByPagoRow struct {
	ID                pgtype.UUID        `json:"id"`
	ComprobanteID     pgtype.UUID        `json:"comprobante_id"`
	MontoAplicado     pgtype.Numeric     `json:"monto_aplicado"`
	CreatedAt         pgtype.Timestamptz `json:"created_at"`
	ComprobanteNumero string             `json:"comprobante_numero"`
	ComprobanteTotal  pgtype.Numeric     `json:"comprobante_total"`
}

type ListAplicacionesByComprobanteRow struct {
	ID            pgtype.UUID        `json:"id"`
	PagoID        pgtype.UUID        `json:"pago_id"`
	MontoAplicado pgtype.Numeric     `json:"monto_aplicado"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	PagoNumero    string             `json:"pago_numero"`
	PagoFecha     pgtype.Date        `json:"pago_fecha"`
}

type ListComprobantesConDeudaRow struct {
	ID                  pgtype.UUID    `json:"id"`
	Numero              string         `json:"numero"`
	Total               pgtype.Numeric `json:"total"`
	MontoPagado         pgtype.Numeric `json:"monto_pagado"`
	EstadoDeuda         NullEstadoDeuda `json:"estado_deuda"`
	FechaVencimientoPago pgtype.Date   `json:"fecha_vencimiento_pago"`
	CreatedAt           pgtype.Timestamptz `json:"created_at"`
}

type AgingReportRow struct {
	Rango       string         `json:"rango"`
	TotalDeuda  pgtype.Numeric `json:"total_deuda"`
	Cantidad    int64          `json:"cantidad"`
}

// --- SQL Constants ---

const createPago = `
INSERT INTO pagos (numero, cliente_id, sucursal_id, tipo, monto, fecha_pago, referencia, metodo_pago_id, caja_id, observaciones, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, numero, cliente_id, sucursal_id, tipo, estado, monto, fecha_pago, referencia, metodo_pago_id, caja_id, observaciones, usuario_id, active, created_at, updated_at
`

const getPagoByID = `
SELECT p.id, p.numero, p.cliente_id, p.sucursal_id, p.tipo, p.estado, p.monto, p.fecha_pago,
       p.referencia, p.metodo_pago_id, p.caja_id, p.observaciones, p.active, p.created_at, p.updated_at,
       COALESCE(cl.razon_social, cl.nombre || ' ' || cl.apellido) AS cliente_nombre
FROM pagos p
JOIN clientes cl ON cl.id = p.cliente_id
WHERE p.id = $1 AND p.usuario_id = $2 AND p.active = TRUE
`

const listPagos = `
SELECT p.id, p.numero, p.cliente_id, p.sucursal_id, p.tipo, p.estado, p.monto, p.fecha_pago,
       p.referencia, p.observaciones, p.created_at,
       COALESCE(cl.razon_social, cl.nombre || ' ' || cl.apellido) AS cliente_nombre
FROM pagos p
JOIN clientes cl ON cl.id = p.cliente_id
WHERE p.usuario_id = $1 AND p.active = TRUE
  AND ($2::text = '' OR p.numero ILIKE $2 OR cl.nombre ILIKE $2 OR cl.apellido ILIKE $2 OR cl.razon_social ILIKE $2)
ORDER BY p.created_at DESC
LIMIT $3 OFFSET $4
`

const countPagos = `
SELECT COUNT(*)
FROM pagos p
JOIN clientes cl ON cl.id = p.cliente_id
WHERE p.usuario_id = $1 AND p.active = TRUE
  AND ($2::text = '' OR p.numero ILIKE $2 OR cl.nombre ILIKE $2 OR cl.apellido ILIKE $2 OR cl.razon_social ILIKE $2)
`

const listPagosByCliente = `
SELECT p.id, p.numero, p.cliente_id, p.sucursal_id, p.tipo, p.estado, p.monto, p.fecha_pago,
       p.referencia, p.observaciones, p.created_at,
       COALESCE(cl.razon_social, cl.nombre || ' ' || cl.apellido) AS cliente_nombre
FROM pagos p
JOIN clientes cl ON cl.id = p.cliente_id
WHERE p.usuario_id = $1 AND p.cliente_id = $2 AND p.active = TRUE
ORDER BY p.created_at DESC
LIMIT $3 OFFSET $4
`

const countPagosByCliente = `
SELECT COUNT(*)
FROM pagos p
WHERE p.usuario_id = $1 AND p.cliente_id = $2 AND p.active = TRUE
`

const createAplicacionPago = `
INSERT INTO aplicacion_pagos (pago_id, comprobante_id, monto_aplicado)
VALUES ($1, $2, $3)
RETURNING id, pago_id, comprobante_id, monto_aplicado, created_at
`

const listAplicacionesByPago = `
SELECT ap.id, ap.comprobante_id, ap.monto_aplicado, ap.created_at,
       c.numero AS comprobante_numero, c.total AS comprobante_total
FROM aplicacion_pagos ap
JOIN comprobantes c ON c.id = ap.comprobante_id
WHERE ap.pago_id = $1
ORDER BY ap.created_at
`

const listAplicacionesByComprobante = `
SELECT ap.id, ap.pago_id, ap.monto_aplicado, ap.created_at,
       p.numero AS pago_numero, p.fecha_pago AS pago_fecha
FROM aplicacion_pagos ap
JOIN pagos p ON p.id = ap.pago_id
WHERE ap.comprobante_id = $1
ORDER BY ap.created_at
`

const updateComprobanteDeuda = `
UPDATE comprobantes SET monto_pagado = $2, estado_deuda = $3, updated_at = NOW()
WHERE id = $1
`

const anularPago = `
UPDATE pagos SET estado = 'ANULADO', updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

const getSaldoCliente = `
SELECT COALESCE(saldo_deudor, 0) AS saldo_deudor, COALESCE(limite_credito, 0) AS limite_credito
FROM clientes
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

const updateClienteSaldo = `
UPDATE clientes SET saldo_deudor = $2, updated_at = NOW()
WHERE id = $1
`

const updateClienteLimiteCredito = `
UPDATE clientes SET limite_credito = $2, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
`

const listComprobantesConDeuda = `
SELECT c.id, c.numero, c.total, COALESCE(c.monto_pagado, 0) AS monto_pagado,
       c.estado_deuda, c.fecha_vencimiento_pago, c.created_at
FROM comprobantes c
WHERE c.usuario_id = $1 AND c.cliente_id = $2 AND c.active = TRUE
  AND c.estado = 'EMITIDO'
  AND (c.estado_deuda IS NULL OR c.estado_deuda IN ('PENDIENTE', 'PARCIAL', 'VENCIDA'))
ORDER BY c.created_at ASC
LIMIT $3 OFFSET $4
`

const countComprobantesConDeuda = `
SELECT COUNT(*)
FROM comprobantes c
WHERE c.usuario_id = $1 AND c.cliente_id = $2 AND c.active = TRUE
  AND c.estado = 'EMITIDO'
  AND (c.estado_deuda IS NULL OR c.estado_deuda IN ('PENDIENTE', 'PARCIAL', 'VENCIDA'))
`

const agingReport = `
SELECT
  CASE
    WHEN CURRENT_DATE - c.fecha_vencimiento_pago <= 0 THEN 'AL_DIA'
    WHEN CURRENT_DATE - c.fecha_vencimiento_pago BETWEEN 1 AND 30 THEN '1_30_DIAS'
    WHEN CURRENT_DATE - c.fecha_vencimiento_pago BETWEEN 31 AND 60 THEN '31_60_DIAS'
    WHEN CURRENT_DATE - c.fecha_vencimiento_pago BETWEEN 61 AND 90 THEN '61_90_DIAS'
    ELSE 'MAS_90_DIAS'
  END AS rango,
  SUM(c.total - COALESCE(c.monto_pagado, 0)) AS total_deuda,
  COUNT(*) AS cantidad
FROM comprobantes c
WHERE c.usuario_id = $1 AND c.active = TRUE
  AND c.estado = 'EMITIDO'
  AND (c.estado_deuda IS NULL OR c.estado_deuda IN ('PENDIENTE', 'PARCIAL', 'VENCIDA'))
  AND c.fecha_vencimiento_pago IS NOT NULL
GROUP BY rango
ORDER BY rango
`

const getNextPagoNumero = `
SELECT 'PAG-' || LPAD((COUNT(*) + 1)::text, 8, '0')
FROM pagos
WHERE usuario_id = $1
`

// --- Query Methods ---

func (q *Queries) CreatePago(ctx context.Context, arg CreatePagoParams) (Pago, error) {
	row := q.db.QueryRow(ctx, createPago,
		arg.Numero,
		arg.ClienteID,
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
	var i Pago
	err := row.Scan(
		&i.ID,
		&i.Numero,
		&i.ClienteID,
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

func (q *Queries) GetPagoByID(ctx context.Context, arg GetPagoByIDParams) (GetPagoByIDRow, error) {
	row := q.db.QueryRow(ctx, getPagoByID, arg.ID, arg.UsuarioID)
	var i GetPagoByIDRow
	err := row.Scan(
		&i.ID,
		&i.Numero,
		&i.ClienteID,
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
		&i.ClienteNombre,
	)
	return i, err
}

func (q *Queries) ListPagos(ctx context.Context, arg ListPagosParams) ([]ListPagosRow, error) {
	rows, err := q.db.Query(ctx, listPagos, arg.UsuarioID, arg.Search, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListPagosRow
	for rows.Next() {
		var i ListPagosRow
		if err := rows.Scan(
			&i.ID,
			&i.Numero,
			&i.ClienteID,
			&i.SucursalID,
			&i.Tipo,
			&i.Estado,
			&i.Monto,
			&i.FechaPago,
			&i.Referencia,
			&i.Observaciones,
			&i.CreatedAt,
			&i.ClienteNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) CountPagos(ctx context.Context, arg CountPagosParams) (int64, error) {
	row := q.db.QueryRow(ctx, countPagos, arg.UsuarioID, arg.Search)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) ListPagosByCliente(ctx context.Context, arg ListPagosByClienteParams) ([]ListPagosRow, error) {
	rows, err := q.db.Query(ctx, listPagosByCliente, arg.UsuarioID, arg.ClienteID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListPagosRow
	for rows.Next() {
		var i ListPagosRow
		if err := rows.Scan(
			&i.ID,
			&i.Numero,
			&i.ClienteID,
			&i.SucursalID,
			&i.Tipo,
			&i.Estado,
			&i.Monto,
			&i.FechaPago,
			&i.Referencia,
			&i.Observaciones,
			&i.CreatedAt,
			&i.ClienteNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) CountPagosByCliente(ctx context.Context, arg CountPagosByClienteParams) (int64, error) {
	row := q.db.QueryRow(ctx, countPagosByCliente, arg.UsuarioID, arg.ClienteID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) CreateAplicacionPago(ctx context.Context, arg CreateAplicacionPagoParams) (AplicacionPago, error) {
	row := q.db.QueryRow(ctx, createAplicacionPago, arg.PagoID, arg.ComprobanteID, arg.MontoAplicado)
	var i AplicacionPago
	err := row.Scan(&i.ID, &i.PagoID, &i.ComprobanteID, &i.MontoAplicado, &i.CreatedAt)
	return i, err
}

func (q *Queries) ListAplicacionesByPago(ctx context.Context, arg ListAplicacionesByPagoParams) ([]ListAplicacionesByPagoRow, error) {
	rows, err := q.db.Query(ctx, listAplicacionesByPago, arg.PagoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListAplicacionesByPagoRow
	for rows.Next() {
		var i ListAplicacionesByPagoRow
		if err := rows.Scan(
			&i.ID,
			&i.ComprobanteID,
			&i.MontoAplicado,
			&i.CreatedAt,
			&i.ComprobanteNumero,
			&i.ComprobanteTotal,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) ListAplicacionesByComprobante(ctx context.Context, arg ListAplicacionesByComprobanteParams) ([]ListAplicacionesByComprobanteRow, error) {
	rows, err := q.db.Query(ctx, listAplicacionesByComprobante, arg.ComprobanteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListAplicacionesByComprobanteRow
	for rows.Next() {
		var i ListAplicacionesByComprobanteRow
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

func (q *Queries) UpdateComprobanteDeuda(ctx context.Context, arg UpdateComprobanteDeudaParams) error {
	_, err := q.db.Exec(ctx, updateComprobanteDeuda, arg.ID, arg.MontoPagado, arg.EstadoDeuda)
	return err
}

func (q *Queries) AnularPago(ctx context.Context, arg AnularPagoParams) error {
	_, err := q.db.Exec(ctx, anularPago, arg.ID, arg.UsuarioID)
	return err
}

func (q *Queries) GetSaldoCliente(ctx context.Context, arg GetSaldoClienteParams) (GetSaldoClienteRow, error) {
	row := q.db.QueryRow(ctx, getSaldoCliente, arg.ClienteID, arg.UsuarioID)
	var i GetSaldoClienteRow
	err := row.Scan(&i.SaldoDeudor, &i.LimiteCredito)
	return i, err
}

func (q *Queries) UpdateClienteSaldo(ctx context.Context, arg UpdateClienteSaldoParams) error {
	_, err := q.db.Exec(ctx, updateClienteSaldo, arg.ID, arg.SaldoDeudor)
	return err
}

func (q *Queries) UpdateClienteLimiteCredito(ctx context.Context, arg UpdateClienteLimiteCreditoParams) error {
	_, err := q.db.Exec(ctx, updateClienteLimiteCredito, arg.ID, arg.LimiteCredito, arg.UsuarioID)
	return err
}

func (q *Queries) ListComprobantesConDeuda(ctx context.Context, arg ListComprobantesConDeudaParams) ([]ListComprobantesConDeudaRow, error) {
	rows, err := q.db.Query(ctx, listComprobantesConDeuda, arg.UsuarioID, arg.ClienteID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListComprobantesConDeudaRow
	for rows.Next() {
		var i ListComprobantesConDeudaRow
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

func (q *Queries) CountComprobantesConDeuda(ctx context.Context, arg ListComprobantesConDeudaParams) (int64, error) {
	row := q.db.QueryRow(ctx, countComprobantesConDeuda, arg.UsuarioID, arg.ClienteID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

func (q *Queries) AgingReport(ctx context.Context, usuarioID pgtype.UUID) ([]AgingReportRow, error) {
	rows, err := q.db.Query(ctx, agingReport, usuarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []AgingReportRow
	for rows.Next() {
		var i AgingReportRow
		if err := rows.Scan(&i.Rango, &i.TotalDeuda, &i.Cantidad); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

func (q *Queries) GetNextPagoNumero(ctx context.Context, usuarioID pgtype.UUID) (string, error) {
	// Use advisory lock to prevent concurrent number generation collisions
	_, err := q.db.Exec(ctx, "SELECT pg_advisory_xact_lock(2001)")
	if err != nil {
		return "", err
	}
	row := q.db.QueryRow(ctx, getNextPagoNumero, usuarioID)
	var numero string
	err = row.Scan(&numero)
	return numero, err
}
