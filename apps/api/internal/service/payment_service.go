package service

import (
	"context"
	"errors"
	"fmt"
	"math"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
	"github.com/rs/zerolog/log"
)

var (
	ErrPagoNotFound       = errors.New("pago not found")
	ErrComprobanteNoDeuda = errors.New("comprobante has no pending debt")
	ErrMontoExceedsDebt   = errors.New("applied amount exceeds pending debt")
	ErrCreditLimitExceeded = errors.New("credit limit exceeded")
	ErrPagoAlreadyAnulado = errors.New("pago is already anulado")
)

type PaymentService struct {
	db              *pgxpool.Pool
	queries         *repository.Queries
	notificationSvc *NotificationService
}

func NewPaymentService(db *pgxpool.Pool, notificationSvc *NotificationService) *PaymentService {
	return &PaymentService{
		db:              db,
		queries:         repository.New(db),
		notificationSvc: notificationSvc,
	}
}

// --- Response DTOs ---

type PagoResponse struct {
	ID            string  `json:"id"`
	Numero        string  `json:"numero"`
	ClienteID     string  `json:"cliente_id"`
	SucursalID    string  `json:"sucursal_id"`
	Tipo          string  `json:"tipo"`
	Estado        string  `json:"estado"`
	Monto         float64 `json:"monto"`
	FechaPago     string  `json:"fecha_pago"`
	Referencia    string  `json:"referencia,omitempty"`
	Observaciones string  `json:"observaciones,omitempty"`
	ClienteNombre string  `json:"cliente_nombre,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

type PagoDetailResponse struct {
	ID            string                    `json:"id"`
	Numero        string                    `json:"numero"`
	ClienteID     string                    `json:"cliente_id"`
	SucursalID    string                    `json:"sucursal_id"`
	Tipo          string                    `json:"tipo"`
	Estado        string                    `json:"estado"`
	Monto         float64                   `json:"monto"`
	FechaPago     string                    `json:"fecha_pago"`
	Referencia    string                    `json:"referencia,omitempty"`
	MetodoPagoID  string                    `json:"metodo_pago_id,omitempty"`
	CajaID        string                    `json:"caja_id,omitempty"`
	Observaciones string                    `json:"observaciones,omitempty"`
	ClienteNombre string                    `json:"cliente_nombre"`
	Aplicaciones  []AplicacionPagoResponse  `json:"aplicaciones"`
	CreatedAt     string                    `json:"created_at"`
	UpdatedAt     string                    `json:"updated_at"`
}

type AplicacionPagoResponse struct {
	ID                string  `json:"id"`
	ComprobanteID     string  `json:"comprobante_id"`
	MontoAplicado     float64 `json:"monto_aplicado"`
	ComprobanteNumero string  `json:"comprobante_numero,omitempty"`
	ComprobanteTotal  float64 `json:"comprobante_total,omitempty"`
	CreatedAt         string  `json:"created_at"`
}

type AgingBucket struct {
	Rango      string  `json:"rango"`
	TotalDeuda float64 `json:"total_deuda"`
	Cantidad   int64   `json:"cantidad"`
}

type ClienteBalanceResponse struct {
	ClienteID     string  `json:"cliente_id"`
	SaldoDeudor   float64 `json:"saldo_deudor"`
	LimiteCredito float64 `json:"limite_credito"`
	CreditoDisponible float64 `json:"credito_disponible"`
}

type ComprobanteConDeudaResponse struct {
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

type CreatePagoInput struct {
	ClienteID     string            `json:"cliente_id" validate:"required,uuid"`
	SucursalID    string            `json:"sucursal_id" validate:"required,uuid"`
	Tipo          string            `json:"tipo" validate:"required"`
	Monto         float64           `json:"monto" validate:"required,gt=0"`
	FechaPago     string            `json:"fecha_pago" validate:"required"`
	Referencia    string            `json:"referencia"`
	MetodoPagoID  string            `json:"metodo_pago_id"`
	CajaID        string            `json:"caja_id"`
	Observaciones string            `json:"observaciones"`
	Aplicaciones  []AplicacionInput `json:"aplicaciones" validate:"required,min=1,dive"`
}

type AplicacionInput struct {
	ComprobanteID string  `json:"comprobante_id" validate:"required,uuid"`
	MontoAplicado float64 `json:"monto_aplicado" validate:"required,gt=0"`
}

type UpdateLimiteCreditoInput struct {
	LimiteCredito float64 `json:"limite_credito" validate:"gte=0"`
}

// --- Methods ---

func (s *PaymentService) CreatePago(ctx context.Context, userID pgtype.UUID, input CreatePagoInput) (*PagoDetailResponse, error) {
	clienteID, err := pgUUID(input.ClienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}
	fechaPago, err := pgDate(input.FechaPago)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_pago: %w", err)
	}

	// Validate sum of aplicaciones equals monto
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

	// Get next pago number
	numero, err := qtx.GetNextPagoNumero(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get next pago numero: %w", err)
	}

	// Parse optional fields
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

	// 1. Insert pago
	pago, err := qtx.CreatePago(ctx, repository.CreatePagoParams{
		Numero:        numero,
		ClienteID:     clienteID,
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
		return nil, fmt.Errorf("create pago: %w", err)
	}

	// 2. Process each aplicacion
	aplicacionesResp := make([]AplicacionPagoResponse, 0, len(input.Aplicaciones))
	for _, app := range input.Aplicaciones {
		compID, err := pgUUID(app.ComprobanteID)
		if err != nil {
			return nil, fmt.Errorf("invalid comprobante_id: %s", app.ComprobanteID)
		}

		// Get current comprobante debt info
		compDeudaList, err := qtx.ListComprobantesConDeuda(ctx, repository.ListComprobantesConDeudaParams{
			UsuarioID: userID,
			ClienteID: clienteID,
			Limit:     1000,
			Offset:    0,
		})
		if err != nil {
			return nil, fmt.Errorf("list comprobantes con deuda: %w", err)
		}

		// Find the specific comprobante
		var found bool
		var compTotal, compPagado float64
		for _, c := range compDeudaList {
			if uuidStrFromPg(c.ID) == app.ComprobanteID {
				found = true
				compTotal = floatFromNumeric(c.Total)
				compPagado = floatFromNumeric(c.MontoPagado)
				break
			}
		}
		if !found {
			return nil, ErrComprobanteNoDeuda
		}

		pendiente := compTotal - compPagado
		if app.MontoAplicado > pendiente+0.01 {
			return nil, ErrMontoExceedsDebt
		}

		// Insert aplicacion
		aplicacion, err := qtx.CreateAplicacionPago(ctx, repository.CreateAplicacionPagoParams{
			PagoID:        pago.ID,
			ComprobanteID: compID,
			MontoAplicado: numericFromFloat(app.MontoAplicado),
		})
		if err != nil {
			return nil, fmt.Errorf("create aplicacion pago: %w", err)
		}

		// Update comprobante debt
		newPagado := compPagado + app.MontoAplicado
		var estadoDeuda repository.EstadoDeuda
		if newPagado >= compTotal-0.01 {
			estadoDeuda = repository.EstadoDeudaPAGADA
		} else {
			estadoDeuda = repository.EstadoDeudaPARCIAL
		}

		err = qtx.UpdateComprobanteDeuda(ctx, repository.UpdateComprobanteDeudaParams{
			ID:          compID,
			MontoPagado: numericFromFloat(newPagado),
			EstadoDeuda: estadoDeuda,
		})
		if err != nil {
			return nil, fmt.Errorf("update comprobante deuda: %w", err)
		}

		aplicacionesResp = append(aplicacionesResp, AplicacionPagoResponse{
			ID:            uuidStrFromPg(aplicacion.ID),
			ComprobanteID: app.ComprobanteID,
			MontoAplicado: app.MontoAplicado,
			CreatedAt:     timestamptzStr(aplicacion.CreatedAt),
		})
	}

	// 3. Update client saldo_deudor
	saldoRow, err := qtx.GetSaldoCliente(ctx, repository.GetSaldoClienteParams{
		ClienteID: clienteID,
		UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("get saldo cliente: %w", err)
	}
	currentSaldo := floatFromNumeric(saldoRow.SaldoDeudor)
	newSaldo := currentSaldo - input.Monto
	err = qtx.UpdateClienteSaldo(ctx, repository.UpdateClienteSaldoParams{
		ID:          clienteID,
		SaldoDeudor: numericFromFloat(newSaldo),
	})
	if err != nil {
		return nil, fmt.Errorf("update cliente saldo: %w", err)
	}

	// 4. If caja_id provided, create movimiento_caja INGRESO
	if input.CajaID != "" {
		_, err = qtx.CreateMovimientoCaja(ctx, repository.CreateMovimientoCajaParams{
			CajaID:         cajaID,
			Tipo:           repository.TipoMovimientoINGRESO,
			Monto:          numericFromFloat(input.Monto),
			Concepto:       fmt.Sprintf("Cobro %s", numero),
			ReferenciaID:   pago.ID,
			ReferenciaTipo: pgText("PAGO"),
			UsuarioID:      userID,
		})
		if err != nil {
			return nil, fmt.Errorf("create movimiento caja: %w", err)
		}

		// Update caja saldo
		caja, err := qtx.GetCajaByID(ctx, repository.GetCajaByIDParams{
			ID: cajaID, UsuarioID: userID,
		})
		if err != nil {
			return nil, fmt.Errorf("get caja: %w", err)
		}
		newCajaSaldo := floatFromNumeric(caja.Saldo) + input.Monto
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

	// In-app notification for payment received
	if s.notificationSvc != nil {
		go func() {
			_, err := s.notificationSvc.Create(context.Background(), CreateNotificacionInput{
				DestinatarioID: userID,
				Tipo:           repository.TipoNotificacionINFO,
				Titulo:         fmt.Sprintf("Cobro %s registrado", numero),
				Mensaje:        fmt.Sprintf("Se registró un cobro por $%.2f", input.Monto),
				Enlace:         "/finanzas/cobros/" + uuidStrFromPg(pago.ID),
			})
			if err != nil {
				log.Error().Err(err).Str("pago", uuidStrFromPg(pago.ID)).Msg("failed to create payment notification")
			}
		}()
	}

	return &PagoDetailResponse{
		ID:            uuidStrFromPg(pago.ID),
		Numero:        pago.Numero,
		ClienteID:     input.ClienteID,
		SucursalID:    input.SucursalID,
		Tipo:          input.Tipo,
		Estado:        string(pago.Estado),
		Monto:         input.Monto,
		FechaPago:     input.FechaPago,
		Referencia:    input.Referencia,
		MetodoPagoID:  input.MetodoPagoID,
		CajaID:        input.CajaID,
		Observaciones: input.Observaciones,
		Aplicaciones:  aplicacionesResp,
		CreatedAt:     timestamptzStr(pago.CreatedAt),
		UpdatedAt:     timestamptzStr(pago.UpdatedAt),
	}, nil
}

func (s *PaymentService) ListPagos(ctx context.Context, userID pgtype.UUID, search string, limit, offset int32) ([]PagoResponse, int, error) {
	searchPattern := ""
	if search != "" {
		searchPattern = "%" + search + "%"
	}

	items, err := s.queries.ListPagos(ctx, repository.ListPagosParams{
		UsuarioID: userID,
		Search:    searchPattern,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list pagos: %w", err)
	}

	count, err := s.queries.CountPagos(ctx, repository.CountPagosParams{
		UsuarioID: userID,
		Search:    searchPattern,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count pagos: %w", err)
	}

	result := make([]PagoResponse, 0, len(items))
	for _, p := range items {
		result = append(result, toPagoResponse(p))
	}
	return result, int(count), nil
}

func (s *PaymentService) GetPago(ctx context.Context, userID pgtype.UUID, id string) (*PagoDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrPagoNotFound
	}

	p, err := s.queries.GetPagoByID(ctx, repository.GetPagoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrPagoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get pago: %w", err)
	}

	// Get aplicaciones
	apps, err := s.queries.ListAplicacionesByPago(ctx, repository.ListAplicacionesByPagoParams{
		PagoID: pgID,
	})
	if err != nil {
		return nil, fmt.Errorf("list aplicaciones: %w", err)
	}

	aplicaciones := make([]AplicacionPagoResponse, 0, len(apps))
	for _, a := range apps {
		aplicaciones = append(aplicaciones, AplicacionPagoResponse{
			ID:                uuidStrFromPg(a.ID),
			ComprobanteID:     uuidStrFromPg(a.ComprobanteID),
			MontoAplicado:     floatFromNumeric(a.MontoAplicado),
			ComprobanteNumero: a.ComprobanteNumero,
			ComprobanteTotal:  floatFromNumeric(a.ComprobanteTotal),
			CreatedAt:         timestamptzStr(a.CreatedAt),
		})
	}

	return &PagoDetailResponse{
		ID:            uuidStrFromPg(p.ID),
		Numero:        p.Numero,
		ClienteID:     uuidStrFromPg(p.ClienteID),
		SucursalID:    uuidStrFromPg(p.SucursalID),
		Tipo:          string(p.Tipo),
		Estado:        string(p.Estado),
		Monto:         floatFromNumeric(p.Monto),
		FechaPago:     dateFromPg(p.FechaPago),
		Referencia:    textFromPg(p.Referencia),
		MetodoPagoID:  uuidStrFromPg(p.MetodoPagoID),
		CajaID:        uuidStrFromPg(p.CajaID),
		Observaciones: textFromPg(p.Observaciones),
		ClienteNombre: p.ClienteNombre,
		Aplicaciones:  aplicaciones,
		CreatedAt:     timestamptzStr(p.CreatedAt),
		UpdatedAt:     timestamptzStr(p.UpdatedAt),
	}, nil
}

func (s *PaymentService) ListPagosByCliente(ctx context.Context, userID pgtype.UUID, clienteID string, limit, offset int32) ([]PagoResponse, int, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid cliente_id")
	}

	items, err := s.queries.ListPagosByCliente(ctx, repository.ListPagosByClienteParams{
		UsuarioID: userID,
		ClienteID: pgClienteID,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list pagos by cliente: %w", err)
	}

	count, err := s.queries.CountPagosByCliente(ctx, repository.CountPagosByClienteParams{
		UsuarioID: userID,
		ClienteID: pgClienteID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count pagos by cliente: %w", err)
	}

	result := make([]PagoResponse, 0, len(items))
	for _, p := range items {
		result = append(result, toPagoResponse(p))
	}
	return result, int(count), nil
}

func (s *PaymentService) AnularPago(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrPagoNotFound
	}

	// Get pago to verify it exists and get details
	p, err := s.queries.GetPagoByID(ctx, repository.GetPagoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrPagoNotFound
	}
	if err != nil {
		return fmt.Errorf("get pago: %w", err)
	}
	if p.Estado == repository.EstadoPagoANULADO {
		return ErrPagoAlreadyAnulado
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// 1. Get aplicaciones to reverse
	apps, err := qtx.ListAplicacionesByPago(ctx, repository.ListAplicacionesByPagoParams{
		PagoID: pgID,
	})
	if err != nil {
		return fmt.Errorf("list aplicaciones: %w", err)
	}

	// 2. Reverse each aplicacion - restore comprobante debt
	for _, app := range apps {
		// We need to get the comprobante current state to restore
		// Since we're reversing, subtract the monto_aplicado from monto_pagado
		// We re-read the comprobante within the transaction for accuracy
		compDeudaList, err := qtx.ListComprobantesConDeuda(ctx, repository.ListComprobantesConDeudaParams{
			UsuarioID: userID,
			ClienteID: p.ClienteID,
			Limit:     1000,
			Offset:    0,
		})
		if err != nil {
			// The comprobante might be fully paid and not in "con deuda" list.
			// Use a direct query approach: reduce monto_pagado by the applied amount.
		}

		_ = compDeudaList // We'll use direct update approach

		montoAplicado := floatFromNumeric(app.MontoAplicado)

		// Get current comprobante monto_pagado via a simple query
		var currentPagado pgtype.Numeric
		var compTotal pgtype.Numeric
		err = tx.QueryRow(ctx,
			"SELECT COALESCE(monto_pagado, 0), total FROM comprobantes WHERE id = $1",
			app.ComprobanteID,
		).Scan(&currentPagado, &compTotal)
		if err != nil {
			return fmt.Errorf("get comprobante info: %w", err)
		}

		newPagado := floatFromNumeric(currentPagado) - montoAplicado
		if newPagado < 0 {
			newPagado = 0
		}

		total := floatFromNumeric(compTotal)
		var estadoDeuda repository.EstadoDeuda
		if newPagado <= 0.01 {
			estadoDeuda = repository.EstadoDeudaPENDIENTE
		} else if newPagado >= total-0.01 {
			estadoDeuda = repository.EstadoDeudaPAGADA
		} else {
			estadoDeuda = repository.EstadoDeudaPARCIAL
		}

		err = qtx.UpdateComprobanteDeuda(ctx, repository.UpdateComprobanteDeudaParams{
			ID:          app.ComprobanteID,
			MontoPagado: numericFromFloat(newPagado),
			EstadoDeuda: estadoDeuda,
		})
		if err != nil {
			return fmt.Errorf("restore comprobante deuda: %w", err)
		}
	}

	// 3. Restore client saldo
	saldoRow, err := qtx.GetSaldoCliente(ctx, repository.GetSaldoClienteParams{
		ClienteID: p.ClienteID,
		UsuarioID: userID,
	})
	if err != nil {
		return fmt.Errorf("get saldo cliente: %w", err)
	}
	pagoMonto := floatFromNumeric(p.Monto)
	newSaldo := floatFromNumeric(saldoRow.SaldoDeudor) + pagoMonto
	err = qtx.UpdateClienteSaldo(ctx, repository.UpdateClienteSaldoParams{
		ID:          p.ClienteID,
		SaldoDeudor: numericFromFloat(newSaldo),
	})
	if err != nil {
		return fmt.Errorf("restore cliente saldo: %w", err)
	}

	// 4. Create negative movimiento if original had a caja
	if p.CajaID.Valid {
		_, err = qtx.CreateMovimientoCaja(ctx, repository.CreateMovimientoCajaParams{
			CajaID:         p.CajaID,
			Tipo:           repository.TipoMovimientoEGRESO,
			Monto:          numericFromFloat(pagoMonto),
			Concepto:       fmt.Sprintf("Anulación cobro %s", p.Numero),
			ReferenciaID:   pgID,
			ReferenciaTipo: pgText("PAGO_ANULADO"),
			UsuarioID:      userID,
		})
		if err != nil {
			return fmt.Errorf("create movimiento reverso: %w", err)
		}

		// Update caja saldo
		caja, err := qtx.GetCajaByID(ctx, repository.GetCajaByIDParams{
			ID: p.CajaID, UsuarioID: userID,
		})
		if err != nil {
			return fmt.Errorf("get caja: %w", err)
		}
		newCajaSaldo := floatFromNumeric(caja.Saldo) - pagoMonto
		err = qtx.UpdateCajaSaldo(ctx, repository.UpdateCajaSaldoParams{
			ID:    p.CajaID,
			Saldo: numericFromFloat(newCajaSaldo),
		})
		if err != nil {
			return fmt.Errorf("update caja saldo: %w", err)
		}
	}

	// 5. Mark pago as anulado
	err = qtx.AnularPago(ctx, repository.AnularPagoParams{
		ID: pgID, UsuarioID: userID,
	})
	if err != nil {
		return fmt.Errorf("anular pago: %w", err)
	}

	return tx.Commit(ctx)
}

func (s *PaymentService) GetAgingReport(ctx context.Context, userID pgtype.UUID) ([]AgingBucket, error) {
	rows, err := s.queries.AgingReport(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("aging report: %w", err)
	}

	result := make([]AgingBucket, 0, len(rows))
	for _, r := range rows {
		result = append(result, AgingBucket{
			Rango:      r.Rango,
			TotalDeuda: floatFromNumeric(r.TotalDeuda),
			Cantidad:   r.Cantidad,
		})
	}
	return result, nil
}

func (s *PaymentService) GetClienteBalance(ctx context.Context, userID pgtype.UUID, clienteID string) (*ClienteBalanceResponse, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return nil, fmt.Errorf("invalid cliente_id")
	}

	saldo, err := s.queries.GetSaldoCliente(ctx, repository.GetSaldoClienteParams{
		ClienteID: pgClienteID,
		UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("cliente not found")
	}
	if err != nil {
		return nil, fmt.Errorf("get saldo: %w", err)
	}

	saldoDeudor := floatFromNumeric(saldo.SaldoDeudor)
	limiteCredito := floatFromNumeric(saldo.LimiteCredito)

	return &ClienteBalanceResponse{
		ClienteID:         clienteID,
		SaldoDeudor:       saldoDeudor,
		LimiteCredito:     limiteCredito,
		CreditoDisponible: limiteCredito - saldoDeudor,
	}, nil
}

func (s *PaymentService) UpdateClienteLimiteCredito(ctx context.Context, userID pgtype.UUID, clienteID string, limite float64) error {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return fmt.Errorf("invalid cliente_id")
	}

	return s.queries.UpdateClienteLimiteCredito(ctx, repository.UpdateClienteLimiteCreditoParams{
		ID:            pgClienteID,
		LimiteCredito: numericFromFloat(limite),
		UsuarioID:     userID,
	})
}

func (s *PaymentService) ListComprobantesConDeuda(ctx context.Context, userID pgtype.UUID, clienteID string, limit, offset int32) ([]ComprobanteConDeudaResponse, int, error) {
	pgClienteID, err := pgUUID(clienteID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid cliente_id")
	}

	params := repository.ListComprobantesConDeudaParams{
		UsuarioID: userID,
		ClienteID: pgClienteID,
		Limit:     limit,
		Offset:    offset,
	}

	items, err := s.queries.ListComprobantesConDeuda(ctx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("list comprobantes con deuda: %w", err)
	}

	count, err := s.queries.CountComprobantesConDeuda(ctx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("count comprobantes con deuda: %w", err)
	}

	result := make([]ComprobanteConDeudaResponse, 0, len(items))
	for _, c := range items {
		total := floatFromNumeric(c.Total)
		pagado := floatFromNumeric(c.MontoPagado)
		estadoDeuda := ""
		if c.EstadoDeuda.Valid {
			estadoDeuda = string(c.EstadoDeuda.EstadoDeuda)
		} else {
			estadoDeuda = "PENDIENTE"
		}
		result = append(result, ComprobanteConDeudaResponse{
			ID:                   uuidStrFromPg(c.ID),
			Numero:               c.Numero,
			Total:                total,
			MontoPagado:          pagado,
			Pendiente:            total - pagado,
			EstadoDeuda:          estadoDeuda,
			FechaVencimientoPago: dateFromPg(c.FechaVencimientoPago),
			CreatedAt:            timestamptzStr(c.CreatedAt),
		})
	}
	return result, int(count), nil
}

// --- Helpers ---

func toPagoResponse(p repository.ListPagosRow) PagoResponse {
	return PagoResponse{
		ID:            uuidStrFromPg(p.ID),
		Numero:        p.Numero,
		ClienteID:     uuidStrFromPg(p.ClienteID),
		SucursalID:    uuidStrFromPg(p.SucursalID),
		Tipo:          string(p.Tipo),
		Estado:        string(p.Estado),
		Monto:         floatFromNumeric(p.Monto),
		FechaPago:     dateFromPg(p.FechaPago),
		Referencia:    textFromPg(p.Referencia),
		Observaciones: textFromPg(p.Observaciones),
		ClienteNombre: p.ClienteNombre,
		CreatedAt:     timestamptzStr(p.CreatedAt),
	}
}
