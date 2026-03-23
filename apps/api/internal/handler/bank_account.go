package handler

import (
	"net/http"

	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/service"
)

type BankAccountHandler struct {
	bankAccountSvc     *service.BankAccountService
	financialIndicesSvc *service.FinancialIndicesService
}

func NewBankAccountHandler(
	bankAccountSvc *service.BankAccountService,
	financialIndicesSvc *service.FinancialIndicesService,
) *BankAccountHandler {
	return &BankAccountHandler{
		bankAccountSvc:      bankAccountSvc,
		financialIndicesSvc: financialIndicesSvc,
	}
}

func (h *BankAccountHandler) GetBankDashboard(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	data, err := h.bankAccountSvc.GetBankDashboard(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener dashboard bancario")
		return
	}

	response.JSON(w, http.StatusOK, data)
}

func (h *BankAccountHandler) GetFinancialIndices(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	data, err := h.financialIndicesSvc.GetFinancialIndices(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al calcular indices financieros")
		return
	}

	response.JSON(w, http.StatusOK, data)
}
