package service

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
	"golang.org/x/sync/errgroup"
)

type ReportService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewReportService(db *pgxpool.Pool) *ReportService {
	return &ReportService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type ReportPeriodItem struct {
	Month string  `json:"month"`
	Total float64 `json:"total"`
	Count int64   `json:"count"`
}

type ReportGroupItem struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
	Count int64   `json:"count"`
}

type StockValuationItem struct {
	ProductoNombre string  `json:"producto_nombre"`
	ProductoCodigo string  `json:"producto_codigo,omitempty"`
	SucursalNombre string  `json:"sucursal_nombre"`
	Stock          int32   `json:"stock"`
	Precio         float64 `json:"precio"`
	ValorTotal     float64 `json:"valor_total"`
}

type LowStockItem struct {
	ProductoNombre string `json:"producto_nombre"`
	ProductoCodigo string `json:"producto_codigo,omitempty"`
	SucursalNombre string `json:"sucursal_nombre"`
	Stock          int32  `json:"stock"`
	StockMinimo    int32  `json:"stock_minimo"`
}

type IncomeExpenseItem struct {
	Month    string  `json:"month"`
	Ingresos float64 `json:"ingresos"`
	Gastos   float64 `json:"gastos"`
}

type SalesReportResponse struct {
	ByPeriod   []ReportPeriodItem `json:"by_period"`
	ByClient   []ReportGroupItem  `json:"by_client"`
	ByProduct  []ReportGroupItem  `json:"by_product"`
	ByEmployee []ReportGroupItem  `json:"by_employee"`
}

type PurchasesReportResponse struct {
	ByPeriod   []ReportPeriodItem `json:"by_period"`
	BySupplier []ReportGroupItem  `json:"by_supplier"`
}

type InventoryReportResponse struct {
	StockValuation   []StockValuationItem `json:"stock_valuation"`
	MovementsSummary []ReportGroupItem    `json:"movements_summary"`
	LowStock         []LowStockItem       `json:"low_stock"`
}

type FinanceReportResponse struct {
	IncomeVsExpenses []IncomeExpenseItem `json:"income_vs_expenses"`
	ExpenseBreakdown []ReportGroupItem   `json:"expense_breakdown"`
}

type ProductReportResponse struct {
	TopSellers []ReportGroupItem `json:"top_sellers"`
}

type ReportFilters struct {
	FechaDesde pgtype.Date
	FechaHasta pgtype.Date
}

// --- Helpers for interface{} conversions ---
// sqlc generates interface{} for COALESCE(SUM(...), 0) and string concatenation expressions.

func ifaceToFloat64(v interface{}) float64 {
	if v == nil {
		return 0
	}
	switch val := v.(type) {
	case pgtype.Numeric:
		return floatFromNumeric(val)
	case float64:
		return val
	case float32:
		return float64(val)
	case int64:
		return float64(val)
	case int32:
		return float64(val)
	case int:
		return float64(val)
	default:
		return 0
	}
}

func ifaceToString(v interface{}) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	default:
		return fmt.Sprintf("%v", val)
	}
}

// --- Methods ---

