package handler

import (
	"net/http"

	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/service"
)

type SalesKPIHandler struct {
	svc *service.SalesKPIService
}

func NewSalesKPIHandler(svc *service.SalesKPIService) *SalesKPIHandler {
	return &SalesKPIHandler{svc: svc}
}

func (h *SalesKPIHandler) GetKPIs(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	data, err := h.svc.GetKPIs(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener KPIs de ventas")
		return
	}
	response.JSON(w, http.StatusOK, data)
}
