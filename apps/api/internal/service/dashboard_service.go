package service

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
	"golang.org/x/sync/errgroup"
)

type DashboardService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewDashboardService(db *pgxpool.Pool) *DashboardService {
	return &DashboardService{
		db:      db,
		queries: repository.New(db),
	}
}

// Response DTOs

type DashboardKPIs struct {
	PedidosHoy       int64   `json:"pedidos_hoy"`
	ProductosActivos int64   `json:"productos_activos"`
	ClientesActivos  int64   `json:"clientes_activos"`
	FacturacionMes   float64 `json:"facturacion_mes"`
}

type MonthlyAmount struct {
	Month string  `json:"month"`
	Total float64 `json:"total"`
}

type StatusCount struct {
	Estado string `json:"estado"`
	Count  int64  `json:"count"`
}

type DailyCount struct {
	Day   string `json:"day"`
	Count int64  `json:"count"`
}

type ActivityItem struct {
	ID             string  `json:"id"`
	EstadoAnterior *string `json:"estado_anterior"`
	EstadoNuevo    string  `json:"estado_nuevo"`
	Comentario     *string `json:"comentario,omitempty"`
	CreatedAt      string  `json:"created_at"`
	PedidoNumero   string  `json:"pedido_numero"`
	ClienteNombre  string  `json:"cliente_nombre"`
	EmpleadoNombre *string `json:"empleado_nombre,omitempty"`
}

type DashboardStatsResponse struct {
	KPIs           DashboardKPIs  `json:"kpis"`
	RevenueChart   []MonthlyAmount `json:"revenue_chart"`
	ExpensesChart  []MonthlyAmount `json:"expenses_chart"`
	OrdersByStatus []StatusCount   `json:"orders_by_status"`
	WeeklyOrders   []DailyCount    `json:"weekly_orders"`
	RecentActivity []ActivityItem  `json:"recent_activity"`
}

func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Int.Float64()
	if n.Exp < 0 {
		divisor := new(big.Float).SetInt(new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(-n.Exp)), nil))
		result, _ := new(big.Float).Quo(new(big.Float).SetFloat64(f), divisor).Float64()
		return result
	}
	return f
}

func (s *DashboardService) GetStats(ctx context.Context, userID pgtype.UUID) (*DashboardStatsResponse, error) {
	var (
		pedidosHoy       int64
		productosActivos int64
		clientesActivos  int64
		facturacionMes   pgtype.Numeric
		ingresos         []repository.DashboardIngresosMensualesRow
		gastos           []repository.DashboardGastosMensualesRow
		porEstado        []repository.DashboardPedidosPorEstadoRow
		semana           []repository.DashboardPedidosSemanaRow
		actividad        []repository.DashboardActividadRecienteRow
	)

	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		var err error
		pedidosHoy, err = s.queries.DashboardCountPedidosHoy(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		productosActivos, err = s.queries.DashboardCountProductosActivos(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		clientesActivos, err = s.queries.DashboardCountClientesActivos(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		facturacionMes, err = s.queries.DashboardFacturacionMes(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		ingresos, err = s.queries.DashboardIngresosMensuales(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		gastos, err = s.queries.DashboardGastosMensuales(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		porEstado, err = s.queries.DashboardPedidosPorEstado(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		semana, err = s.queries.DashboardPedidosSemana(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		actividad, err = s.queries.DashboardActividadReciente(gctx, repository.DashboardActividadRecienteParams{
			UsuarioID: userID,
			Limit:     10,
		})
		return err
	})

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("dashboard queries: %w", err)
	}

	// Build response
	resp := &DashboardStatsResponse{
		KPIs: DashboardKPIs{
			PedidosHoy:       pedidosHoy,
			ProductosActivos: productosActivos,
			ClientesActivos:  clientesActivos,
			FacturacionMes:   numericToFloat64(facturacionMes),
		},
	}

	// Revenue chart
	resp.RevenueChart = make([]MonthlyAmount, len(ingresos))
	for i, row := range ingresos {
		resp.RevenueChart[i] = MonthlyAmount{
			Month: row.Month,
			Total: numericToFloat64(row.Total),
		}
	}

	// Expenses chart
	resp.ExpensesChart = make([]MonthlyAmount, len(gastos))
	for i, row := range gastos {
		resp.ExpensesChart[i] = MonthlyAmount{
			Month: row.Month,
			Total: numericToFloat64(row.Total),
		}
	}

	// Orders by status
	resp.OrdersByStatus = make([]StatusCount, len(porEstado))
	for i, row := range porEstado {
		resp.OrdersByStatus[i] = StatusCount{
			Estado: row.Estado,
			Count:  row.Count,
		}
	}

	// Weekly orders
	resp.WeeklyOrders = make([]DailyCount, len(semana))
	for i, row := range semana {
		day := ""
		if row.Day.Valid {
			day = time.Date(int(row.Day.Time.Year()), row.Day.Time.Month(), row.Day.Time.Day(), 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		}
		resp.WeeklyOrders[i] = DailyCount{
			Day:   day,
			Count: row.Count,
		}
	}

	// Recent activity
	resp.RecentActivity = make([]ActivityItem, len(actividad))
	for i, row := range actividad {
		item := ActivityItem{
			ID:            fmt.Sprintf("%x", row.ID.Bytes),
			EstadoNuevo:   row.EstadoNuevo,
			CreatedAt:     row.CreatedAt.Time.Format(time.RFC3339),
			PedidoNumero:  row.PedidoNumero,
			ClienteNombre: row.ClienteNombre,
		}
		if row.EstadoAnterior != "" {
			ea := row.EstadoAnterior
			item.EstadoAnterior = &ea
		}
		if row.Comentario.Valid {
			item.Comentario = &row.Comentario.String
		}
		if row.EmpleadoNombre.Valid {
			item.EmpleadoNombre = &row.EmpleadoNombre.String
		}
		resp.RecentActivity[i] = item
	}

	return resp, nil
}
