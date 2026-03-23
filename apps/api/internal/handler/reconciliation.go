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

type ReconciliationHandler struct {
	svc *service.ReconciliationService
}

func NewReconciliationHandler(svc *service.ReconciliationService) *ReconciliationHandler {
	return &ReconciliationHandler{svc: svc}
}

func (h *ReconciliationHandler) ListExtractos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.ListExtractos(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar extractos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, int(total)))
}

func (h *ReconciliationHandler) CreateExtracto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateExtractoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateExtracto(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear extracto")
		return
	}
	response.Created(w, result)
}

func (h *ReconciliationHandler) GetExtracto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetExtracto(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrExtractoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "extracto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener extracto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReconciliationHandler) ImportMovimientos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.ImportMovimientosInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	err := h.svc.ImportMovimientos(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrExtractoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "extracto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al importar movimientos")
		return
	}
	response.JSON(w, http.StatusOK, response.Map{"message": "movimientos importados correctamente"})
}

func (h *ReconciliationHandler) Conciliar(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	movID := chi.URLParam(r, "movId")

	var input service.ConciliarInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Conciliar(r.Context(), userID, movID, input)
	if err != nil {
		if errors.Is(err, service.ErrMovimientoBancarioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "movimiento bancario no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al conciliar")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReconciliationHandler) Descartar(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	movID := chi.URLParam(r, "movId")

	result, err := h.svc.Descartar(r.Context(), userID, movID)
	if err != nil {
		if errors.Is(err, service.ErrMovimientoBancarioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "movimiento bancario no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al descartar")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ReconciliationHandler) ListMovCajaParaConciliar(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	desde := r.URL.Query().Get("desde")
	hasta := r.URL.Query().Get("hasta")

	if desde == "" || hasta == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "desde y hasta son requeridos")
		return
	}

	items, err := h.svc.ListMovCajaParaConciliar(r.Context(), userID, id, desde, hasta)
	if err != nil {
		if errors.Is(err, service.ErrExtractoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "extracto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar movimientos de caja")
		return
	}
	response.JSON(w, http.StatusOK, items)
}
