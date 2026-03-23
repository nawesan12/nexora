package handler

import (
	"errors"
	"net/http"

	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type CompanyHandler struct {
	svc *service.CompanyService
}

func NewCompanyHandler(svc *service.CompanyService) *CompanyHandler {
	return &CompanyHandler{svc: svc}
}

func (h *CompanyHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	result, err := h.svc.Get(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrEmpresaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuracion de empresa no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener configuracion de empresa")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *CompanyHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.UpsertEmpresaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Upsert(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al guardar configuracion de empresa")
		return
	}
	response.JSON(w, http.StatusOK, result)
}
