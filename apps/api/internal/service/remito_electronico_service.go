package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// RemitoElectronicoService handles AFIP electronic delivery notes (RG 4004/ARCA).
// This is a foundation — real AFIP integration requires SOAP calls similar to WSFE.
type RemitoElectronicoService struct {
	db *pgxpool.Pool
}

func NewRemitoElectronicoService(db *pgxpool.Pool) *RemitoElectronicoService {
	return &RemitoElectronicoService{db: db}
}

type RemitoElectronicoResponse struct {
	RemitoID       string `json:"remito_id"`
	COT            string `json:"cot"`            // Codigo de Operacion de Transporte
	FechaEmision   string `json:"fecha_emision"`
	FechaVigencia  string `json:"fecha_vigencia"`
	Estado         string `json:"estado"`         // PENDIENTE, AUTORIZADO, RECHAZADO
}

// SolicitarCOT requests a COT (Codigo de Operacion de Transporte) from AFIP
// for an electronic delivery note. RG 4004-E / ARCA system.
//
// In TESTING mode, returns a simulated COT.
// In PRODUCTION mode, would make SOAP calls to AFIP's ARCA web service.
func (s *RemitoElectronicoService) SolicitarCOT(ctx context.Context, userID pgtype.UUID, remitoID string) (*RemitoElectronicoResponse, error) {
	// Get remito data
	var numero string
	var estado string
	err := s.db.QueryRow(ctx,
		`SELECT r.numero, r.estado FROM remitos r WHERE r.id = $1 AND r.usuario_id = $2 AND r.active = true`,
		remitoID, userID).Scan(&numero, &estado)
	if err != nil {
		return nil, fmt.Errorf("remito not found: %w", err)
	}

	if estado != "EMITIDO" {
		return nil, fmt.Errorf("remito debe estar en estado EMITIDO para solicitar COT")
	}

	// Check AFIP config mode
	var modo string
	s.db.QueryRow(ctx,
		`SELECT modo FROM afip_config WHERE usuario_id = $1 AND activa = true LIMIT 1`,
		userID).Scan(&modo)

	if modo == "PRODUCCION" {
		// TODO: Implement real AFIP ARCA SOAP call
		// Would require:
		// 1. Authenticate with AFIP WSAA (same as WSFE)
		// 2. Call ARCA web service to request COT
		// 3. Parse response for COT number
		return nil, fmt.Errorf("ARCA produccion no implementado aun — use modo TESTING")
	}

	// TESTING mode: simulate COT
	cot := fmt.Sprintf("COT-%s-%d", numero, time.Now().Unix()%100000)
	vigencia := time.Now().Add(72 * time.Hour)

	log.Info().
		Str("remito_id", remitoID).
		Str("cot", cot).
		Msg("COT simulado generado (TESTING)")

	// Store COT in remito (add cot column if not exists — use raw query)
	_, _ = s.db.Exec(ctx,
		`UPDATE remitos SET observaciones = COALESCE(observaciones, '') || ' COT: ' || $3, updated_at = NOW()
		 WHERE id = $1 AND usuario_id = $2`,
		remitoID, userID, cot)

	return &RemitoElectronicoResponse{
		RemitoID:      remitoID,
		COT:           cot,
		FechaEmision:  time.Now().Format("2006-01-02"),
		FechaVigencia: vigencia.Format("2006-01-02"),
		Estado:        "AUTORIZADO",
	}, nil
}

// ConsultarCOT checks the status of a previously requested COT.
func (s *RemitoElectronicoService) ConsultarCOT(ctx context.Context, userID pgtype.UUID, remitoID string) (*RemitoElectronicoResponse, error) {
	// In a real implementation, would call AFIP ARCA to check COT status
	// For now, check if the remito has a COT in observaciones
	var observaciones string
	err := s.db.QueryRow(ctx,
		`SELECT COALESCE(observaciones, '') FROM remitos WHERE id = $1 AND usuario_id = $2`,
		remitoID, userID).Scan(&observaciones)
	if err != nil {
		return nil, fmt.Errorf("remito not found: %w", err)
	}

	// Simple check if COT was assigned
	if observaciones == "" {
		return &RemitoElectronicoResponse{
			RemitoID: remitoID,
			Estado:   "PENDIENTE",
		}, nil
	}

	return &RemitoElectronicoResponse{
		RemitoID: remitoID,
		COT:      "extraido de observaciones",
		Estado:   "AUTORIZADO",
	}, nil
}
