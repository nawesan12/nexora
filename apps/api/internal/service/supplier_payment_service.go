package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

var (
	ErrPagoProveedorNotFound  = errors.New("pago proveedor not found")
	ErrOrdenCompraNoDeuda     = errors.New("orden de compra has no pending debt")
	ErrMontoExceedsOCDebt     = errors.New("applied amount exceeds pending debt on orden de compra")
	ErrPagoProvAlreadyAnulado = errors.New("pago proveedor is already anulado")
)

type SupplierPaymentService struct {
	db                 *pgxpool.Pool
	queries            *repository.Queries
	retencionConfigSvc *RetencionConfigService
}

func NewSupplierPaymentService(db *pgxpool.Pool, retencionConfigSvc *RetencionConfigService) *SupplierPaymentService {
	return &SupplierPaymentService{
		db:                 db,
		queries:            repository.New(db),
		retencionConfigSvc: retencionConfigSvc,
	}
}

// --- Response DTOs ---

type PagoProveedorResponse struct {
	ID              string  `json:"id"`
	Numero          string  `json:"numero"`
	ProveedorID     string  `json:"proveedor_id"`
	SucursalID      string  `json:"sucursal_id"`
	Tipo            string  `json:"tipo"`
	Estado          string  `json:"estado"`
	Monto           float64 `json:"monto"`
	FechaPago       string  `json:"fecha_pago"`
	Referencia      string  `json:"referencia,omitempty"`
	Observaciones   string  `json:"observaciones,omitempty"`
	ProveedorNombre string  `json:"proveedor_nombre,omitempty"`
	CreatedAt       string  `json:"created_at"`
}

type PagoProveedorDetailResponse struct {
	ID              string                             `json:"id"`
	Numero          string                             `json:"numero"`
	ProveedorID     string                             `json:"proveedor_id"`
	SucursalID      string                             `json:"sucursal_id"`
	Tipo            string                             `json:"tipo"`
	Estado          string                             `json:"estado"`
	Monto           float64                            `json:"monto"`
	MontoNeto       float64                            `json:"monto_neto"`
	FechaPago       string                             `json:"fecha_pago"`
	Referencia      string                             `json:"referencia,omitempty"`
	MetodoPagoID    string                             `json:"metodo_pago_id,omitempty"`
	CajaID          string                             `json:"caja_id,omitempty"`
	Observaciones   string                             `json:"observaciones,omitempty"`
	ProveedorNombre string                             `json:"proveedor_nombre"`
	Aplicaciones    []AplicacionPagoProveedorResponse  `json:"aplicaciones"`
	Retenciones     []AutoRetencionResponse            `json:"retenciones"`
	CreatedAt       string                             `json:"created_at"`
	UpdatedAt       string                             `json:"updated_at"`
}

type AutoRetencionResponse struct {
	ID                string  `json:"id"`
	Tipo              string  `json:"tipo"`
	Nombre            string  `json:"nombre"`
	BaseImponible     float64 `json:"base_imponible"`
	Alicuota          float64 `json:"alicuota"`
	Monto             float64 `json:"monto"`
	NumeroCertificado string  `json:"numero_certificado"`
	AutoGenerada      bool    `json:"auto_generada"`
}

type AplicacionPagoProveedorResponse struct {
	ID               string  `json:"id"`
	OrdenCompraID    string  `json:"orden_compra_id"`
	MontoAplicado    float64 `json:"monto_aplicado"`
	OrdenCompraNum   string  `json:"orden_compra_numero,omitempty"`
	OrdenCompraTotal float64 `json:"orden_compra_total,omitempty"`
	CreatedAt        string  `json:"created_at"`
}

type OrdenCompraConDeudaResponse struct {
	ID                   string  `json:"id"`
	Numero               string  `json:"numero"`
	Total                float64 `json:"total"`
	MontoPagado          float64 `json:"monto_pagado"`
	Pendiente            float64 `json:"pendiente"`
	EstadoDeuda          string  `json:"estado_deuda"`
	FechaVencimientoPago string  `json:"fecha_vencimiento_pago,omitempty"`
	CreatedAt            string  `json:"created_at"`
}

// --- Input DTOs ---

