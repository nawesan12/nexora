package handler

import (
	"net/http"
	"strconv"

	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type PeriodoFiscalHandler struct {
	svc *service.PeriodoFiscalService
}

func NewPeriodoFiscalHandler(svc *service.PeriodoFiscalService) *PeriodoFiscalHandler {
	return &PeriodoFiscalHandler{svc: svc}
}

func (h *PeriodoFiscalHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	items, err := h.svc.List(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, items)
}

type periodoActionInput struct {
	Anio int `json:"anio" validate:"required,min=2020,max=2100"`
	Mes  int `json:"mes" validate:"required,min=1,max=12"`
}

func (h *PeriodoFiscalHandler) Close(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input periodoActionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	if err := h.svc.Close(r.Context(), userID, input.Anio, input.Mes); err != nil {
		status := http.StatusInternalServerError
		code := "INTERNAL_ERROR"
		if err.Error() == service.ErrPeriodoYaCerrado.Error() {
			status = http.StatusConflict
			code = "ALREADY_CLOSED"
		}
		response.Error(w, status, code, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, response.Map{"message": "periodo cerrado"})
}

func (h *PeriodoFiscalHandler) Reopen(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input periodoActionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	if err := h.svc.Reopen(r.Context(), userID, input.Anio, input.Mes); err != nil {
		status := http.StatusInternalServerError
		code := "INTERNAL_ERROR"
		if err.Error() == service.ErrPeriodoYaAbierto.Error() {
			status = http.StatusConflict
			code = "ALREADY_OPEN"
		}
		response.Error(w, status, code, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, response.Map{"message": "periodo reabierto"})
}

// unused import guard
var _ = strconv.Itoa
