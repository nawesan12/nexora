package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InteresMoraService struct {
	db *pgxpool.Pool
}

func NewInteresMoraService(db *pgxpool.Pool) *InteresMoraService {
	return &InteresMoraService{db: db}
}

// --- DTOs ---

type InteresConfigResponse struct {
	ID          string  `json:"id"`
	TasaMensual float64 `json:"tasa_mensual"`
	Calculo     string  `json:"calculo"`
	DiasGracia  int     `json:"dias_gracia"`
	CreatedAt   string  `json:"created_at"`
}

type UpsertInteresConfigInput struct {
	TasaMensual float64 `json:"tasa_mensual" validate:"required,gt=0"`
	Calculo     string  `json:"calculo" validate:"required,oneof=DIARIO MENSUAL"`
	DiasGracia  int     `json:"dias_gracia" validate:"gte=0"`
}

type InteresMoraResponse struct {
	ID            string  `json:"id"`
	PagoID        string  `json:"pago_id"`
	ClienteID     string  `json:"cliente_id"`
	ClienteNombre string  `json:"cliente_nombre,omitempty"`
	DiasMora      int     `json:"dias_mora"`
	Capital       float64 `json:"capital"`
	TasaAplicada  float64 `json:"tasa_aplicada"`
	MontoInteres  float64 `json:"monto_interes"`
	NotaDebitoID  string  `json:"nota_debito_id,omitempty"`
	Estado        string  `json:"estado"`
	CreatedAt     string  `json:"created_at"`
}

// --- Config ---

func (s *InteresMoraService) GetConfig(ctx context.Context, userID pgtype.UUID) (*InteresConfigResponse, error) {
	var resp InteresConfigResponse
	var createdAt time.Time
	err := s.db.QueryRow(ctx,
		`SELECT id, tasa_mensual, calculo, dias_gracia, created_at
		 FROM configuracion_intereses WHERE usuario_id = $1`, userID).
		Scan(&resp.ID, &resp.TasaMensual, &resp.Calculo, &resp.DiasGracia, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("get interes config: %w", err)
	}
	resp.CreatedAt = createdAt.Format(time.RFC3339)
	return &resp, nil
}

func (s *InteresMoraService) UpsertConfig(ctx context.Context, userID pgtype.UUID, input UpsertInteresConfigInput) (*InteresConfigResponse, error) {
	var resp InteresConfigResponse
	var createdAt time.Time
	err := s.db.QueryRow(ctx,
		`INSERT INTO configuracion_intereses (tasa_mensual, calculo, dias_gracia, usuario_id)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (usuario_id) DO UPDATE SET tasa_mensual = $1, calculo = $2, dias_gracia = $3, updated_at = NOW()
		 RETURNING id, tasa_mensual, calculo, dias_gracia, created_at`,
		input.TasaMensual, input.Calculo, input.DiasGracia, userID).
		Scan(&resp.ID, &resp.TasaMensual, &resp.Calculo, &resp.DiasGracia, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("upsert interes config: %w", err)
	}
	resp.CreatedAt = createdAt.Format(time.RFC3339)
	return &resp, nil
}

// --- Calculate overdue interest ---

