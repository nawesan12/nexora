package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type Retencion struct {
	ID                 pgtype.UUID        `json:"id"`
	Tipo               string             `json:"tipo"`
	EntidadTipo        string             `json:"entidad_tipo"`
	EntidadID          pgtype.UUID        `json:"entidad_id"`
	PagoID             pgtype.UUID        `json:"pago_id"`
	NumeroCertificado  pgtype.Text        `json:"numero_certificado"`
	Fecha              pgtype.Date        `json:"fecha"`
	BaseImponible      pgtype.Numeric     `json:"base_imponible"`
	Alicuota           pgtype.Numeric     `json:"alicuota"`
	Monto              pgtype.Numeric     `json:"monto"`
	Periodo            pgtype.Text        `json:"periodo"`
	Estado             string             `json:"estado"`
	Observaciones      pgtype.Text        `json:"observaciones"`
	UsuarioID          pgtype.UUID        `json:"usuario_id"`
	Active             bool               `json:"active"`
	CreatedAt          pgtype.Timestamptz `json:"created_at"`
	UpdatedAt          pgtype.Timestamptz `json:"updated_at"`
}

// --- ListRetencionRow includes entidad_nombre ---

type ListRetencionRow struct {
	ID                 pgtype.UUID        `json:"id"`
	Tipo               string             `json:"tipo"`
	EntidadTipo        string             `json:"entidad_tipo"`
	EntidadID          pgtype.UUID        `json:"entidad_id"`
	PagoID             pgtype.UUID        `json:"pago_id"`
	NumeroCertificado  pgtype.Text        `json:"numero_certificado"`
	Fecha              pgtype.Date        `json:"fecha"`
	BaseImponible      pgtype.Numeric     `json:"base_imponible"`
	Alicuota           pgtype.Numeric     `json:"alicuota"`
	Monto              pgtype.Numeric     `json:"monto"`
	Periodo            pgtype.Text        `json:"periodo"`
	Estado             string             `json:"estado"`
	Observaciones      pgtype.Text        `json:"observaciones"`
	UsuarioID          pgtype.UUID        `json:"usuario_id"`
	Active             bool               `json:"active"`
	CreatedAt          pgtype.Timestamptz `json:"created_at"`
	UpdatedAt          pgtype.Timestamptz `json:"updated_at"`
	EntidadNombre      pgtype.Text        `json:"entidad_nombre"`
}

// --- CreateRetencion ---

const createRetencion = `-- name: CreateRetencion :one
INSERT INTO retenciones (tipo, entidad_tipo, entidad_id, pago_id, numero_certificado, fecha, base_imponible, alicuota, monto, periodo, estado, observaciones, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
RETURNING id, tipo, entidad_tipo, entidad_id, pago_id, numero_certificado, fecha, base_imponible, alicuota, monto, periodo, estado, observaciones, usuario_id, active, created_at, updated_at
`

