package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type AuditLog struct {
	ID               pgtype.UUID        `json:"id"`
	UsuarioID        pgtype.UUID        `json:"usuario_id"`
	Accion           string             `json:"accion"`
	Entidad          string             `json:"entidad"`
	EntidadID        pgtype.UUID        `json:"entidad_id"`
	DatosAnteriores  []byte             `json:"datos_anteriores"`
	DatosNuevos      []byte             `json:"datos_nuevos"`
	IpAddress        pgtype.Text        `json:"ip_address"`
	UserAgent        pgtype.Text        `json:"user_agent"`
	CreatedAt        pgtype.Timestamptz `json:"created_at"`
}

const createAuditLog = `-- name: CreateAuditLog :one
INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos, ip_address, user_agent)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos, ip_address, user_agent, created_at
`

type CreateAuditLogParams struct {
	UsuarioID       pgtype.UUID `json:"usuario_id"`
	Accion          string      `json:"accion"`
	Entidad         string      `json:"entidad"`
	EntidadID       pgtype.UUID `json:"entidad_id"`
	DatosAnteriores []byte      `json:"datos_anteriores"`
	DatosNuevos     []byte      `json:"datos_nuevos"`
	IpAddress       pgtype.Text `json:"ip_address"`
	UserAgent       pgtype.Text `json:"user_agent"`
}

func (q *Queries) CreateAuditLog(ctx context.Context, arg CreateAuditLogParams) (AuditLog, error) {
	row := q.db.QueryRow(ctx, createAuditLog,
		arg.UsuarioID,
		arg.Accion,
		arg.Entidad,
		arg.EntidadID,
		arg.DatosAnteriores,
		arg.DatosNuevos,
		arg.IpAddress,
		arg.UserAgent,
	)
	var i AuditLog
	err := row.Scan(
		&i.ID,
		&i.UsuarioID,
		&i.Accion,
		&i.Entidad,
		&i.EntidadID,
		&i.DatosAnteriores,
		&i.DatosNuevos,
		&i.IpAddress,
		&i.UserAgent,
		&i.CreatedAt,
	)
	return i, err
}

const listAuditLog = `-- name: ListAuditLog :many
SELECT id, usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_nuevos, ip_address, user_agent, created_at
FROM audit_log
WHERE ($1::uuid IS NULL OR usuario_id = $1)
  AND ($2::text = '' OR entidad = $2)
  AND ($3::uuid IS NULL OR usuario_id = $3)
  AND ($4::timestamptz IS NULL OR created_at >= $4)
  AND ($5::timestamptz IS NULL OR created_at <= $5)
ORDER BY created_at DESC
LIMIT $6 OFFSET $7
`

type ListAuditLogParams struct {
	UsuarioID  pgtype.UUID        `json:"usuario_id"`
	Entidad    string             `json:"entidad"`
	ActorID    pgtype.UUID        `json:"actor_id"`
	FechaDesde pgtype.Timestamptz `json:"fecha_desde"`
	FechaHasta pgtype.Timestamptz `json:"fecha_hasta"`
	QueryLimit int32              `json:"query_limit"`
	QueryOffset int32             `json:"query_offset"`
}

func (q *Queries) ListAuditLog(ctx context.Context, arg ListAuditLogParams) ([]AuditLog, error) {
	rows, err := q.db.Query(ctx, listAuditLog,
		arg.UsuarioID,
		arg.Entidad,
		arg.ActorID,
		arg.FechaDesde,
		arg.FechaHasta,
		arg.QueryLimit,
		arg.QueryOffset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []AuditLog
	for rows.Next() {
		var i AuditLog
		if err := rows.Scan(
			&i.ID,
			&i.UsuarioID,
			&i.Accion,
			&i.Entidad,
			&i.EntidadID,
			&i.DatosAnteriores,
			&i.DatosNuevos,
			&i.IpAddress,
			&i.UserAgent,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

const countAuditLog = `-- name: CountAuditLog :one
SELECT COUNT(*) FROM audit_log
WHERE ($1::uuid IS NULL OR usuario_id = $1)
  AND ($2::text = '' OR entidad = $2)
  AND ($3::uuid IS NULL OR usuario_id = $3)
  AND ($4::timestamptz IS NULL OR created_at >= $4)
  AND ($5::timestamptz IS NULL OR created_at <= $5)
`

type CountAuditLogParams struct {
	UsuarioID  pgtype.UUID        `json:"usuario_id"`
	Entidad    string             `json:"entidad"`
	ActorID    pgtype.UUID        `json:"actor_id"`
	FechaDesde pgtype.Timestamptz `json:"fecha_desde"`
	FechaHasta pgtype.Timestamptz `json:"fecha_hasta"`
}

func (q *Queries) CountAuditLog(ctx context.Context, arg CountAuditLogParams) (int64, error) {
	row := q.db.QueryRow(ctx, countAuditLog,
		arg.UsuarioID,
		arg.Entidad,
		arg.ActorID,
		arg.FechaDesde,
		arg.FechaHasta,
	)
	var count int64
	err := row.Scan(&count)
	return count, err
}
