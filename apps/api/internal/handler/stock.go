package handler

import (
	"errors"
	"net/http"

	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/pagination"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type StockHandler struct {
	svc *service.StockService
}

func NewStockHandler(svc *service.StockService) *StockHandler {
	return &StockHandler{svc: svc}
}

func (h *StockHandler) ListMovimientos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	filters := service.ListMovimientosFilters{
		ProductoID: r.URL.Query().Get("producto_id"),
		SucursalID: r.URL.Query().Get("sucursal_id"),
		Tipo:       r.URL.Query().Get("tipo"),
		FechaDesde: r.URL.Query().Get("fecha_desde"),
		FechaHasta: r.URL.Query().Get("fecha_hasta"),
	}

	items, total, err := h.svc.ListMovimientos(r.Context(), userID, filters, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar movimientos de stock")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *StockHandler) AdjustStock(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.AdjustStockInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.AdjustStock(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrStockInsuficiente) {
			response.Error(w, http.StatusConflict, "STOCK_INSUFICIENTE", "stock insuficiente para realizar el ajuste")
			return
		}
		if errors.Is(err, service.ErrCatalogoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "producto no encontrado en catálogo de la sucursal")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al ajustar stock")
		return
	}
	response.Created(w, result)
}
