package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type VisitaCliente struct {
	ID               pgtype.UUID        `json:"id"`
	VendedorID       pgtype.UUID        `json:"vendedor_id"`
	ClienteID        pgtype.UUID        `json:"cliente_id"`
	DireccionID      pgtype.UUID        `json:"direccion_id"`
	Fecha            pgtype.Date        `json:"fecha"`
	HoraInicio       pgtype.Time        `json:"hora_inicio"`
	HoraFin          pgtype.Time        `json:"hora_fin"`
	DuracionMinutos  pgtype.Int4        `json:"duracion_minutos"`
	Resultado        string             `json:"resultado"`
	PedidoGeneradoID pgtype.UUID        `json:"pedido_generado_id"`
	Latitud          pgtype.Numeric     `json:"latitud"`
	Longitud         pgtype.Numeric     `json:"longitud"`
	Notas            pgtype.Text        `json:"notas"`
	UsuarioID        pgtype.UUID        `json:"usuario_id"`
	Active           bool               `json:"active"`
	CreatedAt        pgtype.Timestamptz `json:"created_at"`
	UpdatedAt        pgtype.Timestamptz `json:"updated_at"`
}

// --- Create ---

const createVisitaCliente = `
INSERT INTO visitas_cliente (vendedor_id, cliente_id, direccion_id, fecha, hora_inicio, resultado, latitud, longitud, notas, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, vendedor_id, cliente_id, direccion_id, fecha, hora_inicio, hora_fin, duracion_minutos, resultado, pedido_generado_id, latitud, longitud, notas, usuario_id, active, created_at, updated_at
`

type CreateVisitaClienteParams struct {
	VendedorID  pgtype.UUID    `json:"vendedor_id"`
	ClienteID   pgtype.UUID    `json:"cliente_id"`
	DireccionID pgtype.UUID    `json:"direccion_id"`
	Fecha       pgtype.Date    `json:"fecha"`
	HoraInicio  pgtype.Time    `json:"hora_inicio"`
	Resultado   string         `json:"resultado"`
	Latitud     pgtype.Numeric `json:"latitud"`
	Longitud    pgtype.Numeric `json:"longitud"`
	Notas       pgtype.Text    `json:"notas"`
	UsuarioID   pgtype.UUID    `json:"usuario_id"`
}

