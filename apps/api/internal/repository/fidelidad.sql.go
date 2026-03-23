package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// --- Models ---

type ProgramaFidelidad struct {
	ID            pgtype.UUID        `json:"id"`
	Nombre        string             `json:"nombre"`
	PuntosPorPeso pgtype.Numeric     `json:"puntos_por_peso"`
	ValorPunto    pgtype.Numeric     `json:"valor_punto"`
	MinimoCanje   int32              `json:"minimo_canje"`
	Activo        bool               `json:"activo"`
	UsuarioID     pgtype.UUID        `json:"usuario_id"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
}

type PuntosCliente struct {
	ID             pgtype.UUID        `json:"id"`
	ClienteID      pgtype.UUID        `json:"cliente_id"`
	Tipo           string             `json:"tipo"`
	Puntos         int32              `json:"puntos"`
	SaldoAnterior  int32              `json:"saldo_anterior"`
	SaldoNuevo     int32              `json:"saldo_nuevo"`
	ReferenciaID   pgtype.UUID        `json:"referencia_id"`
	ReferenciaTipo pgtype.Text        `json:"referencia_tipo"`
	Descripcion    pgtype.Text        `json:"descripcion"`
	UsuarioID      pgtype.UUID        `json:"usuario_id"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
}

// --- GetProgramaFidelidad ---

const getProgramaFidelidad = `-- name: GetProgramaFidelidad :one
SELECT id, nombre, puntos_por_peso, valor_punto, minimo_canje, activo, usuario_id, created_at, updated_at
FROM programa_fidelidad
WHERE usuario_id = $1
ORDER BY created_at DESC
LIMIT 1
`

