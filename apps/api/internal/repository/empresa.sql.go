package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type ConfiguracionEmpresa struct {
	ID           pgtype.UUID        `json:"id"`
	RazonSocial  string             `json:"razon_social"`
	Cuit         pgtype.Text        `json:"cuit"`
	CondicionIva pgtype.Text        `json:"condicion_iva"`
	Direccion    pgtype.Text        `json:"direccion"`
	Telefono     pgtype.Text        `json:"telefono"`
	Email        pgtype.Text        `json:"email"`
	LogoUrl      pgtype.Text        `json:"logo_url"`
	PieFactura   pgtype.Text        `json:"pie_factura"`
	UsuarioID    pgtype.UUID        `json:"usuario_id"`
	CreatedAt    pgtype.Timestamptz `json:"created_at"`
	UpdatedAt    pgtype.Timestamptz `json:"updated_at"`
}

const getConfiguracionEmpresaByUsuario = `-- name: GetConfiguracionEmpresaByUsuario :one
SELECT id, razon_social, cuit, condicion_iva, direccion, telefono, email, logo_url, pie_factura, usuario_id, created_at, updated_at
FROM configuracion_empresa
WHERE usuario_id = $1
`

func (q *Queries) GetConfiguracionEmpresaByUsuario(ctx context.Context, usuarioID pgtype.UUID) (ConfiguracionEmpresa, error) {
	row := q.db.QueryRow(ctx, getConfiguracionEmpresaByUsuario, usuarioID)
	var i ConfiguracionEmpresa
	err := row.Scan(
		&i.ID, &i.RazonSocial, &i.Cuit, &i.CondicionIva, &i.Direccion,
		&i.Telefono, &i.Email, &i.LogoUrl, &i.PieFactura,
		&i.UsuarioID, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const upsertConfiguracionEmpresa = `-- name: UpsertConfiguracionEmpresa :one
INSERT INTO configuracion_empresa (razon_social, cuit, condicion_iva, direccion, telefono, email, logo_url, pie_factura, usuario_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (usuario_id) DO UPDATE SET
    razon_social = $1,
    cuit = $2,
    condicion_iva = $3,
    direccion = $4,
    telefono = $5,
    email = $6,
    logo_url = $7,
    pie_factura = $8,
    updated_at = NOW()
RETURNING id, razon_social, cuit, condicion_iva, direccion, telefono, email, logo_url, pie_factura, usuario_id, created_at, updated_at
`

type UpsertConfiguracionEmpresaParams struct {
	RazonSocial  string      `json:"razon_social"`
	Cuit         pgtype.Text `json:"cuit"`
	CondicionIva pgtype.Text `json:"condicion_iva"`
	Direccion    pgtype.Text `json:"direccion"`
	Telefono     pgtype.Text `json:"telefono"`
	Email        pgtype.Text `json:"email"`
	LogoUrl      pgtype.Text `json:"logo_url"`
	PieFactura   pgtype.Text `json:"pie_factura"`
	UsuarioID    pgtype.UUID `json:"usuario_id"`
}

func (q *Queries) UpsertConfiguracionEmpresa(ctx context.Context, arg UpsertConfiguracionEmpresaParams) (ConfiguracionEmpresa, error) {
	row := q.db.QueryRow(ctx, upsertConfiguracionEmpresa,
		arg.RazonSocial, arg.Cuit, arg.CondicionIva, arg.Direccion,
		arg.Telefono, arg.Email, arg.LogoUrl, arg.PieFactura, arg.UsuarioID,
	)
	var i ConfiguracionEmpresa
	err := row.Scan(
		&i.ID, &i.RazonSocial, &i.Cuit, &i.CondicionIva, &i.Direccion,
		&i.Telefono, &i.Email, &i.LogoUrl, &i.PieFactura,
		&i.UsuarioID, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}