type CreateRetencionParams struct {
	Tipo              string         `json:"tipo"`
	EntidadTipo       string         `json:"entidad_tipo"`
	EntidadID         pgtype.UUID    `json:"entidad_id"`
	PagoID            pgtype.UUID    `json:"pago_id"`
	NumeroCertificado pgtype.Text    `json:"numero_certificado"`
	Fecha             pgtype.Date    `json:"fecha"`
	BaseImponible     pgtype.Numeric `json:"base_imponible"`
	Alicuota          pgtype.Numeric `json:"alicuota"`
	Monto             pgtype.Numeric `json:"monto"`
	Periodo           pgtype.Text    `json:"periodo"`
	Estado            string         `json:"estado"`
	Observaciones     pgtype.Text    `json:"observaciones"`
	UsuarioID         pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateRetencion(ctx context.Context, arg CreateRetencionParams) (Retencion, error) {
	row := q.db.QueryRow(ctx, createRetencion,
		arg.Tipo, arg.EntidadTipo, arg.EntidadID, arg.PagoID,
		arg.NumeroCertificado, arg.Fecha, arg.BaseImponible, arg.Alicuota,
		arg.Monto, arg.Periodo, arg.Estado, arg.Observaciones, arg.UsuarioID,
	)
	var i Retencion
	err := row.Scan(
		&i.ID, &i.Tipo, &i.EntidadTipo, &i.EntidadID, &i.PagoID,
		&i.NumeroCertificado, &i.Fecha, &i.BaseImponible, &i.Alicuota,
		&i.Monto, &i.Periodo, &i.Estado, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- GetRetencionByID ---

const getRetencionByID = `-- name: GetRetencionByID :one
SELECT r.id, r.tipo, r.entidad_tipo, r.entidad_id, r.pago_id, r.numero_certificado, r.fecha, r.base_imponible, r.alicuota, r.monto, r.periodo, r.estado, r.observaciones, r.usuario_id, r.active, r.created_at, r.updated_at,
  CASE WHEN r.entidad_tipo = 'CLIENTE' THEN (SELECT nombre FROM clientes WHERE id = r.entidad_id)
       ELSE (SELECT nombre FROM proveedores WHERE id = r.entidad_id) END AS entidad_nombre
FROM retenciones r
WHERE r.id = $1 AND r.usuario_id = $2 AND r.active = TRUE
`

type GetRetencionByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetRetencionByID(ctx context.Context, arg GetRetencionByIDParams) (ListRetencionRow, error) {
	row := q.db.QueryRow(ctx, getRetencionByID, arg.ID, arg.UsuarioID)
	var i ListRetencionRow
	err := row.Scan(
		&i.ID, &i.Tipo, &i.EntidadTipo, &i.EntidadID, &i.PagoID,
		&i.NumeroCertificado, &i.Fecha, &i.BaseImponible, &i.Alicuota,
		&i.Monto, &i.Periodo, &i.Estado, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
		&i.EntidadNombre,
	)
	return i, err
}

// --- ListRetenciones ---

const listRetenciones = `-- name: ListRetenciones :many
SELECT r.id, r.tipo, r.entidad_tipo, r.entidad_id, r.pago_id, r.numero_certificado, r.fecha, r.base_imponible, r.alicuota, r.monto, r.periodo, r.estado, r.observaciones, r.usuario_id, r.active, r.created_at, r.updated_at,
  CASE WHEN r.entidad_tipo = 'CLIENTE' THEN (SELECT nombre FROM clientes WHERE id = r.entidad_id)
       ELSE (SELECT nombre FROM proveedores WHERE id = r.entidad_id) END AS entidad_nombre
FROM retenciones r
WHERE r.usuario_id = $1 AND r.active = TRUE
  AND ($4::varchar = '' OR r.tipo = $4)
  AND ($5::varchar = '' OR r.entidad_tipo = $5)
  AND ($6::varchar = '' OR r.periodo = $6)
ORDER BY r.fecha DESC
LIMIT $2 OFFSET $3
`

type ListRetencionesParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
	Tipo        string      `json:"tipo"`
	EntidadTipo string      `json:"entidad_tipo"`
	Periodo     string      `json:"periodo"`
}

func (q *Queries) ListRetenciones(ctx context.Context, arg ListRetencionesParams) ([]ListRetencionRow, error) {
	rows, err := q.db.Query(ctx, listRetenciones,
		arg.UsuarioID, arg.QueryLimit, arg.QueryOffset,
		arg.Tipo, arg.EntidadTipo, arg.Periodo,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListRetencionRow
	for rows.Next() {
		var i ListRetencionRow
		if err := rows.Scan(
			&i.ID, &i.Tipo, &i.EntidadTipo, &i.EntidadID, &i.PagoID,
			&i.NumeroCertificado, &i.Fecha, &i.BaseImponible, &i.Alicuota,
			&i.Monto, &i.Periodo, &i.Estado, &i.Observaciones,
			&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
			&i.EntidadNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- CountRetenciones ---

const countRetenciones = `-- name: CountRetenciones :one
SELECT COUNT(*) FROM retenciones
WHERE usuario_id = $1 AND active = TRUE
  AND ($2::varchar = '' OR tipo = $2)
  AND ($3::varchar = '' OR entidad_tipo = $3)
  AND ($4::varchar = '' OR periodo = $4)
`

type CountRetencionesParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	Tipo        string      `json:"tipo"`
	EntidadTipo string      `json:"entidad_tipo"`
	Periodo     string      `json:"periodo"`
}

func (q *Queries) CountRetenciones(ctx context.Context, arg CountRetencionesParams) (int64, error) {
	row := q.db.QueryRow(ctx, countRetenciones, arg.UsuarioID, arg.Tipo, arg.EntidadTipo, arg.Periodo)
	var count int64
	err := row.Scan(&count)
	return count, err
}

// --- ListRetencionesByEntidad ---

const listRetencionesByEntidad = `-- name: ListRetencionesByEntidad :many
SELECT r.id, r.tipo, r.entidad_tipo, r.entidad_id, r.pago_id, r.numero_certificado, r.fecha, r.base_imponible, r.alicuota, r.monto, r.periodo, r.estado, r.observaciones, r.usuario_id, r.active, r.created_at, r.updated_at,
  CASE WHEN r.entidad_tipo = 'CLIENTE' THEN (SELECT nombre FROM clientes WHERE id = r.entidad_id)
       ELSE (SELECT nombre FROM proveedores WHERE id = r.entidad_id) END AS entidad_nombre
FROM retenciones r
WHERE r.usuario_id = $1 AND r.entidad_tipo = $2 AND r.entidad_id = $3 AND r.active = TRUE
ORDER BY r.fecha DESC
LIMIT $4 OFFSET $5
`

type ListRetencionesByEntidadParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	EntidadTipo string      `json:"entidad_tipo"`
	EntidadID   pgtype.UUID `json:"entidad_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListRetencionesByEntidad(ctx context.Context, arg ListRetencionesByEntidadParams) ([]ListRetencionRow, error) {
	rows, err := q.db.Query(ctx, listRetencionesByEntidad,
		arg.UsuarioID, arg.EntidadTipo, arg.EntidadID, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListRetencionRow
	for rows.Next() {
		var i ListRetencionRow
		if err := rows.Scan(
			&i.ID, &i.Tipo, &i.EntidadTipo, &i.EntidadID, &i.PagoID,
			&i.NumeroCertificado, &i.Fecha, &i.BaseImponible, &i.Alicuota,
			&i.Monto, &i.Periodo, &i.Estado, &i.Observaciones,
			&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
			&i.EntidadNombre,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- CountRetencionesByEntidad ---

const countRetencionesByEntidad = `-- name: CountRetencionesByEntidad :one
SELECT COUNT(*) FROM retenciones
WHERE usuario_id = $1 AND entidad_tipo = $2 AND entidad_id = $3 AND active = TRUE
`

type CountRetencionesByEntidadParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	EntidadTipo string      `json:"entidad_tipo"`
	EntidadID   pgtype.UUID `json:"entidad_id"`
}

func (q *Queries) CountRetencionesByEntidad(ctx context.Context, arg CountRetencionesByEntidadParams) (int64, error) {
	row := q.db.QueryRow(ctx, countRetencionesByEntidad, arg.UsuarioID, arg.EntidadTipo, arg.EntidadID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

// --- UpdateRetencionEstado ---

const updateRetencionEstado = `-- name: UpdateRetencionEstado :one
UPDATE retenciones SET estado = $3, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, tipo, entidad_tipo, entidad_id, pago_id, numero_certificado, fecha, base_imponible, alicuota, monto, periodo, estado, observaciones, usuario_id, active, created_at, updated_at
`

type UpdateRetencionEstadoParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
	Estado    string      `json:"estado"`
}

func (q *Queries) UpdateRetencionEstado(ctx context.Context, arg UpdateRetencionEstadoParams) (Retencion, error) {
	row := q.db.QueryRow(ctx, updateRetencionEstado, arg.ID, arg.UsuarioID, arg.Estado)
	var i Retencion
	err := row.Scan(
		&i.ID, &i.Tipo, &i.EntidadTipo, &i.EntidadID, &i.PagoID,
		&i.NumeroCertificado, &i.Fecha, &i.BaseImponible, &i.Alicuota,
		&i.Monto, &i.Periodo, &i.Estado, &i.Observaciones,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- SoftDeleteRetencion ---

const softDeleteRetencion = `-- name: SoftDeleteRetencion :exec
UPDATE retenciones SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteRetencionParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteRetencion(ctx context.Context, arg SoftDeleteRetencionParams) error {
	_, err := q.db.Exec(ctx, softDeleteRetencion, arg.ID, arg.UsuarioID)
	return err
}