func (q *Queries) GetProgramaFidelidad(ctx context.Context, usuarioID pgtype.UUID) (ProgramaFidelidad, error) {
	row := q.db.QueryRow(ctx, getProgramaFidelidad, usuarioID)
	var i ProgramaFidelidad
	err := row.Scan(
		&i.ID, &i.Nombre, &i.PuntosPorPeso, &i.ValorPunto,
		&i.MinimoCanje, &i.Activo, &i.UsuarioID, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- CreateProgramaFidelidad ---

const createProgramaFidelidad = `-- name: CreateProgramaFidelidad :one
INSERT INTO programa_fidelidad (nombre, puntos_por_peso, valor_punto, minimo_canje, activo, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, nombre, puntos_por_peso, valor_punto, minimo_canje, activo, usuario_id, created_at, updated_at
`

type CreateProgramaFidelidadParams struct {
	Nombre        string         `json:"nombre"`
	PuntosPorPeso pgtype.Numeric `json:"puntos_por_peso"`
	ValorPunto    pgtype.Numeric `json:"valor_punto"`
	MinimoCanje   int32          `json:"minimo_canje"`
	Activo        bool           `json:"activo"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateProgramaFidelidad(ctx context.Context, arg CreateProgramaFidelidadParams) (ProgramaFidelidad, error) {
	row := q.db.QueryRow(ctx, createProgramaFidelidad,
		arg.Nombre, arg.PuntosPorPeso, arg.ValorPunto, arg.MinimoCanje, arg.Activo, arg.UsuarioID,
	)
	var i ProgramaFidelidad
	err := row.Scan(
		&i.ID, &i.Nombre, &i.PuntosPorPeso, &i.ValorPunto,
		&i.MinimoCanje, &i.Activo, &i.UsuarioID, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- UpdateProgramaFidelidad ---

const updateProgramaFidelidad = `-- name: UpdateProgramaFidelidad :one
UPDATE programa_fidelidad
SET nombre = $2, puntos_por_peso = $3, valor_punto = $4, minimo_canje = $5, activo = $6, updated_at = NOW()
WHERE id = $1 AND usuario_id = $7
RETURNING id, nombre, puntos_por_peso, valor_punto, minimo_canje, activo, usuario_id, created_at, updated_at
`

type UpdateProgramaFidelidadParams struct {
	ID            pgtype.UUID    `json:"id"`
	Nombre        string         `json:"nombre"`
	PuntosPorPeso pgtype.Numeric `json:"puntos_por_peso"`
	ValorPunto    pgtype.Numeric `json:"valor_punto"`
	MinimoCanje   int32          `json:"minimo_canje"`
	Activo        bool           `json:"activo"`
	UsuarioID     pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) UpdateProgramaFidelidad(ctx context.Context, arg UpdateProgramaFidelidadParams) (ProgramaFidelidad, error) {
	row := q.db.QueryRow(ctx, updateProgramaFidelidad,
		arg.ID, arg.Nombre, arg.PuntosPorPeso, arg.ValorPunto, arg.MinimoCanje, arg.Activo, arg.UsuarioID,
	)
	var i ProgramaFidelidad
	err := row.Scan(
		&i.ID, &i.Nombre, &i.PuntosPorPeso, &i.ValorPunto,
		&i.MinimoCanje, &i.Activo, &i.UsuarioID, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- CreateMovimientoPuntos ---

const createMovimientoPuntos = `-- name: CreateMovimientoPuntos :one
INSERT INTO puntos_cliente (cliente_id, tipo, puntos, saldo_anterior, saldo_nuevo, referencia_id, referencia_tipo, descripcion, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, cliente_id, tipo, puntos, saldo_anterior, saldo_nuevo, referencia_id, referencia_tipo, descripcion, usuario_id, created_at
`

type CreateMovimientoPuntosParams struct {
	ClienteID      pgtype.UUID `json:"cliente_id"`
	Tipo           string      `json:"tipo"`
	Puntos         int32       `json:"puntos"`
	SaldoAnterior  int32       `json:"saldo_anterior"`
	SaldoNuevo     int32       `json:"saldo_nuevo"`
	ReferenciaID   pgtype.UUID `json:"referencia_id"`
	ReferenciaTipo pgtype.Text `json:"referencia_tipo"`
	Descripcion    pgtype.Text `json:"descripcion"`
	UsuarioID      pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CreateMovimientoPuntos(ctx context.Context, arg CreateMovimientoPuntosParams) (PuntosCliente, error) {
	row := q.db.QueryRow(ctx, createMovimientoPuntos,
		arg.ClienteID, arg.Tipo, arg.Puntos, arg.SaldoAnterior, arg.SaldoNuevo,
		arg.ReferenciaID, arg.ReferenciaTipo, arg.Descripcion, arg.UsuarioID,
	)
	var i PuntosCliente
	err := row.Scan(
		&i.ID, &i.ClienteID, &i.Tipo, &i.Puntos, &i.SaldoAnterior, &i.SaldoNuevo,
		&i.ReferenciaID, &i.ReferenciaTipo, &i.Descripcion, &i.UsuarioID, &i.CreatedAt,
	)
	return i, err
}

// --- ListMovimientosByCliente ---

const listMovimientosByCliente = `-- name: ListMovimientosByCliente :many
SELECT id, cliente_id, tipo, puntos, saldo_anterior, saldo_nuevo, referencia_id, referencia_tipo, descripcion, usuario_id, created_at
FROM puntos_cliente
WHERE cliente_id = $1 AND usuario_id = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4
`

type ListMovimientosByClienteParams struct {
	ClienteID   pgtype.UUID `json:"cliente_id"`
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

func (q *Queries) ListMovimientosByCliente(ctx context.Context, arg ListMovimientosByClienteParams) ([]PuntosCliente, error) {
	rows, err := q.db.Query(ctx, listMovimientosByCliente,
		arg.ClienteID, arg.UsuarioID, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []PuntosCliente
	for rows.Next() {
		var i PuntosCliente
		if err := rows.Scan(
			&i.ID, &i.ClienteID, &i.Tipo, &i.Puntos, &i.SaldoAnterior, &i.SaldoNuevo,
			&i.ReferenciaID, &i.ReferenciaTipo, &i.Descripcion, &i.UsuarioID, &i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- CountMovimientosByCliente ---

const countMovimientosByCliente = `-- name: CountMovimientosByCliente :one
SELECT COUNT(*) FROM puntos_cliente
WHERE cliente_id = $1 AND usuario_id = $2
`

type CountMovimientosByClienteParams struct {
	ClienteID pgtype.UUID `json:"cliente_id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) CountMovimientosByCliente(ctx context.Context, arg CountMovimientosByClienteParams) (int64, error) {
	row := q.db.QueryRow(ctx, countMovimientosByCliente, arg.ClienteID, arg.UsuarioID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

// --- GetSaldoPuntos ---

const getSaldoPuntos = `-- name: GetSaldoPuntos :one
SELECT COALESCE(saldo_nuevo, 0) as saldo
FROM puntos_cliente
WHERE cliente_id = $1 AND usuario_id = $2
ORDER BY created_at DESC
LIMIT 1
`

type GetSaldoPuntosParams struct {
	ClienteID pgtype.UUID `json:"cliente_id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetSaldoPuntos(ctx context.Context, arg GetSaldoPuntosParams) (int32, error) {
	row := q.db.QueryRow(ctx, getSaldoPuntos, arg.ClienteID, arg.UsuarioID)
	var saldo int32
	err := row.Scan(&saldo)
	return saldo, err
}

// --- GetTotalAcumulado ---

const getTotalAcumulado = `-- name: GetTotalAcumulado :one
SELECT COALESCE(SUM(puntos), 0)::INTEGER
FROM puntos_cliente
WHERE cliente_id = $1 AND usuario_id = $2 AND tipo = 'ACUMULACION'
`

type GetTotalAcumuladoParams struct {
	ClienteID pgtype.UUID `json:"cliente_id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetTotalAcumulado(ctx context.Context, arg GetTotalAcumuladoParams) (int32, error) {
	row := q.db.QueryRow(ctx, getTotalAcumulado, arg.ClienteID, arg.UsuarioID)
	var total int32
	err := row.Scan(&total)
	return total, err
}

// --- GetTotalCanjeado ---

const getTotalCanjeado = `-- name: GetTotalCanjeado :one
SELECT COALESCE(ABS(SUM(puntos)), 0)::INTEGER
FROM puntos_cliente
WHERE cliente_id = $1 AND usuario_id = $2 AND tipo = 'CANJE'
`

type GetTotalCanjeadoParams struct {
	ClienteID pgtype.UUID `json:"cliente_id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) GetTotalCanjeado(ctx context.Context, arg GetTotalCanjeadoParams) (int32, error) {
	row := q.db.QueryRow(ctx, getTotalCanjeado, arg.ClienteID, arg.UsuarioID)
	var total int32
	err := row.Scan(&total)
	return total, err
}
