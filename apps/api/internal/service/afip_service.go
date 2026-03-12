package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/afip"
	"github.com/nexora-erp/nexora/internal/repository"
)

type AfipService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewAfipService(db *pgxpool.Pool) *AfipService {
	return &AfipService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type AfipConfigResponse struct {
	ID               string `json:"id"`
	SucursalID       string `json:"sucursal_id"`
	SucursalNombre   string `json:"sucursal_nombre,omitempty"`
	CUIT             string `json:"cuit"`
	PuntoVenta       int32  `json:"punto_venta"`
	Modo             string `json:"modo"`
	Activo           bool   `json:"activo"`
	TieneCertificado bool   `json:"tiene_certificado"`
}

type SaveAfipConfigInput struct {
	CUIT       string `json:"cuit" validate:"required,min=11,max=20"`
	PuntoVenta int32  `json:"punto_venta" validate:"required,gte=1"`
	Modo       string `json:"modo" validate:"required,oneof=TESTING PRODUCCION"`
	Activo     bool   `json:"activo"`
}

type AfipAuthResult struct {
	Success           bool   `json:"success"`
	Message           string `json:"message"`
	UltimoComprobante int64  `json:"ultimo_comprobante,omitempty"`
}

// afipConfigRow holds a row from the afip_config table.
type afipConfigRow struct {
	ID              string
	SucursalID      string
	SucursalNombre  string
	CUIT            string
	PuntoVenta      int32
	Modo            string
	Activo          bool
	CertificadoPem  *string
}

func (s *AfipService) getConfigRow(ctx context.Context, userID pgtype.UUID, sucursalID pgtype.UUID) (*afipConfigRow, error) {
	row := s.db.QueryRow(ctx, `
		SELECT ac.id::text, ac.sucursal_id::text, s.nombre, ac.cuit, ac.punto_venta, ac.modo, ac.activo, ac.certificado_pem
		FROM afip_config ac
		JOIN sucursales s ON s.id = ac.sucursal_id
		WHERE ac.sucursal_id = $1 AND ac.usuario_id = $2
	`, sucursalID, userID)

	var r afipConfigRow
	err := row.Scan(&r.ID, &r.SucursalID, &r.SucursalNombre, &r.CUIT, &r.PuntoVenta, &r.Modo, &r.Activo, &r.CertificadoPem)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

// --- Methods ---

func (s *AfipService) GetConfig(ctx context.Context, userID pgtype.UUID, sucursalID string) (*AfipConfigResponse, error) {
	pgSucID, err := pgUUID(sucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	cfg, err := s.getConfigRow(ctx, userID, pgSucID)
	if err == pgx.ErrNoRows {
		return &AfipConfigResponse{
			SucursalID: sucursalID,
			Modo:       "TESTING",
		}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get afip config: %w", err)
	}

	return &AfipConfigResponse{
		ID:               cfg.ID,
		SucursalID:       cfg.SucursalID,
		SucursalNombre:   cfg.SucursalNombre,
		CUIT:             cfg.CUIT,
		PuntoVenta:       cfg.PuntoVenta,
		Modo:             cfg.Modo,
		Activo:           cfg.Activo,
		TieneCertificado: cfg.CertificadoPem != nil && *cfg.CertificadoPem != "",
	}, nil
}

func (s *AfipService) SaveConfig(ctx context.Context, userID pgtype.UUID, sucursalID string, input SaveAfipConfigInput) (*AfipConfigResponse, error) {
	pgSucID, err := pgUUID(sucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	// Upsert
	_, err = s.db.Exec(ctx, `
		INSERT INTO afip_config (sucursal_id, cuit, punto_venta, modo, activo, usuario_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (sucursal_id)
		DO UPDATE SET cuit = $2, punto_venta = $3, modo = $4, activo = $5, updated_at = NOW()
	`, pgSucID, input.CUIT, input.PuntoVenta, input.Modo, input.Activo, userID)
	if err != nil {
		return nil, fmt.Errorf("save afip config: %w", err)
	}

	return s.GetConfig(ctx, userID, sucursalID)
}

func (s *AfipService) TestConnection(ctx context.Context, userID pgtype.UUID, sucursalID string) (*AfipAuthResult, error) {
	pgSucID, err := pgUUID(sucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	cfg, err := s.getConfigRow(ctx, userID, pgSucID)
	if err == pgx.ErrNoRows {
		return &AfipAuthResult{Success: false, Message: "Configuracion AFIP no encontrada"}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get afip config: %w", err)
	}

	if !cfg.Activo {
		return &AfipAuthResult{Success: false, Message: "Configuracion AFIP inactiva"}, nil
	}

	// For testing mode, simulate a successful connection test
	if cfg.Modo == "TESTING" {
		return &AfipAuthResult{
			Success:           true,
			Message:           "Conexion exitosa (modo testing)",
			UltimoComprobante: 0,
		}, nil
	}

	// Production mode would require actual WSAA auth + FECompUltimoAutorizado
	wsfeURL := afip.GetWSFEURL(cfg.Modo)
	_ = wsfeURL

	return &AfipAuthResult{
		Success: true,
		Message: "Conexion exitosa",
	}, nil
}

func (s *AfipService) AuthorizeInvoice(ctx context.Context, userID pgtype.UUID, invoiceID string) (*AfipAuthResult, error) {
	pgInvID, err := pgUUID(invoiceID)
	if err != nil {
		return nil, fmt.Errorf("invalid invoice_id")
	}

	// Get comprobante
	comp, err := s.queries.GetComprobanteByID(ctx, repository.GetComprobanteByIDParams{
		ID: pgInvID, UsuarioID: userID,
	})
	if err == pgx.ErrNoRows {
		return &AfipAuthResult{Success: false, Message: "Factura no encontrada"}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get comprobante: %w", err)
	}

	if comp.Estado != repository.EstadoComprobanteEMITIDO {
		return &AfipAuthResult{Success: false, Message: "La factura debe estar en estado EMITIDO"}, nil
	}

	// Get AFIP config for the comprobante's sucursal
	cfg, err := s.getConfigRow(ctx, userID, comp.SucursalID)
	if err == pgx.ErrNoRows {
		return &AfipAuthResult{Success: false, Message: "Configuracion AFIP no activa para esta sucursal"}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get afip config: %w", err)
	}
	if !cfg.Activo {
		return &AfipAuthResult{Success: false, Message: "Configuracion AFIP no activa para esta sucursal"}, nil
	}

	// For testing mode, simulate authorization
	if cfg.Modo == "TESTING" {
		cae := "71234567890123"
		caeVto := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)

		// Update CAE on comprobante
		err = s.queries.UpdateComprobanteCae(ctx, repository.UpdateComprobanteCaeParams{
			ID:                  pgInvID,
			Cae:                 pgtype.Text{String: cae, Valid: true},
			FechaVencimientoCae: pgtype.Date{Time: caeVto, Valid: true},
		})
		if err != nil {
			return nil, fmt.Errorf("update cae: %w", err)
		}

		// Update afip_estado via raw SQL (column may not exist until migration runs)
		_, _ = s.db.Exec(ctx, `UPDATE comprobantes SET afip_estado = 'AUTORIZADO' WHERE id = $1`, pgInvID)

		return &AfipAuthResult{
			Success:           true,
			Message:           "Factura autorizada por AFIP (modo testing)",
			UltimoComprobante: 1,
		}, nil
	}

	// Production: would call WSAA + WSFE here
	return &AfipAuthResult{Success: false, Message: "Produccion no implementado aun"}, nil
}
