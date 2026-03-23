package service

import (
	"context"
	"fmt"
	"math"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BankAccountService struct {
	db *pgxpool.Pool
}

func NewBankAccountService(db *pgxpool.Pool) *BankAccountService {
	return &BankAccountService{db: db}
}

type BankAccountSummary struct {
	EntidadBancariaID string  `json:"entidad_bancaria_id"`
	EntidadNombre     string  `json:"entidad_nombre"`
	NumeroCuenta      string  `json:"numero_cuenta,omitempty"`
	CBU               string  `json:"cbu,omitempty"`
	Alias             string  `json:"alias,omitempty"`
	SucursalBanco     string  `json:"sucursal_banco,omitempty"`
	CajaID            string  `json:"caja_id,omitempty"`
	CajaNombre        string  `json:"caja_nombre,omitempty"`
	Saldo             float64 `json:"saldo"`
	SucursalID        string  `json:"sucursal_id"`
	SucursalNombre    string  `json:"sucursal_nombre,omitempty"`
}

type BankDashboardData struct {
	Accounts     []BankAccountSummary `json:"accounts"`
	TotalBalance float64              `json:"total_balance"`
	TotalCash    float64              `json:"total_cash"`
	TotalBank    float64              `json:"total_bank"`
}

func (s *BankAccountService) GetBankDashboard(ctx context.Context, userID pgtype.UUID) (*BankDashboardData, error) {
	// Query bank accounts: entidades_bancarias LEFT JOIN cajas (tipo=BANCO) on same sucursal + user
	// Also join sucursales for the branch name
	bankQuery := `
		SELECT
			eb.id AS entidad_bancaria_id,
			eb.nombre AS entidad_nombre,
			COALESCE(eb.numero_cuenta, '') AS numero_cuenta,
			COALESCE(eb.cbu, '') AS cbu,
			COALESCE(eb.alias, '') AS alias,
			COALESCE(eb.sucursal_banco, '') AS sucursal_banco,
			COALESCE(c.id::text, '') AS caja_id,
			COALESCE(c.nombre, '') AS caja_nombre,
			COALESCE(c.saldo, 0) AS saldo,
			eb.sucursal_id::text AS sucursal_id,
			COALESCE(su.nombre, '') AS sucursal_nombre
		FROM entidades_bancarias eb
		LEFT JOIN cajas c
			ON c.sucursal_id = eb.sucursal_id
			AND c.tipo = 'BANCO'
			AND c.activa = true
			AND c.usuario_id = $1
		LEFT JOIN sucursales su ON su.id = eb.sucursal_id
		WHERE eb.active = true
			AND eb.usuario_id = $1
		ORDER BY eb.nombre
	`

	rows, err := s.db.Query(ctx, bankQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("query bank accounts: %w", err)
	}
	defer rows.Close()

	var accounts []BankAccountSummary
	var totalBank float64

	for rows.Next() {
		var a BankAccountSummary
		if err := rows.Scan(
			&a.EntidadBancariaID,
			&a.EntidadNombre,
			&a.NumeroCuenta,
			&a.CBU,
			&a.Alias,
			&a.SucursalBanco,
			&a.CajaID,
			&a.CajaNombre,
			&a.Saldo,
			&a.SucursalID,
			&a.SucursalNombre,
		); err != nil {
			return nil, fmt.Errorf("scan bank account: %w", err)
		}
		totalBank += a.Saldo
		accounts = append(accounts, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate bank accounts: %w", err)
	}

	// Query total cash from cajas with tipo=EFECTIVO
	var totalCash float64
	cashQuery := `
		SELECT COALESCE(SUM(saldo), 0)
		FROM cajas
		WHERE tipo = 'EFECTIVO'
			AND activa = true
			AND usuario_id = $1
	`
	if err := s.db.QueryRow(ctx, cashQuery, userID).Scan(&totalCash); err != nil {
		return nil, fmt.Errorf("query total cash: %w", err)
	}

	if accounts == nil {
		accounts = []BankAccountSummary{}
	}

	return &BankDashboardData{
		Accounts:     accounts,
		TotalBalance: totalCash + totalBank,
		TotalCash:    totalCash,
		TotalBank:    totalBank,
	}, nil
}

// FinancialIndicesService calculates financial KPIs from existing tables.
type FinancialIndicesService struct {
	db *pgxpool.Pool
}

func NewFinancialIndicesService(db *pgxpool.Pool) *FinancialIndicesService {
	return &FinancialIndicesService{db: db}
}

type FinancialIndices struct {
	CurrentRatio   float64 `json:"current_ratio"`
	DSO            float64 `json:"dso"`
	DPO            float64 `json:"dpo"`
	ProfitMargin   float64 `json:"profit_margin"`
	Revenue30d     float64 `json:"revenue_30d"`
	Expenses30d    float64 `json:"expenses_30d"`
	NetIncome30d   float64 `json:"net_income_30d"`
	AvgOrderValue  float64 `json:"avg_order_value"`
	OrdersCount30d int     `json:"orders_count_30d"`
	CollectionRate float64 `json:"collection_rate"`
}

func (s *FinancialIndicesService) GetFinancialIndices(ctx context.Context, userID pgtype.UUID) (*FinancialIndices, error) {
	indices := &FinancialIndices{}

	// Revenue last 30 days: SUM(total) from comprobantes where estado != 'ANULADO'
	revenueQuery := `
		SELECT COALESCE(SUM(total), 0)
		FROM comprobantes
		WHERE estado != 'ANULADO'
			AND fecha_emision >= CURRENT_DATE - INTERVAL '30 days'
			AND usuario_id = $1
	`
	if err := s.db.QueryRow(ctx, revenueQuery, userID).Scan(&indices.Revenue30d); err != nil {
		return nil, fmt.Errorf("query revenue: %w", err)
	}

	// Expenses last 30 days: SUM(monto) from gastos
	expensesQuery := `
		SELECT COALESCE(SUM(monto), 0)
		FROM gastos
		WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
			AND active = true
			AND usuario_id = $1
	`
	if err := s.db.QueryRow(ctx, expensesQuery, userID).Scan(&indices.Expenses30d); err != nil {
		return nil, fmt.Errorf("query expenses: %w", err)
	}

	indices.NetIncome30d = indices.Revenue30d - indices.Expenses30d

	// Profit margin
	if indices.Revenue30d > 0 {
		indices.ProfitMargin = math.Round((indices.NetIncome30d/indices.Revenue30d)*10000) / 100
	}

	// Orders count and average value in last 30 days
	ordersQuery := `
		SELECT COUNT(*), COALESCE(AVG(total), 0)
		FROM pedidos
		WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
			AND estado NOT IN ('CANCELADO')
			AND usuario_id = $1
	`
	if err := s.db.QueryRow(ctx, ordersQuery, userID).Scan(&indices.OrdersCount30d, &indices.AvgOrderValue); err != nil {
		return nil, fmt.Errorf("query orders: %w", err)
	}
	indices.AvgOrderValue = math.Round(indices.AvgOrderValue*100) / 100

	// DSO: (pending receivables / revenue) * 30
	// pending receivables = total of comprobantes emitidos - total pagos aplicados
	dsoQuery := `
		SELECT COALESCE(SUM(c.total), 0) - COALESCE(
			(SELECT SUM(ap.monto_aplicado)
			 FROM aplicaciones_pago ap
			 JOIN pagos p ON p.id = ap.pago_id
			 WHERE p.estado != 'ANULADO' AND p.usuario_id = $1), 0)
		FROM comprobantes c
		WHERE c.estado NOT IN ('ANULADO', 'BORRADOR')
			AND c.usuario_id = $1
	`
	var pendingReceivables float64
	if err := s.db.QueryRow(ctx, dsoQuery, userID).Scan(&pendingReceivables); err != nil {
		// If table doesn't exist (pagos might not have data), just set to 0
		pendingReceivables = 0
	}
	if indices.Revenue30d > 0 {
		indices.DSO = math.Round((pendingReceivables/indices.Revenue30d)*30*100) / 100
	}

	// DPO: (pending payables / purchases) * 30
	dpoQuery := `
		SELECT
			COALESCE(SUM(oc.total), 0) AS total_purchases,
			COALESCE(SUM(oc.total), 0) - COALESCE(
				(SELECT SUM(app.monto_aplicado)
				 FROM aplicaciones_pago_proveedor app
				 JOIN pagos_proveedor pp ON pp.id = app.pago_proveedor_id
				 WHERE pp.estado != 'ANULADO' AND pp.usuario_id = $1), 0) AS pending_payables
		FROM ordenes_compra oc
		WHERE oc.estado NOT IN ('CANCELADA', 'BORRADOR')
			AND oc.usuario_id = $1
	`
	var totalPurchases, pendingPayables float64
	if err := s.db.QueryRow(ctx, dpoQuery, userID).Scan(&totalPurchases, &pendingPayables); err != nil {
		pendingPayables = 0
		totalPurchases = 0
	}
	if totalPurchases > 0 {
		indices.DPO = math.Round((pendingPayables/totalPurchases)*30*100) / 100
	}

	// Current ratio: total cajas saldo / total pending expenses (gastos recurrentes as proxy for liabilities)
	var totalAssets float64
	assetsQuery := `
		SELECT COALESCE(SUM(saldo), 0)
		FROM cajas
		WHERE activa = true AND usuario_id = $1
	`
	if err := s.db.QueryRow(ctx, assetsQuery, userID).Scan(&totalAssets); err != nil {
		return nil, fmt.Errorf("query assets: %w", err)
	}

	var totalLiabilities float64
	liabilitiesQuery := `
		SELECT COALESCE(SUM(monto), 0)
		FROM gastos
		WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
			AND active = true
			AND usuario_id = $1
	`
	if err := s.db.QueryRow(ctx, liabilitiesQuery, userID).Scan(&totalLiabilities); err != nil {
		return nil, fmt.Errorf("query liabilities: %w", err)
	}
	if totalLiabilities > 0 {
		indices.CurrentRatio = math.Round((totalAssets/totalLiabilities)*100) / 100
	} else if totalAssets > 0 {
		indices.CurrentRatio = 99.99 // healthy — no liabilities
	}

	// Collection rate: % of comprobantes that have been fully paid
	collectionQuery := `
		SELECT
			COALESCE(COUNT(*), 0) AS total_emitidos,
			COALESCE(COUNT(*) FILTER (
				WHERE c.total <= COALESCE(
					(SELECT SUM(ap.monto_aplicado) FROM aplicaciones_pago ap
					 JOIN pagos p ON p.id = ap.pago_id
					 WHERE ap.comprobante_id = c.id AND p.estado != 'ANULADO'), 0)
			), 0) AS total_cobrados
		FROM comprobantes c
		WHERE c.estado NOT IN ('ANULADO', 'BORRADOR')
			AND c.usuario_id = $1
	`
	var totalEmitidos, totalCobrados int
	if err := s.db.QueryRow(ctx, collectionQuery, userID).Scan(&totalEmitidos, &totalCobrados); err != nil {
		totalEmitidos = 0
		totalCobrados = 0
	}
	if totalEmitidos > 0 {
		indices.CollectionRate = math.Round((float64(totalCobrados)/float64(totalEmitidos))*10000) / 100
	}

	return indices, nil
}
