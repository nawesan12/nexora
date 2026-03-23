package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SalesKPIService struct {
	db *pgxpool.Pool
}

func NewSalesKPIService(db *pgxpool.Pool) *SalesKPIService {
	return &SalesKPIService{db: db}
}

// --- DTOs ---

type SalesKPIData struct {
	ConversionRate  float64          `json:"conversion_rate"`
	AvgOrderValue   float64          `json:"avg_order_value"`
	TotalRevenue30d float64          `json:"total_revenue_30d"`
	TotalOrders30d  int              `json:"total_orders_30d"`
	TopSellers      []TopSellerItem  `json:"top_sellers"`
	TopProducts     []TopProductItem `json:"top_products"`
	TopClients      []TopClientItem  `json:"top_clients"`
	SalesTrend      []SalesTrendItem `json:"sales_trend"`
	StatusBreakdown []StatusItem     `json:"status_breakdown"`
}

type TopSellerItem struct {
	EmpleadoID      string  `json:"empleado_id"`
	EmpleadoNombre  string  `json:"empleado_nombre"`
	TotalVentas     float64 `json:"total_ventas"`
	CantidadPedidos int     `json:"cantidad_pedidos"`
}

type TopProductItem struct {
	ProductoID      string  `json:"producto_id"`
	ProductoNombre  string  `json:"producto_nombre"`
	CantidadVendida int     `json:"cantidad_vendida"`
	MontoTotal      float64 `json:"monto_total"`
}

type TopClientItem struct {
	ClienteID       string  `json:"cliente_id"`
	ClienteNombre   string  `json:"cliente_nombre"`
	TotalCompras    float64 `json:"total_compras"`
	CantidadPedidos int     `json:"cantidad_pedidos"`
}

type SalesTrendItem struct {
	Fecha    string  `json:"fecha"`
	Monto    float64 `json:"monto"`
	Cantidad int     `json:"cantidad"`
}

type StatusItem struct {
	Estado   string `json:"estado"`
	Cantidad int    `json:"cantidad"`
}

// --- Methods ---