func (s *InteresMoraService) CalculateOverdue(ctx context.Context, userID pgtype.UUID) ([]InteresMoraResponse, error) {
	// Get default interest rate
	var tasaMensual float64
	var diasGracia int
	err := s.db.QueryRow(ctx,
		`SELECT tasa_mensual, dias_gracia FROM configuracion_intereses WHERE usuario_id = $1`, userID).
		Scan(&tasaMensual, &diasGracia)
	if err != nil {
		tasaMensual = 3.0
		diasGracia = 0
	}

	// Find overdue pagos that don't have interest calculated yet
	rows, err := s.db.Query(ctx,
		`SELECT p.id, p.cliente_id, cl.nombre, cl.tasa_interes_override,
		        p.monto, p.fecha_vencimiento, p.created_at
		 FROM pagos p
		 JOIN clientes cl ON cl.id = p.cliente_id
		 WHERE p.usuario_id = $1 AND p.estado = 'PENDIENTE' AND p.active = true
		   AND p.fecha_vencimiento < CURRENT_DATE - $2
		   AND NOT EXISTS (
		     SELECT 1 FROM intereses_mora im
		     WHERE im.pago_id = p.id AND im.estado = 'CALCULADO'
		   )`, userID, diasGracia)
	if err != nil {
		return nil, fmt.Errorf("query overdue: %w", err)
	}
	defer rows.Close()

	var results []InteresMoraResponse
	now := time.Now()

	for rows.Next() {
		var pagoID, clienteID pgtype.UUID
		var clienteNombre string
		var tasaOverride *float64
		var monto float64
		var fechaVencimiento pgtype.Date
		var createdAt time.Time

		if err := rows.Scan(&pagoID, &clienteID, &clienteNombre, &tasaOverride,
			&monto, &fechaVencimiento, &createdAt); err != nil {
			return nil, fmt.Errorf("scan overdue: %w", err)
		}

		tasa := tasaMensual
		if tasaOverride != nil {
			tasa = *tasaOverride
		}

		diasMora := int(now.Sub(fechaVencimiento.Time).Hours() / 24)
		if diasMora <= 0 {
			continue
		}

		// Daily rate = monthly rate / 30
		tasaDiaria := tasa / 30.0 / 100.0
		interes := math.Round(monto*tasaDiaria*float64(diasMora)*100) / 100

		// Insert record
		var interesID string
		var interesCreatedAt time.Time
		err := s.db.QueryRow(ctx,
			`INSERT INTO intereses_mora (pago_id, cliente_id, dias_mora, capital, tasa_aplicada, monto_interes, estado, usuario_id)
			 VALUES ($1, $2, $3, $4, $5, $6, 'CALCULADO', $7)
			 RETURNING id, created_at`,
			pagoID, clienteID, diasMora, monto, tasa, interes, userID).
			Scan(&interesID, &interesCreatedAt)
		if err != nil {
			return nil, fmt.Errorf("insert interes: %w", err)
		}

		results = append(results, InteresMoraResponse{
			ID:            interesID,
			PagoID:        uuidStrFromPg(pagoID),
			ClienteID:     uuidStrFromPg(clienteID),
			ClienteNombre: clienteNombre,
			DiasMora:      diasMora,
			Capital:       monto,
			TasaAplicada:  tasa,
			MontoInteres:  interes,
			Estado:        "CALCULADO",
			CreatedAt:     interesCreatedAt.Format(time.RFC3339),
		})
	}

	return results, nil
}

// --- List ---

func (s *InteresMoraService) List(ctx context.Context, userID pgtype.UUID, estado string, limit, offset int32) ([]InteresMoraResponse, int, error) {
	var countQuery, listQuery string
	var args []interface{}

	if estado != "" {
		countQuery = `SELECT COUNT(*) FROM intereses_mora WHERE usuario_id = $1 AND estado = $2`
		listQuery = `SELECT im.id, im.pago_id, im.cliente_id, cl.nombre, im.dias_mora, im.capital, im.tasa_aplicada, im.monto_interes, im.nota_debito_id, im.estado, im.created_at
		             FROM intereses_mora im JOIN clientes cl ON cl.id = im.cliente_id
		             WHERE im.usuario_id = $1 AND im.estado = $2 ORDER BY im.created_at DESC LIMIT $3 OFFSET $4`
		args = []interface{}{userID, estado, limit, offset}
	} else {
		countQuery = `SELECT COUNT(*) FROM intereses_mora WHERE usuario_id = $1`
		listQuery = `SELECT im.id, im.pago_id, im.cliente_id, cl.nombre, im.dias_mora, im.capital, im.tasa_aplicada, im.monto_interes, im.nota_debito_id, im.estado, im.created_at
		             FROM intereses_mora im JOIN clientes cl ON cl.id = im.cliente_id
		             WHERE im.usuario_id = $1 ORDER BY im.created_at DESC LIMIT $2 OFFSET $3`
		args = []interface{}{userID, limit, offset}
	}

	var count int
	if estado != "" {
		s.db.QueryRow(ctx, countQuery, userID, estado).Scan(&count)
	} else {
		s.db.QueryRow(ctx, countQuery, userID).Scan(&count)
	}

	rows, err := s.db.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list intereses: %w", err)
	}
	defer rows.Close()

	var results []InteresMoraResponse
	for rows.Next() {
		var r InteresMoraResponse
		var pagoID, clienteID pgtype.UUID
		var notaDebitoID pgtype.UUID
		var createdAt time.Time
		if err := rows.Scan(&r.ID, &pagoID, &clienteID, &r.ClienteNombre, &r.DiasMora,
			&r.Capital, &r.TasaAplicada, &r.MontoInteres, &notaDebitoID, &r.Estado, &createdAt); err != nil {
			return nil, 0, fmt.Errorf("scan interes: %w", err)
		}
		r.PagoID = uuidStrFromPg(pagoID)
		r.ClienteID = uuidStrFromPg(clienteID)
		r.NotaDebitoID = uuidStrFromPg(notaDebitoID)
		r.CreatedAt = createdAt.Format(time.RFC3339)
		results = append(results, r)
	}

	return results, count, nil
}

// --- Waive interest ---

func (s *InteresMoraService) Waive(ctx context.Context, userID pgtype.UUID, id string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE intereses_mora SET estado = 'CONDONADO' WHERE id = $1 AND usuario_id = $2 AND estado = 'CALCULADO'`,
		id, userID)
	return err
}