func (s *ReportService) GetSalesReport(ctx context.Context, userID pgtype.UUID, filters ReportFilters) (*SalesReportResponse, error) {
	var resp SalesReportResponse
	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		rows, err := s.queries.ReportVentasPorPeriodo(gctx, repository.ReportVentasPorPeriodoParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.ByPeriod = make([]ReportPeriodItem, len(rows))
		for i, r := range rows {
			resp.ByPeriod[i] = ReportPeriodItem{Month: r.Month, Total: ifaceToFloat64(r.Total), Count: r.Count}
		}
		return nil
	})

	g.Go(func() error {
		rows, err := s.queries.ReportVentasPorCliente(gctx, repository.ReportVentasPorClienteParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.ByClient = make([]ReportGroupItem, len(rows))
		for i, r := range rows {
			resp.ByClient[i] = ReportGroupItem{Label: ifaceToString(r.Label), Value: ifaceToFloat64(r.Value), Count: r.Count}
		}
		return nil
	})

	g.Go(func() error {
		rows, err := s.queries.ReportVentasPorProducto(gctx, repository.ReportVentasPorProductoParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.ByProduct = make([]ReportGroupItem, len(rows))
		for i, r := range rows {
			resp.ByProduct[i] = ReportGroupItem{Label: r.Label, Value: ifaceToFloat64(r.Value), Count: r.Count}
		}
		return nil
	})

	g.Go(func() error {
		rows, err := s.queries.ReportVentasPorEmpleado(gctx, repository.ReportVentasPorEmpleadoParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.ByEmployee = make([]ReportGroupItem, len(rows))
		for i, r := range rows {
			resp.ByEmployee[i] = ReportGroupItem{Label: ifaceToString(r.Label), Value: ifaceToFloat64(r.Value), Count: r.Count}
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("sales report: %w", err)
	}
	return &resp, nil
}

func (s *ReportService) GetPurchasesReport(ctx context.Context, userID pgtype.UUID, filters ReportFilters) (*PurchasesReportResponse, error) {
	var resp PurchasesReportResponse
	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		rows, err := s.queries.ReportComprasPorPeriodo(gctx, repository.ReportComprasPorPeriodoParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.ByPeriod = make([]ReportPeriodItem, len(rows))
		for i, r := range rows {
			resp.ByPeriod[i] = ReportPeriodItem{Month: r.Month, Total: ifaceToFloat64(r.Total), Count: r.Count}
		}
		return nil
	})

	g.Go(func() error {
		rows, err := s.queries.ReportComprasPorProveedor(gctx, repository.ReportComprasPorProveedorParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.BySupplier = make([]ReportGroupItem, len(rows))
		for i, r := range rows {
			resp.BySupplier[i] = ReportGroupItem{Label: r.Label, Value: ifaceToFloat64(r.Value), Count: r.Count}
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("purchases report: %w", err)
	}
	return &resp, nil
}

func (s *ReportService) GetInventoryReport(ctx context.Context, userID pgtype.UUID) (*InventoryReportResponse, error) {
	var resp InventoryReportResponse
	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		rows, err := s.queries.ReportStockValuation(gctx, userID)
		if err != nil {
			return err
		}
		resp.StockValuation = make([]StockValuationItem, len(rows))
		for i, r := range rows {
			resp.StockValuation[i] = StockValuationItem{
				ProductoNombre: r.ProductoNombre,
				ProductoCodigo: r.ProductoCodigo,
				SucursalNombre: r.SucursalNombre,
				Stock:          r.Stock,
				Precio:         floatFromNumeric(r.Precio),
				ValorTotal:     float64(r.ValorTotal),
			}
		}
		return nil
	})

	g.Go(func() error {
		rows, err := s.queries.ReportLowStock(gctx, userID)
		if err != nil {
			return err
		}
		resp.LowStock = make([]LowStockItem, len(rows))
		for i, r := range rows {
			resp.LowStock[i] = LowStockItem{
				ProductoNombre: r.ProductoNombre,
				ProductoCodigo: r.ProductoCodigo,
				SucursalNombre: r.SucursalNombre,
				Stock:          r.Stock,
				StockMinimo:    r.StockMinimo,
			}
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("inventory report: %w", err)
	}
	resp.MovementsSummary = []ReportGroupItem{}
	return &resp, nil
}

func (s *ReportService) GetFinanceReport(ctx context.Context, userID pgtype.UUID, filters ReportFilters) (*FinanceReportResponse, error) {
	var resp FinanceReportResponse
	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		rows, err := s.queries.ReportIngresosVsGastos(gctx, repository.ReportIngresosVsGastosParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.IncomeVsExpenses = make([]IncomeExpenseItem, len(rows))
		for i, r := range rows {
			resp.IncomeVsExpenses[i] = IncomeExpenseItem{
				Month:    r.Month,
				Ingresos: ifaceToFloat64(r.Ingresos),
				Gastos:   ifaceToFloat64(r.Gastos),
			}
		}
		return nil
	})

	g.Go(func() error {
		rows, err := s.queries.ReportDesgloseGastos(gctx, repository.ReportDesgloseGastosParams{
			UsuarioID:  userID,
			FechaDesde: filters.FechaDesde,
			FechaHasta: filters.FechaHasta,
		})
		if err != nil {
			return err
		}
		resp.ExpenseBreakdown = make([]ReportGroupItem, len(rows))
		for i, r := range rows {
			resp.ExpenseBreakdown[i] = ReportGroupItem{Label: r.Label, Value: ifaceToFloat64(r.Value), Count: r.Count}
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("finance report: %w", err)
	}
	return &resp, nil
}

func (s *ReportService) GetProductReport(ctx context.Context, userID pgtype.UUID, filters ReportFilters) (*ProductReportResponse, error) {
	rows, err := s.queries.ReportTopProductos(ctx, repository.ReportTopProductosParams{
		UsuarioID:  userID,
		FechaDesde: filters.FechaDesde,
		FechaHasta: filters.FechaHasta,
	})
	if err != nil {
		return nil, fmt.Errorf("product report: %w", err)
	}

	items := make([]ReportGroupItem, len(rows))
	for i, r := range rows {
		items[i] = ReportGroupItem{Label: r.Label, Value: ifaceToFloat64(r.Value), Count: r.Count}
	}
	return &ProductReportResponse{TopSellers: items}, nil
}