func (s *SalesKPIService) GetKPIs(ctx context.Context, userID pgtype.UUID) (*SalesKPIData, error) {
	now := time.Now().UTC()
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	data := &SalesKPIData{
		TopSellers:      []TopSellerItem{},
		TopProducts:     []TopProductItem{},
		TopClients:      []TopClientItem{},
		SalesTrend:      []SalesTrendItem{},
		StatusBreakdown: []StatusItem{},
	}

	// Total orders in the last 30 days and approved orders for conversion rate
	var totalOrders, approvedOrders int
	var totalRevenue float64
	err := s.db.QueryRow(ctx, `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE estado IN ('APROBADO','EN_PREPARACION','LISTO_PARA_ENTREGAR','EN_REPARTO','ENTREGADO')),
			COALESCE(SUM(total) FILTER (WHERE estado IN ('APROBADO','EN_PREPARACION','LISTO_PARA_ENTREGAR','EN_REPARTO','ENTREGADO')), 0)
		FROM pedidos
		WHERE usuario_id = $1 AND created_at >= $2 AND active = TRUE
	`, userID, thirtyDaysAgo).Scan(&totalOrders, &approvedOrders, &totalRevenue)
	if err != nil {
		return nil, fmt.Errorf("kpi base query: %w", err)
	}

	data.TotalOrders30d = totalOrders
	data.TotalRevenue30d = totalRevenue
	if totalOrders > 0 {
		data.ConversionRate = math.Round(float64(approvedOrders)/float64(totalOrders)*10000) / 100
	}
	if approvedOrders > 0 {
		data.AvgOrderValue = math.Round(totalRevenue/float64(approvedOrders)*100) / 100
	}

	// Top 10 sellers by revenue
	sellerRows, err := s.db.Query(ctx, `
		SELECT
			e.id,
			CONCAT(e.nombre, ' ', e.apellido) as nombre,
			COALESCE(SUM(p.total), 0) as total_ventas,
			COUNT(p.id) as cantidad_pedidos
		FROM pedidos p
		JOIN empleados e ON p.empleado_id = e.id
		WHERE p.usuario_id = $1
			AND p.created_at >= $2
			AND p.active = TRUE
			AND p.estado IN ('APROBADO','EN_PREPARACION','LISTO_PARA_ENTREGAR','EN_REPARTO','ENTREGADO')
		GROUP BY e.id, e.nombre, e.apellido
		ORDER BY total_ventas DESC
		LIMIT 10
	`, userID, thirtyDaysAgo)
	if err != nil {
		return nil, fmt.Errorf("top sellers query: %w", err)
	}
	defer sellerRows.Close()
	for sellerRows.Next() {
		var item TopSellerItem
		var empID pgtype.UUID
		if err := sellerRows.Scan(&empID, &item.EmpleadoNombre, &item.TotalVentas, &item.CantidadPedidos); err != nil {
			return nil, fmt.Errorf("scan top seller: %w", err)
		}
		item.EmpleadoID = uuidStrFromPg(empID)
		data.TopSellers = append(data.TopSellers, item)
	}

	// Top 10 products by quantity sold
	prodRows, err := s.db.Query(ctx, `
		SELECT
			pr.id,
			pr.nombre,
			COALESCE(SUM(dp.cantidad)::INTEGER, 0) as cantidad_vendida,
			COALESCE(SUM(dp.subtotal), 0) as monto_total
		FROM detalle_pedidos dp
		JOIN pedidos p ON dp.pedido_id = p.id
		JOIN productos pr ON dp.producto_id = pr.id
		WHERE p.usuario_id = $1
			AND p.created_at >= $2
			AND p.active = TRUE
			AND p.estado IN ('APROBADO','EN_PREPARACION','LISTO_PARA_ENTREGAR','EN_REPARTO','ENTREGADO')
		GROUP BY pr.id, pr.nombre
		ORDER BY cantidad_vendida DESC
		LIMIT 10
	`, userID, thirtyDaysAgo)
	if err != nil {
		return nil, fmt.Errorf("top products query: %w", err)
	}
	defer prodRows.Close()
	for prodRows.Next() {
		var item TopProductItem
		var prodID pgtype.UUID
		if err := prodRows.Scan(&prodID, &item.ProductoNombre, &item.CantidadVendida, &item.MontoTotal); err != nil {
			return nil, fmt.Errorf("scan top product: %w", err)
		}
		item.ProductoID = uuidStrFromPg(prodID)
		data.TopProducts = append(data.TopProducts, item)
	}

	// Top 10 clients by spend
	clientRows, err := s.db.Query(ctx, `
		SELECT
			c.id,
			c.nombre,
			COALESCE(SUM(p.total), 0) as total_compras,
			COUNT(p.id) as cantidad_pedidos
		FROM pedidos p
		JOIN clientes c ON p.cliente_id = c.id
		WHERE p.usuario_id = $1
			AND p.created_at >= $2
			AND p.active = TRUE
			AND p.estado IN ('APROBADO','EN_PREPARACION','LISTO_PARA_ENTREGAR','EN_REPARTO','ENTREGADO')
		GROUP BY c.id, c.nombre
		ORDER BY total_compras DESC
		LIMIT 10
	`, userID, thirtyDaysAgo)
	if err != nil {
		return nil, fmt.Errorf("top clients query: %w", err)
	}
	defer clientRows.Close()
	for clientRows.Next() {
		var item TopClientItem
		var clientID pgtype.UUID
		if err := clientRows.Scan(&clientID, &item.ClienteNombre, &item.TotalCompras, &item.CantidadPedidos); err != nil {
			return nil, fmt.Errorf("scan top client: %w", err)
		}
		item.ClienteID = uuidStrFromPg(clientID)
		data.TopClients = append(data.TopClients, item)
	}

	// Sales trend (daily for last 30 days)
	trendRows, err := s.db.Query(ctx, `
		SELECT
			d::date as fecha,
			COALESCE(SUM(p.total), 0) as monto,
			COUNT(p.id)::INTEGER as cantidad
		FROM generate_series($2::date, $3::date, '1 day'::interval) d
		LEFT JOIN pedidos p ON p.created_at::date = d::date
			AND p.usuario_id = $1
			AND p.active = TRUE
			AND p.estado IN ('APROBADO','EN_PREPARACION','LISTO_PARA_ENTREGAR','EN_REPARTO','ENTREGADO')
		GROUP BY d::date
		ORDER BY d::date
	`, userID, thirtyDaysAgo, now)
	if err != nil {
		return nil, fmt.Errorf("sales trend query: %w", err)
	}
	defer trendRows.Close()
	for trendRows.Next() {
		var item SalesTrendItem
		var fecha time.Time
		if err := trendRows.Scan(&fecha, &item.Monto, &item.Cantidad); err != nil {
			return nil, fmt.Errorf("scan trend: %w", err)
		}
		item.Fecha = fecha.Format("2006-01-02")
		data.SalesTrend = append(data.SalesTrend, item)
	}

	// Status breakdown
	statusRows, err := s.db.Query(ctx, `
		SELECT estado, COUNT(*)::INTEGER as cantidad
		FROM pedidos
		WHERE usuario_id = $1 AND created_at >= $2 AND active = TRUE
		GROUP BY estado
		ORDER BY cantidad DESC
	`, userID, thirtyDaysAgo)
	if err != nil {
		return nil, fmt.Errorf("status breakdown query: %w", err)
	}
	defer statusRows.Close()
	for statusRows.Next() {
		var item StatusItem
		if err := statusRows.Scan(&item.Estado, &item.Cantidad); err != nil {
			return nil, fmt.Errorf("scan status: %w", err)
		}
		data.StatusBreakdown = append(data.StatusBreakdown, item)
	}

	return data, nil
}
