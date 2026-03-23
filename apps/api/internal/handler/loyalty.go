package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/pagination"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type LoyaltyHandler struct {
	svc *service.LoyaltyService
}

func NewLoyaltyHandler(svc *service.LoyaltyService) *LoyaltyHandler {
	return &LoyaltyHandler{svc: svc}
}

func (h *LoyaltyHandler) GetPrograma(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	result, err := h.svc.GetPrograma(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrProgramaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "programa de fidelidad no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener programa")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LoyaltyHandler) UpsertPrograma(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.UpsertProgramaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpsertPrograma(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al guardar programa")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LoyaltyHandler) GetClientePuntos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "clienteId")

	result, err := h.svc.GetClientePuntos(r.Context(), userID, clienteID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener puntos del cliente")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LoyaltyHandler) ListMovimientos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "clienteId")
	params := pagination.Parse(r)

	items, total, err := h.svc.ListMovimientos(r.Context(), userID, clienteID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar movimientos de puntos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *LoyaltyHandler) Acumular(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "clienteId")

	var input service.AcumularPuntosInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.AcumularPuntos(r.Context(), userID, clienteID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al acumular puntos")
		return
	}
	response.Created(w, result)
}

func (h *LoyaltyHandler) Canjear(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "clienteId")

	var input service.CanjearPuntosInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CanjearPuntos(r.Context(), userID, clienteID, input)
	if err != nil {
		if errors.Is(err, service.ErrInsuficientePuntos) {
			response.Error(w, http.StatusBadRequest, "INSUFFICIENT_POINTS", "puntos insuficientes para el canje")
			return
		}
		if errors.Is(err, service.ErrMinimoCanje) {
			response.Error(w, http.StatusBadRequest, "MINIMUM_NOT_MET", "los puntos no alcanzan el minimo de canje")
			return
		}
		if errors.Is(err, service.ErrProgramaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "programa de fidelidad no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al canjear puntos")
		return
	}
	response.Created(w, result)
}
