package handler

import (
	"io"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/service"
)

type ReportHandler struct {
	svc *service.ReportService
}

func NewReportHandler(svc *service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

func parseReportFilters(r *http.Request) service.ReportFilters {
	var filters service.ReportFilters
	if desde := r.URL.Query().Get("desde"); desde != "" {
		if t, err := time.Parse("2006-01-02", desde); err == nil {
			filters.FechaDesde = pgtype.Date{Time: t, Valid: true}
		}
	}
	if hasta := r.URL.Query().Get("hasta"); hasta != "" {
		if t, err := time.Parse("2006-01-02", hasta); err == nil {
			filters.FechaHasta = pgtype.Date{Time: t, Valid: true}
		}
	}
	return filters
}

func (h *ReportHandler) GetSalesReport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	filters := parseReportFilters(r)

	result, err := h.svc.GetSalesReport(r.Context(), userID, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar reporte de ventas")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReportHandler) GetPurchasesReport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	filters := parseReportFilters(r)

	result, err := h.svc.GetPurchasesReport(r.Context(), userID, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar reporte de compras")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReportHandler) GetInventoryReport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	result, err := h.svc.GetInventoryReport(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar reporte de inventario")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReportHandler) GetFinanceReport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	filters := parseReportFilters(r)

	result, err := h.svc.GetFinanceReport(r.Context(), userID, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar reporte financiero")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReportHandler) GetProductReport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	filters := parseReportFilters(r)

	result, err := h.svc.GetProductReport(r.Context(), userID, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar reporte de productos")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReportHandler) ExportSalesCSV(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	filters := parseReportFilters(r)

	result, err := h.svc.GetSalesReport(r.Context(), userID, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al exportar ventas")
		return
	}

	headers := []string{"Cliente", "Total", "Cantidad"}
	rows := make([][]string, len(result.ByClient))
	for i, item := range result.ByClient {
		rows[i] = []string{item.Label, service.FormatFloat(item.Value), service.FormatInt(item.Count)}
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=ventas.csv")
	io.Copy(w, service.ExportToCSV(headers, rows))
}

func (h *ReportHandler) ExportPurchasesCSV(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	filters := parseReportFilters(r)

	result, err := h.svc.GetPurchasesReport(r.Context(), userID, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al exportar compras")
		return
	}

	headers := []string{"Proveedor", "Total", "Cantidad"}
	rows := make([][]string, len(result.BySupplier))
	for i, item := range result.BySupplier {
		rows[i] = []string{item.Label, service.FormatFloat(item.Value), service.FormatInt(item.Count)}
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=compras.csv")
	io.Copy(w, service.ExportToCSV(headers, rows))
}

func (h *ReportHandler) ExportInventoryCSV(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	result, err := h.svc.GetInventoryReport(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al exportar inventario")
		return
	}

	headers := []string{"Producto", "Codigo", "Sucursal", "Stock", "Precio", "Valor Total"}
	rows := make([][]string, len(result.StockValuation))
	for i, item := range result.StockValuation {
		rows[i] = []string{item.ProductoNombre, item.ProductoCodigo, item.SucursalNombre, service.FormatInt(int64(item.Stock)), service.FormatFloat(item.Precio), service.FormatFloat(item.ValorTotal)}
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=inventario.csv")
	io.Copy(w, service.ExportToCSV(headers, rows))
}

func (h *ReportHandler) ExportFinanceCSV(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	filters := parseReportFilters(r)

	result, err := h.svc.GetFinanceReport(r.Context(), userID, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al exportar finanzas")
		return
	}

	headers := []string{"Mes", "Ingresos", "Gastos"}
	rows := make([][]string, len(result.IncomeVsExpenses))
	for i, item := range result.IncomeVsExpenses {
		rows[i] = []string{item.Month, service.FormatFloat(item.Ingresos), service.FormatFloat(item.Gastos)}
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=finanzas.csv")
	io.Copy(w, service.ExportToCSV(headers, rows))
}
