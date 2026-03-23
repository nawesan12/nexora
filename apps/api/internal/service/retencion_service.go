package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

var ErrRetencionNotFound = errors.New("retencion not found")

type RetencionService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewRetencionService(db *pgxpool.Pool) *RetencionService {
	return &RetencionService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type RetencionResponse struct {
	ID                string  `json:"id"`
	Tipo              string  `json:"tipo"`
	EntidadTipo       string  `json:"entidad_tipo"`
	EntidadID         string  `json:"entidad_id"`
	EntidadNombre     string  `json:"entidad_nombre"`
	PagoID            string  `json:"pago_id,omitempty"`
	NumeroCertificado string  `json:"numero_certificado,omitempty"`
	Fecha             string  `json:"fecha"`
	BaseImponible     float64 `json:"base_imponible"`
	Alicuota          float64 `json:"alicuota"`
	Monto             float64 `json:"monto"`
	Periodo           string  `json:"periodo,omitempty"`
	Estado            string  `json:"estado"`
	Observaciones     string  `json:"observaciones,omitempty"`
	CreatedAt         string  `json:"created_at"`
}

type CreateRetencionInput struct {
	Tipo              string  `json:"tipo" validate:"required,oneof=IIBB GANANCIAS IVA SUSS"`
	EntidadTipo       string  `json:"entidad_tipo" validate:"required,oneof=CLIENTE PROVEEDOR"`
	EntidadID         string  `json:"entidad_id" validate:"required,uuid"`
	PagoID            string  `json:"pago_id"`
	NumeroCertificado string  `json:"numero_certificado"`
	Fecha             string  `json:"fecha" validate:"required"`
	BaseImponible     float64 `json:"base_imponible" validate:"required,gt=0"`
	Alicuota          float64 `json:"alicuota" validate:"required,gte=0"`
	Monto             float64 `json:"monto" validate:"required,gt=0"`
	Periodo           string  `json:"periodo"`
	Observaciones     string  `json:"observaciones"`
}

// --- Methods ---

func (s *RetencionService) List(ctx context.Context, userID pgtype.UUID, tipo, entidadTipo, periodo string, limit, offset int32) ([]RetencionResponse, int, error) {
	items, err := s.queries.ListRetenciones(ctx, repository.ListRetencionesParams{
		UsuarioID:   userID,
		QueryLimit:  limit,
		QueryOffset: offset,
		Tipo:        tipo,
		EntidadTipo: entidadTipo,
		Periodo:     periodo,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list retenciones: %w", err)
	}

	count, err := s.queries.CountRetenciones(ctx, repository.CountRetencionesParams{
		UsuarioID:   userID,
		Tipo:        tipo,
		EntidadTipo: entidadTipo,
		Periodo:     periodo,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count retenciones: %w", err)
	}

	result := make([]RetencionResponse, 0, len(items))
	for _, r := range items {
		result = append(result, toRetencionResponse(r))
	}
	return result, int(count), nil
}

func (s *RetencionService) Get(ctx context.Context, userID pgtype.UUID, id string) (*RetencionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRetencionNotFound
	}

	r, err := s.queries.GetRetencionByID(ctx, repository.GetRetencionByIDParams{
		ID:        pgID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRetencionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get retencion: %w", err)
	}

	resp := toRetencionResponse(r)
	return &resp, nil
}

func (s *RetencionService) Create(ctx context.Context, userID pgtype.UUID, input CreateRetencionInput) (*RetencionResponse, error) {
	entidadID, err := pgUUID(input.EntidadID)
	if err != nil {
		return nil, fmt.Errorf("invalid entidad_id")
	}

	fecha, err := pgDate(input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha: %w", err)
	}

	var pagoID pgtype.UUID
	if input.PagoID != "" {
		pagoID, err = pgUUID(input.PagoID)
		if err != nil {
			return nil, fmt.Errorf("invalid pago_id")
		}
	}

	ret, err := s.queries.CreateRetencion(ctx, repository.CreateRetencionParams{
		Tipo:              input.Tipo,
		EntidadTipo:       input.EntidadTipo,
		EntidadID:         entidadID,
		PagoID:            pagoID,
		NumeroCertificado: pgText(input.NumeroCertificado),
		Fecha:             fecha,
		BaseImponible:     numericFromFloat(input.BaseImponible),
		Alicuota:          numericFromFloat(input.Alicuota),
		Monto:             numericFromFloat(input.Monto),
		Periodo:           pgText(input.Periodo),
		Estado:            "EMITIDA",
		Observaciones:     pgText(input.Observaciones),
		UsuarioID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create retencion: %w", err)
	}

	resp := toRetencionResponseFromBase(ret, "")
	return &resp, nil
}

func (s *RetencionService) Anular(ctx context.Context, userID pgtype.UUID, id string) (*RetencionResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRetencionNotFound
	}

	ret, err := s.queries.UpdateRetencionEstado(ctx, repository.UpdateRetencionEstadoParams{
		ID:        pgID,
		UsuarioID: userID,
		Estado:    "ANULADA",
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRetencionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("anular retencion: %w", err)
	}

	resp := toRetencionResponseFromBase(ret, "")
	return &resp, nil
}

func (s *RetencionService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrRetencionNotFound
	}

	return s.queries.SoftDeleteRetencion(ctx, repository.SoftDeleteRetencionParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

// GetCertificateData retrieves all data needed to render a retention certificate PDF.
func (s *RetencionService) GetCertificateData(ctx context.Context, userID pgtype.UUID, id string) (*RetencionCertificateInfo, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRetencionNotFound
	}

	query := `
		SELECT
			r.tipo, r.entidad_tipo, r.entidad_id,
			r.numero_certificado, r.fecha, r.base_imponible, r.alicuota, r.monto, r.periodo,
			COALESCE(ce.razon_social, '') AS company_name,
			COALESCE(ce.cuit, '') AS company_cuit,
			COALESCE(ce.direccion, '') AS company_address
		FROM retenciones r
		LEFT JOIN configuracion_empresa ce ON ce.usuario_id = r.usuario_id
		WHERE r.id = $1 AND r.usuario_id = $2 AND r.active = true
	`

	var info RetencionCertificateInfo
	var (
		entidadTipo string
		entidadID   pgtype.UUID
		fecha       pgtype.Date
		baseImp     pgtype.Numeric
		alicuota    pgtype.Numeric
		monto       pgtype.Numeric
		numCert     pgtype.Text
		periodo     pgtype.Text
	)
	err = s.db.QueryRow(ctx, query, pgID, userID).Scan(
		&info.Tipo, &entidadTipo, &entidadID,
		&numCert, &fecha, &baseImp, &alicuota, &monto, &periodo,
		&info.CompanyName, &info.CompanyCUIT, &info.CompanyAddress,
	)
	if err != nil {
		return nil, ErrRetencionNotFound
	}

	info.NumeroCertificado = textFromPg(numCert)
	info.FechaRetencion = dateFromPg(fecha)
	info.BaseImponible = floatFromNumeric(baseImp)
	info.Alicuota = floatFromNumeric(alicuota)
	info.MontoRetenido = floatFromNumeric(monto)
	info.Periodo = textFromPg(periodo)

	// Fetch entity (client or supplier) info
	if entidadTipo == "CLIENTE" {
		var nombre, cuit, direccion pgtype.Text
		err = s.db.QueryRow(ctx, `SELECT COALESCE(nombre,''), COALESCE(cuit,''), COALESCE(direccion,'') FROM clientes WHERE id = $1`, entidadID).Scan(&nombre, &cuit, &direccion)
		if err == nil {
			info.SujetoNombre = textFromPg(nombre)
			info.SujetoCUIT = textFromPg(cuit)
			info.SujetoAddress = textFromPg(direccion)
		}
	} else {
		var nombre, cuit, direccion pgtype.Text
		err = s.db.QueryRow(ctx, `SELECT COALESCE(razon_social,''), COALESCE(cuit,''), COALESCE(direccion,'') FROM proveedores WHERE id = $1`, entidadID).Scan(&nombre, &cuit, &direccion)
		if err == nil {
			info.SujetoNombre = textFromPg(nombre)
			info.SujetoCUIT = textFromPg(cuit)
			info.SujetoAddress = textFromPg(direccion)
		}
	}

	return &info, nil
}

// RetencionCertificateInfo holds all data needed to render a retention certificate.
type RetencionCertificateInfo struct {
	Tipo              string
	CompanyName       string
	CompanyCUIT       string
	CompanyAddress    string
	SujetoNombre      string
	SujetoCUIT        string
	SujetoAddress     string
	NumeroCertificado string
	FechaRetencion    string
	Periodo           string
	BaseImponible     float64
	Alicuota          float64
	MontoRetenido     float64
}

func toRetencionResponse(r repository.ListRetencionRow) RetencionResponse {
	return RetencionResponse{
		ID:                uuidStrFromPg(r.ID),
		Tipo:              r.Tipo,
		EntidadTipo:       r.EntidadTipo,
		EntidadID:         uuidStrFromPg(r.EntidadID),
		EntidadNombre:     textFromPg(r.EntidadNombre),
		PagoID:            uuidStrFromPg(r.PagoID),
		NumeroCertificado: textFromPg(r.NumeroCertificado),
		Fecha:             dateFromPg(r.Fecha),
		BaseImponible:     floatFromNumeric(r.BaseImponible),
		Alicuota:          floatFromNumeric(r.Alicuota),
		Monto:             floatFromNumeric(r.Monto),
		Periodo:           textFromPg(r.Periodo),
		Estado:            r.Estado,
		Observaciones:     textFromPg(r.Observaciones),
		CreatedAt:         r.CreatedAt.Time.Format(time.RFC3339),
	}
}

func toRetencionResponseFromBase(r repository.Retencion, entidadNombre string) RetencionResponse {
	return RetencionResponse{
		ID:                uuidStrFromPg(r.ID),
		Tipo:              r.Tipo,
		EntidadTipo:       r.EntidadTipo,
		EntidadID:         uuidStrFromPg(r.EntidadID),
		EntidadNombre:     entidadNombre,
		PagoID:            uuidStrFromPg(r.PagoID),
		NumeroCertificado: textFromPg(r.NumeroCertificado),
		Fecha:             dateFromPg(r.Fecha),
		BaseImponible:     floatFromNumeric(r.BaseImponible),
		Alicuota:          floatFromNumeric(r.Alicuota),
		Monto:             floatFromNumeric(r.Monto),
		Periodo:           textFromPg(r.Periodo),
		Estado:            r.Estado,
		Observaciones:     textFromPg(r.Observaciones),
		CreatedAt:         r.CreatedAt.Time.Format(time.RFC3339),
	}
}