type CreatePagoProveedorInput struct {
	ProveedorID   string                     `json:"proveedor_id" validate:"required,uuid"`
	SucursalID    string                     `json:"sucursal_id" validate:"required,uuid"`
	Tipo          string                     `json:"tipo" validate:"required"`
	Monto         float64                    `json:"monto" validate:"required,gt=0"`
	FechaPago     string                     `json:"fecha_pago" validate:"required"`
	Referencia    string                     `json:"referencia"`
	MetodoPagoID  string                     `json:"metodo_pago_id"`
	CajaID        string                     `json:"caja_id"`
	Observaciones string                     `json:"observaciones"`
	Aplicaciones  []AplicacionProveedorInput `json:"aplicaciones" validate:"required,min=1,dive"`
}

type AplicacionProveedorInput struct {
	OrdenCompraID string  `json:"orden_compra_id" validate:"required,uuid"`
	MontoAplicado float64 `json:"monto_aplicado" validate:"required,gt=0"`
}

// --- Methods ---

func (s *SupplierPaymentService) CreatePago(ctx context.Context, userID pgtype.UUID, input CreatePagoProveedorInput) (*PagoProveedorDetailResponse, error) {
	proveedorID, err := pgUUID(input.ProveedorID)
	if err != nil {
		return nil, fmt.Errorf("invalid proveedor_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	fechaPago, err := pgDate(input.FechaPago)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_pago: %w", err)
	}

	// Validate sum
	var totalAplicado float64
	for _, a := range input.Aplicaciones {
		totalAplicado += a.MontoAplicado
	}
	if math.Abs(totalAplicado-input.Monto) > 0.01 {
		return nil, fmt.Errorf("sum of aplicaciones (%.2f) does not match monto (%.2f)", totalAplicado, input.Monto)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	numero, err := qtx.GetNextPagoProveedorNumero(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get next pago proveedor numero: %w", err)
	}

	var metodoPagoID pgtype.UUID
	if input.MetodoPagoID != "" {
		metodoPagoID, err = pgUUID(input.MetodoPagoID)
		if err != nil {
			return nil, fmt.Errorf("invalid metodo_pago_id")
		}
	}
	var cajaID pgtype.UUID
	if input.CajaID != "" {
		cajaID, err = pgUUID(input.CajaID)
		if err != nil {
			return nil, fmt.Errorf("invalid caja_id")
		}
	}

	// 1. Insert pago proveedor
	pago, err := qtx.CreatePagoProveedor(ctx, repository.CreatePagoProveedorParams{
		Numero:        numero,
		ProveedorID:   proveedorID,
		SucursalID:    sucursalID,
		Tipo:          repository.TipoPago(input.Tipo),
		Monto:         numericFromFloat(input.Monto),
		FechaPago:     fechaPago,
		Referencia:    pgText(input.Referencia),
		MetodoPagoID:  metodoPagoID,
		CajaID:        cajaID,
		Observaciones: pgText(input.Observaciones),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create pago proveedor: %w", err)
	}

	// 2. Process aplicaciones
	aplicacionesResp := make([]AplicacionPagoProveedorResponse, 0, len(input.Aplicaciones))
	for _, app := range input.Aplicaciones {
		ocID, err := pgUUID(app.OrdenCompraID)
		if err != nil {
			return nil, fmt.Errorf("invalid orden_compra_id: %s", app.OrdenCompraID)
		}

		// Get OC debt info
		ocList, err := qtx.ListOrdenesCompraConDeuda(ctx, repository.ListOrdenesCompraConDeudaParams{
			UsuarioID:   userID,
			ProveedorID: proveedorID,
			Limit:       1000,
			Offset:      0,
		})
		if err != nil {
			return nil, fmt.Errorf("list oc con deuda: %w", err)
		}

		var found bool
		var ocTotal, ocPagado float64
		for _, oc := range ocList {
			if uuidStrFromPg(oc.ID) == app.OrdenCompraID {
				found = true
				ocTotal = floatFromNumeric(oc.Total)
				ocPagado = floatFromNumeric(oc.MontoPagado)
				break
			}
		}
		if !found {
			return nil, ErrOrdenCompraNoDeuda
		}

		pendiente := ocTotal - ocPagado
		if app.MontoAplicado > pendiente+0.01 {
			return nil, ErrMontoExceedsOCDebt
		}

		aplicacion, err := qtx.CreateAplicacionPagoProveedor(ctx, repository.CreateAplicacionPagoProveedorParams{
			PagoID:        pago.ID,
			OrdenCompraID: ocID,
			MontoAplicado: numericFromFloat(app.MontoAplicado),
		})
		if err != nil {
			return nil, fmt.Errorf("create aplicacion pago proveedor: %w", err)
		}

		// Update OC debt
		newPagado := ocPagado + app.MontoAplicado
		var estadoDeuda repository.EstadoDeuda
		if newPagado >= ocTotal-0.01 {
			estadoDeuda = repository.EstadoDeudaPAGADA
		} else {
			estadoDeuda = repository.EstadoDeudaPARCIAL
		}

		err = qtx.UpdateOrdenCompraDeuda(ctx, repository.UpdateOrdenCompraDeudaParams{
			ID:          ocID,
			MontoPagado: numericFromFloat(newPagado),
			EstadoDeuda: estadoDeuda,
		})
		if err != nil {
			return nil, fmt.Errorf("update oc deuda: %w", err)
		}

		aplicacionesResp = append(aplicacionesResp, AplicacionPagoProveedorResponse{
			ID:            uuidStrFromPg(aplicacion.ID),
			OrdenCompraID: app.OrdenCompraID,
			MontoAplicado: app.MontoAplicado,
			CreatedAt:     timestamptzStr(aplicacion.CreatedAt),
		})
	}

	// 3. Auto-calculate retentions
	var retencionesResp []AutoRetencionResponse
	var totalRetenciones float64

	activeConfigs, err := s.retencionConfigSvc.ListActiveConfigs(ctx, tx, userID)
	if err != nil {
		return nil, fmt.Errorf("list active retencion configs: %w", err)
	}

	for _, cfg := range activeConfigs {
		if input.Monto < cfg.MontoMinimo {
			continue
		}
		retencionMonto := math.Round(input.Monto*cfg.Alicuota) / 100
		if retencionMonto <= 0 {
			continue
		}
		totalRetenciones += retencionMonto

		// Get next certificate number from sequence
		var certNum int64
		err = tx.QueryRow(ctx, "SELECT nextval('retencion_cert_seq')").Scan(&certNum)
		if err != nil {
			return nil, fmt.Errorf("get next retencion cert num: %w", err)
		}
		numeroCert := fmt.Sprintf("RET-%06d", certNum)

		// Determine current period
		now := time.Now()
		periodo := fmt.Sprintf("%d-%02d", now.Year(), now.Month())

		var retID string
		err = tx.QueryRow(ctx,
			`INSERT INTO retenciones (tipo, entidad_tipo, entidad_id, pago_id, pago_proveedor_id,
			  numero_certificado, fecha, base_imponible, alicuota, monto, periodo, estado,
			  observaciones, auto_generada, usuario_id)
			 VALUES ($1, 'PROVEEDOR', $2, NULL, $3,
			  $4, CURRENT_DATE, $5, $6, $7, $8, 'EMITIDA',
			  $9, true, $10)
			 RETURNING id`,
			cfg.Tipo, proveedorID, pago.ID,
			numeroCert, numericFromFloat(input.Monto), numericFromFloat(cfg.Alicuota),
			numericFromFloat(retencionMonto), periodo,
			fmt.Sprintf("Auto-generada desde pago proveedor %s (%s)", pago.Numero, cfg.Nombre),
			userID,
		).Scan(&retID)
		if err != nil {
			return nil, fmt.Errorf("create auto retencion: %w", err)
		}

		retencionesResp = append(retencionesResp, AutoRetencionResponse{
			ID:                retID,
			Tipo:              cfg.Tipo,
			Nombre:            cfg.Nombre,
			BaseImponible:     input.Monto,
			Alicuota:          cfg.Alicuota,
			Monto:             retencionMonto,
			NumeroCertificado: numeroCert,
			AutoGenerada:      true,
		})
	}

	montoNeto := input.Monto - totalRetenciones

	// 4. Update proveedor saldo_deudor
	currentSaldo, err := qtx.GetSaldoProveedor(ctx, repository.GetSaldoProveedorParams{
		ProveedorID: proveedorID,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("get saldo proveedor: %w", err)
	}
	newSaldo := floatFromNumeric(currentSaldo) - input.Monto
	err = qtx.UpdateProveedorSaldo(ctx, repository.UpdateProveedorSaldoParams{
		ID:          proveedorID,
		SaldoDeudor: numericFromFloat(newSaldo),
	})
	if err != nil {
		return nil, fmt.Errorf("update proveedor saldo: %w", err)
	}

	// 5. If caja_id provided, create movimiento_caja EGRESO
	if input.CajaID != "" {
		_, err = qtx.CreateMovimientoCaja(ctx, repository.CreateMovimientoCajaParams{
			CajaID:         cajaID,
			Tipo:           repository.TipoMovimientoEGRESO,
			Monto:          numericFromFloat(input.Monto),
			Concepto:       fmt.Sprintf("Pago proveedor %s", numero),
			ReferenciaID:   pago.ID,
			ReferenciaTipo: pgText("PAGO_PROVEEDOR"),
			UsuarioID:      userID,
		})
		if err != nil {
			return nil, fmt.Errorf("create movimiento caja: %w", err)
		}

		caja, err := qtx.GetCajaByID(ctx, repository.GetCajaByIDParams{
			ID: cajaID, UsuarioID: userID,
		})
		if err != nil {
			return nil, fmt.Errorf("get caja: %w", err)
		}
		newCajaSaldo := floatFromNumeric(caja.Saldo) - input.Monto
		err = qtx.UpdateCajaSaldo(ctx, repository.UpdateCajaSaldoParams{
			ID:    cajaID,
			Saldo: numericFromFloat(newCajaSaldo),
		})
		if err != nil {
			return nil, fmt.Errorf("update caja saldo: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	if retencionesResp == nil {
		retencionesResp = []AutoRetencionResponse{}
	}

	return &PagoProveedorDetailResponse{
		ID:            uuidStrFromPg(pago.ID),
		Numero:        pago.Numero,
		ProveedorID:   input.ProveedorID,
		SucursalID:    input.SucursalID,
		Tipo:          input.Tipo,
		Estado:        string(pago.Estado),
		Monto:         input.Monto,
		MontoNeto:     montoNeto,
		FechaPago:     input.FechaPago,
		Referencia:    input.Referencia,
		MetodoPagoID:  input.MetodoPagoID,
		CajaID:        input.CajaID,
		Observaciones: input.Observaciones,
		Aplicaciones:  aplicacionesResp,
		Retenciones:   retencionesResp,
		CreatedAt:     timestamptzStr(pago.CreatedAt),
		UpdatedAt:     timestamptzStr(pago.UpdatedAt),
	}, nil
}

func (s *SupplierPaymentService) ListPagos(ctx context.Context, userID pgtype.UUID, search string, limit, offset int32) ([]PagoProveedorResponse, int, error) {
	searchPattern := ""
	if search != "" {
		searchPattern = "%" + search + "%"
	}

	items, err := s.queries.ListPagosProveedor(ctx, repository.ListPagosProveedorParams{
		UsuarioID: userID,
		Search:    searchPattern,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list pagos proveedor: %w", err)
	}

	count, err := s.queries.CountPagosProveedor(ctx, repository.CountPagosProveedorParams{
		UsuarioID: userID,
		Search:    searchPattern,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count pagos proveedor: %w", err)
	}

	result := make([]PagoProveedorResponse, 0, len(items))
	for _, p := range items {
		result = append(result, toPagoProveedorResponse(p))
	}
	return result, int(count), nil
}

func (s *SupplierPaymentService) GetPago(ctx context.Context, userID pgtype.UUID, id string) (*PagoProveedorDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPagoProveedorNotFound
	}

	p, err := s.queries.GetPagoProveedorByID(ctx, repository.GetPagoProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPagoProveedorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get pago proveedor: %w", err)
	}

	apps, err := s.queries.ListAplicacionesByPagoProveedor(ctx, repository.ListAplicacionesByPagoProveedorParams{
		PagoID: pgID,
	})
	if err != nil {
		return nil, fmt.Errorf("list aplicaciones: %w", err)
	}

	aplicaciones := make([]AplicacionPagoProveedorResponse, 0, len(apps))
	for _, a := range apps {
		aplicaciones = append(aplicaciones, AplicacionPagoProveedorResponse{
			ID:               uuidStrFromPg(a.ID),
			OrdenCompraID:    uuidStrFromPg(a.OrdenCompraID),
			MontoAplicado:    floatFromNumeric(a.MontoAplicado),
			OrdenCompraNum:   a.OrdenCompraNum,
			OrdenCompraTotal: floatFromNumeric(a.OrdenCompraTotal),
			CreatedAt:        timestamptzStr(a.CreatedAt),
		})
	}

	// Fetch auto-generated retentions for this payment
	retRows, err := s.db.Query(ctx,
		`SELECT id, tipo, numero_certificado, base_imponible, alicuota, monto, auto_generada
		 FROM retenciones
		 WHERE pago_proveedor_id = $1 AND active = true
		 ORDER BY created_at`, pgID)
	if err != nil {
		return nil, fmt.Errorf("list retenciones for pago: %w", err)
	}
	defer retRows.Close()

	var retenciones []AutoRetencionResponse
	var totalRetenciones float64
	for retRows.Next() {
		var ret AutoRetencionResponse
		if err := retRows.Scan(&ret.ID, &ret.Tipo, &ret.NumeroCertificado,
			&ret.BaseImponible, &ret.Alicuota, &ret.Monto, &ret.AutoGenerada); err != nil {
			return nil, fmt.Errorf("scan retencion: %w", err)
		}
		totalRetenciones += ret.Monto
		retenciones = append(retenciones, ret)
	}
	if retenciones == nil {
		retenciones = []AutoRetencionResponse{}
	}

	monto := floatFromNumeric(p.Monto)

	return &PagoProveedorDetailResponse{
		ID:              uuidStrFromPg(p.ID),
		Numero:          p.Numero,
		ProveedorID:     uuidStrFromPg(p.ProveedorID),
		SucursalID:      uuidStrFromPg(p.SucursalID),
		Tipo:            string(p.Tipo),
		Estado:          string(p.Estado),
		Monto:           monto,
		MontoNeto:       monto - totalRetenciones,
		FechaPago:       dateFromPg(p.FechaPago),
		Referencia:      textFromPg(p.Referencia),
		MetodoPagoID:    uuidStrFromPg(p.MetodoPagoID),
		CajaID:          uuidStrFromPg(p.CajaID),
		Observaciones:   textFromPg(p.Observaciones),
		ProveedorNombre: p.ProveedorNombre,
		Aplicaciones:    aplicaciones,
		Retenciones:     retenciones,
		CreatedAt:       timestamptzStr(p.CreatedAt),
		UpdatedAt:       timestamptzStr(p.UpdatedAt),
	}, nil
}

func (s *SupplierPaymentService) AnularPago(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrPagoProveedorNotFound
	}

	p, err := s.queries.GetPagoProveedorByID(ctx, repository.GetPagoProveedorByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrPagoProveedorNotFound
	}
	if err != nil {
		return fmt.Errorf("get pago proveedor: %w", err)
	}
	if p.Estado == repository.EstadoPagoANULADO {
		return ErrPagoProvAlreadyAnulado
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// 1. Get aplicaciones
	apps, err := qtx.ListAplicacionesByPagoProveedor(ctx, repository.ListAplicacionesByPagoProveedorParams{
		PagoID: pgID,
	})
	if err != nil {
		return fmt.Errorf("list aplicaciones: %w", err)
	}

	// 2. Reverse OC debts
	for _, app := range apps {
		montoAplicado := floatFromNumeric(app.MontoAplicado)

		var currentPagado pgtype.Numeric
		var ocTotal pgtype.Numeric
		err = tx.QueryRow(ctx,
			"SELECT COALESCE(monto_pagado, 0), total FROM ordenes_compra WHERE id = $1",
			app.OrdenCompraID,
		).Scan(&currentPagado, &ocTotal)
		if err != nil {
			return fmt.Errorf("get oc info: %w", err)
		}

		newPagado := floatFromNumeric(currentPagado) - montoAplicado
		if newPagado < 0 {
			newPagado = 0
		}

		total := floatFromNumeric(ocTotal)
		var estadoDeuda repository.EstadoDeuda
		if newPagado <= 0.01 {
			estadoDeuda = repository.EstadoDeudaPENDIENTE
		} else if newPagado >= total-0.01 {
			estadoDeuda = repository.EstadoDeudaPAGADA
		} else {
			estadoDeuda = repository.EstadoDeudaPARCIAL
		}

		err = qtx.UpdateOrdenCompraDeuda(ctx, repository.UpdateOrdenCompraDeudaParams{
			ID:          app.OrdenCompraID,
			MontoPagado: numericFromFloat(newPagado),
			EstadoDeuda: estadoDeuda,
		})
		if err != nil {
			return fmt.Errorf("restore oc deuda: %w", err)
		}
	}

	// 3. Restore proveedor saldo
	currentSaldo, err := qtx.GetSaldoProveedor(ctx, repository.GetSaldoProveedorParams{
		ProveedorID: p.ProveedorID,
		UsuarioID:   userID,
	})
	if err != nil {
		return fmt.Errorf("get saldo proveedor: %w", err)
	}
	pagoMonto := floatFromNumeric(p.Monto)
	newSaldo := floatFromNumeric(currentSaldo) + pagoMonto
	err = qtx.UpdateProveedorSaldo(ctx, repository.UpdateProveedorSaldoParams{
		ID:          p.ProveedorID,
		SaldoDeudor: numericFromFloat(newSaldo),
	})
	if err != nil {
		return fmt.Errorf("restore proveedor saldo: %w", err)
	}

	// 4. Create reverse movimiento if caja was used
	if p.CajaID.Valid {
		_, err = qtx.CreateMovimientoCaja(ctx, repository.CreateMovimientoCajaParams{
			CajaID:         p.CajaID,
			Tipo:           repository.TipoMovimientoINGRESO,
			Monto:          numericFromFloat(pagoMonto),
			Concepto:       fmt.Sprintf("Anulación pago proveedor %s", p.Numero),
			ReferenciaID:   pgID,
			ReferenciaTipo: pgText("PAGO_PROVEEDOR_ANULADO"),
			UsuarioID:      userID,
		})
		if err != nil {
			return fmt.Errorf("create movimiento reverso: %w", err)
		}

		caja, err := qtx.GetCajaByID(ctx, repository.GetCajaByIDParams{
			ID: p.CajaID, UsuarioID: userID,
		})
		if err != nil {
			return fmt.Errorf("get caja: %w", err)
		}
		newCajaSaldo := floatFromNumeric(caja.Saldo) + pagoMonto
		err = qtx.UpdateCajaSaldo(ctx, repository.UpdateCajaSaldoParams{
			ID:    p.CajaID,
			Saldo: numericFromFloat(newCajaSaldo),
		})
		if err != nil {
			return fmt.Errorf("update caja saldo: %w", err)
		}
	}

	// 5. Mark as anulado
	err = qtx.AnularPagoProveedor(ctx, repository.AnularPagoProveedorParams{
		ID: pgID, UsuarioID: userID,
	})
	if err != nil {
		return fmt.Errorf("anular pago proveedor: %w", err)
	}

	return tx.Commit(ctx)
}

func (s *SupplierPaymentService) ListOrdenesCompraConDeuda(ctx context.Context, userID pgtype.UUID, proveedorID string, limit, offset int32) ([]OrdenCompraConDeudaResponse, int, error) {
	pgProveedorID, err := pgUUID(proveedorID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid proveedor_id")
	}

	params := repository.ListOrdenesCompraConDeudaParams{
		UsuarioID:   userID,
		ProveedorID: pgProveedorID,
		Limit:       limit,
		Offset:      offset,
	}

	items, err := s.queries.ListOrdenesCompraConDeuda(ctx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("list oc con deuda: %w", err)
	}

	count, err := s.queries.CountOrdenesCompraConDeuda(ctx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("count oc con deuda: %w", err)
	}

	result := make([]OrdenCompraConDeudaResponse, 0, len(items))
	for _, oc := range items {
		total := floatFromNumeric(oc.Total)
		pagado := floatFromNumeric(oc.MontoPagado)
		estadoDeuda := ""
		if oc.EstadoDeuda.Valid {
			estadoDeuda = string(oc.EstadoDeuda.EstadoDeuda)
		} else {
			estadoDeuda = "PENDIENTE"
		}
		result = append(result, OrdenCompraConDeudaResponse{
			ID:                   uuidStrFromPg(oc.ID),
			Numero:               oc.Numero,
			Total:                total,
			MontoPagado:          pagado,
			Pendiente:            total - pagado,
			EstadoDeuda:          estadoDeuda,
			FechaVencimientoPago: dateFromPg(oc.FechaVencimientoPago),
			CreatedAt:            timestamptzStr(oc.CreatedAt),
		})
	}
	return result, int(count), nil
}

// --- Helpers ---

func toPagoProveedorResponse(p repository.ListPagosProveedorRow) PagoProveedorResponse {
	return PagoProveedorResponse{
		ID:              uuidStrFromPg(p.ID),
		Numero:          p.Numero,
		ProveedorID:     uuidStrFromPg(p.ProveedorID),
		SucursalID:      uuidStrFromPg(p.SucursalID),
		Tipo:            string(p.Tipo),
		Estado:          string(p.Estado),
		Monto:           floatFromNumeric(p.Monto),
		FechaPago:       dateFromPg(p.FechaPago),
		Referencia:      textFromPg(p.Referencia),
		Observaciones:   textFromPg(p.Observaciones),
		ProveedorNombre: p.ProveedorNombre,
		CreatedAt:       timestamptzStr(p.CreatedAt),
	}
}