func (q *Queries) CreateVisitaCliente(ctx context.Context, arg CreateVisitaClienteParams) (VisitaCliente, error) {
	row := q.db.QueryRow(ctx, createVisitaCliente,
		arg.VendedorID, arg.ClienteID, arg.DireccionID, arg.Fecha,
		arg.HoraInicio, arg.Resultado, arg.Latitud, arg.Longitud,
		arg.Notas, arg.UsuarioID,
	)
	var i VisitaCliente
	err := row.Scan(
		&i.ID, &i.VendedorID, &i.ClienteID, &i.DireccionID, &i.Fecha,
		&i.HoraInicio, &i.HoraFin, &i.DuracionMinutos, &i.Resultado,
		&i.PedidoGeneradoID, &i.Latitud, &i.Longitud, &i.Notas,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- Get by ID with JOINs ---

const getVisitaByID = `
SELECT
	v.id, v.vendedor_id, e.nombre || ' ' || COALESCE(e.apellido, '') AS vendedor_nombre,
	v.cliente_id, c.nombre || ' ' || COALESCE(c.apellido, '') AS cliente_nombre,
	v.direccion_id, COALESCE(d.calle || ' ' || COALESCE(d.numero, '') || ', ' || COALESCE(d.localidad, ''), '') AS direccion_resumen,
	v.fecha, v.hora_inicio, v.hora_fin, v.duracion_minutos, v.resultado,
	v.pedido_generado_id, v.latitud, v.longitud, v.notas,
	v.usuario_id, v.active, v.created_at, v.updated_at
FROM visitas_cliente v
JOIN empleados e ON e.id = v.vendedor_id
JOIN clientes c ON c.id = v.cliente_id
LEFT JOIN direcciones d ON d.id = v.direccion_id
WHERE v.id = $1 AND v.usuario_id = $2 AND v.active = TRUE
`

type GetVisitaByIDParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

type GetVisitaByIDRow struct {
	ID               pgtype.UUID        `json:"id"`
	VendedorID       pgtype.UUID        `json:"vendedor_id"`
	VendedorNombre   string             `json:"vendedor_nombre"`
	ClienteID        pgtype.UUID        `json:"cliente_id"`
	ClienteNombre    string             `json:"cliente_nombre"`
	DireccionID      pgtype.UUID        `json:"direccion_id"`
	DireccionResumen string             `json:"direccion_resumen"`
	Fecha            pgtype.Date        `json:"fecha"`
	HoraInicio       pgtype.Time        `json:"hora_inicio"`
	HoraFin          pgtype.Time        `json:"hora_fin"`
	DuracionMinutos  pgtype.Int4        `json:"duracion_minutos"`
	Resultado        string             `json:"resultado"`
	PedidoGeneradoID pgtype.UUID        `json:"pedido_generado_id"`
	Latitud          pgtype.Numeric     `json:"latitud"`
	Longitud         pgtype.Numeric     `json:"longitud"`
	Notas            pgtype.Text        `json:"notas"`
	UsuarioID        pgtype.UUID        `json:"usuario_id"`
	Active           bool               `json:"active"`
	CreatedAt        pgtype.Timestamptz `json:"created_at"`
	UpdatedAt        pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) GetVisitaByID(ctx context.Context, arg GetVisitaByIDParams) (GetVisitaByIDRow, error) {
	row := q.db.QueryRow(ctx, getVisitaByID, arg.ID, arg.UsuarioID)
	var i GetVisitaByIDRow
	err := row.Scan(
		&i.ID, &i.VendedorID, &i.VendedorNombre, &i.ClienteID, &i.ClienteNombre,
		&i.DireccionID, &i.DireccionResumen,
		&i.Fecha, &i.HoraInicio, &i.HoraFin, &i.DuracionMinutos, &i.Resultado,
		&i.PedidoGeneradoID, &i.Latitud, &i.Longitud, &i.Notas,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- List with filters ---

const listVisitas = `
SELECT
	v.id, e.nombre || ' ' || COALESCE(e.apellido, '') AS vendedor_nombre,
	v.cliente_id, c.nombre || ' ' || COALESCE(c.apellido, '') AS cliente_nombre,
	v.fecha, v.hora_inicio, v.hora_fin, v.duracion_minutos, v.resultado,
	v.notas, v.created_at
FROM visitas_cliente v
JOIN empleados e ON e.id = v.vendedor_id
JOIN clientes c ON c.id = v.cliente_id
WHERE v.usuario_id = $1 AND v.active = TRUE
	AND ($2::uuid IS NULL OR v.vendedor_id = $2)
	AND ($3::date IS NULL OR v.fecha >= $3)
	AND ($4::date IS NULL OR v.fecha <= $4)
	AND ($5::varchar IS NULL OR v.resultado = $5)
ORDER BY v.fecha DESC, v.hora_inicio ASC NULLS LAST
LIMIT $6 OFFSET $7
`

type ListVisitasParams struct {
	UsuarioID   pgtype.UUID `json:"usuario_id"`
	VendedorID  pgtype.UUID `json:"vendedor_id"`
	FechaDesde  pgtype.Date `json:"fecha_desde"`
	FechaHasta  pgtype.Date `json:"fecha_hasta"`
	Resultado   pgtype.Text `json:"resultado"`
	QueryLimit  int32       `json:"query_limit"`
	QueryOffset int32       `json:"query_offset"`
}

type ListVisitasRow struct {
	ID              pgtype.UUID        `json:"id"`
	VendedorNombre  string             `json:"vendedor_nombre"`
	ClienteID       pgtype.UUID        `json:"cliente_id"`
	ClienteNombre   string             `json:"cliente_nombre"`
	Fecha           pgtype.Date        `json:"fecha"`
	HoraInicio      pgtype.Time        `json:"hora_inicio"`
	HoraFin         pgtype.Time        `json:"hora_fin"`
	DuracionMinutos pgtype.Int4        `json:"duracion_minutos"`
	Resultado       string             `json:"resultado"`
	Notas           pgtype.Text        `json:"notas"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
}

func (q *Queries) ListVisitas(ctx context.Context, arg ListVisitasParams) ([]ListVisitasRow, error) {
	rows, err := q.db.Query(ctx, listVisitas,
		arg.UsuarioID, arg.VendedorID, arg.FechaDesde, arg.FechaHasta,
		arg.Resultado, arg.QueryLimit, arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListVisitasRow
	for rows.Next() {
		var i ListVisitasRow
		if err := rows.Scan(
			&i.ID, &i.VendedorNombre, &i.ClienteID, &i.ClienteNombre,
			&i.Fecha, &i.HoraInicio, &i.HoraFin, &i.DuracionMinutos,
			&i.Resultado, &i.Notas, &i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- Count with filters ---

const countVisitas = `
SELECT COUNT(*)
FROM visitas_cliente v
WHERE v.usuario_id = $1 AND v.active = TRUE
	AND ($2::uuid IS NULL OR v.vendedor_id = $2)
	AND ($3::date IS NULL OR v.fecha >= $3)
	AND ($4::date IS NULL OR v.fecha <= $4)
	AND ($5::varchar IS NULL OR v.resultado = $5)
`

type CountVisitasParams struct {
	UsuarioID  pgtype.UUID `json:"usuario_id"`
	VendedorID pgtype.UUID `json:"vendedor_id"`
	FechaDesde pgtype.Date `json:"fecha_desde"`
	FechaHasta pgtype.Date `json:"fecha_hasta"`
	Resultado  pgtype.Text `json:"resultado"`
}

func (q *Queries) CountVisitas(ctx context.Context, arg CountVisitasParams) (int64, error) {
	row := q.db.QueryRow(ctx, countVisitas,
		arg.UsuarioID, arg.VendedorID, arg.FechaDesde, arg.FechaHasta, arg.Resultado,
	)
	var count int64
	err := row.Scan(&count)
	return count, err
}

// --- List by vendedor for today ---

const listVisitasByVendedorHoy = `
SELECT
	v.id, e.nombre || ' ' || COALESCE(e.apellido, '') AS vendedor_nombre,
	v.cliente_id, c.nombre || ' ' || COALESCE(c.apellido, '') AS cliente_nombre,
	v.direccion_id, COALESCE(d.calle || ' ' || COALESCE(d.numero, '') || ', ' || COALESCE(d.localidad, ''), '') AS direccion_resumen,
	v.fecha, v.hora_inicio, v.hora_fin, v.duracion_minutos, v.resultado,
	v.latitud, v.longitud, v.notas, v.created_at
FROM visitas_cliente v
JOIN empleados e ON e.id = v.vendedor_id
JOIN clientes c ON c.id = v.cliente_id
LEFT JOIN direcciones d ON d.id = v.direccion_id
WHERE v.usuario_id = $1 AND v.vendedor_id = $2 AND v.fecha = CURRENT_DATE AND v.active = TRUE
ORDER BY v.hora_inicio ASC NULLS LAST
`

type ListVisitasByVendedorHoyParams struct {
	UsuarioID  pgtype.UUID `json:"usuario_id"`
	VendedorID pgtype.UUID `json:"vendedor_id"`
}

type ListVisitasByVendedorHoyRow struct {
	ID               pgtype.UUID        `json:"id"`
	VendedorNombre   string             `json:"vendedor_nombre"`
	ClienteID        pgtype.UUID        `json:"cliente_id"`
	ClienteNombre    string             `json:"cliente_nombre"`
	DireccionID      pgtype.UUID        `json:"direccion_id"`
	DireccionResumen string             `json:"direccion_resumen"`
	Fecha            pgtype.Date        `json:"fecha"`
	HoraInicio       pgtype.Time        `json:"hora_inicio"`
	HoraFin          pgtype.Time        `json:"hora_fin"`
	DuracionMinutos  pgtype.Int4        `json:"duracion_minutos"`
	Resultado        string             `json:"resultado"`
	Latitud          pgtype.Numeric     `json:"latitud"`
	Longitud         pgtype.Numeric     `json:"longitud"`
	Notas            pgtype.Text        `json:"notas"`
	CreatedAt        pgtype.Timestamptz `json:"created_at"`
}

func (q *Queries) ListVisitasByVendedorHoy(ctx context.Context, arg ListVisitasByVendedorHoyParams) ([]ListVisitasByVendedorHoyRow, error) {
	rows, err := q.db.Query(ctx, listVisitasByVendedorHoy, arg.UsuarioID, arg.VendedorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListVisitasByVendedorHoyRow
	for rows.Next() {
		var i ListVisitasByVendedorHoyRow
		if err := rows.Scan(
			&i.ID, &i.VendedorNombre, &i.ClienteID, &i.ClienteNombre,
			&i.DireccionID, &i.DireccionResumen,
			&i.Fecha, &i.HoraInicio, &i.HoraFin, &i.DuracionMinutos, &i.Resultado,
			&i.Latitud, &i.Longitud, &i.Notas, &i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

// --- Update ---

const updateVisitaCliente = `
UPDATE visitas_cliente
SET hora_fin = $3, duracion_minutos = $4, resultado = $5, pedido_generado_id = $6, notas = $7, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2 AND active = TRUE
RETURNING id, vendedor_id, cliente_id, direccion_id, fecha, hora_inicio, hora_fin, duracion_minutos, resultado, pedido_generado_id, latitud, longitud, notas, usuario_id, active, created_at, updated_at
`

type UpdateVisitaClienteParams struct {
	ID               pgtype.UUID `json:"id"`
	UsuarioID        pgtype.UUID `json:"usuario_id"`
	HoraFin          pgtype.Time `json:"hora_fin"`
	DuracionMinutos  pgtype.Int4 `json:"duracion_minutos"`
	Resultado        string      `json:"resultado"`
	PedidoGeneradoID pgtype.UUID `json:"pedido_generado_id"`
	Notas            pgtype.Text `json:"notas"`
}

func (q *Queries) UpdateVisitaCliente(ctx context.Context, arg UpdateVisitaClienteParams) (VisitaCliente, error) {
	row := q.db.QueryRow(ctx, updateVisitaCliente,
		arg.ID, arg.UsuarioID, arg.HoraFin, arg.DuracionMinutos,
		arg.Resultado, arg.PedidoGeneradoID, arg.Notas,
	)
	var i VisitaCliente
	err := row.Scan(
		&i.ID, &i.VendedorID, &i.ClienteID, &i.DireccionID, &i.Fecha,
		&i.HoraInicio, &i.HoraFin, &i.DuracionMinutos, &i.Resultado,
		&i.PedidoGeneradoID, &i.Latitud, &i.Longitud, &i.Notas,
		&i.UsuarioID, &i.Active, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

// --- Soft Delete ---

const softDeleteVisitaCliente = `
UPDATE visitas_cliente SET active = FALSE, updated_at = NOW()
WHERE id = $1 AND usuario_id = $2
`

type SoftDeleteVisitaClienteParams struct {
	ID        pgtype.UUID `json:"id"`
	UsuarioID pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) SoftDeleteVisitaCliente(ctx context.Context, arg SoftDeleteVisitaClienteParams) error {
	_, err := q.db.Exec(ctx, softDeleteVisitaCliente, arg.ID, arg.UsuarioID)
	return err
}
