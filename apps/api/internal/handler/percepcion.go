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

type PercepcionHandler struct {
	svc *service.PercepcionService
}

func NewPercepcionHandler(svc *service.PercepcionService) *PercepcionHandler {
	return &PercepcionHandler{svc: svc}
}

// ==================== Config CRUD ====================

func (h *PercepcionHandler) ListConfigs(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	items, err := h.svc.ListConfigs(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar configuraciones de percepciones")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *PercepcionHandler) CreateConfig(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateConfigPercepcionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateConfig(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear configuracion de percepcion")
		return
	}
	response.Created(w, result)
}

func (h *PercepcionHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetConfig(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrConfigPercepcionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuracion de percepcion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener configuracion de percepcion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PercepcionHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateConfigPercepcionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateConfig(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrConfigPercepcionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuracion de percepcion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar configuracion de percepcion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PercepcionHandler) DeleteConfig(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteConfig(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrConfigPercepcionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuracion de percepcion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar configuracion de percepcion")
		return
	}
	response.NoContent(w)
}

// ==================== Perception Records ====================

func (h *PercepcionHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	periodo := r.URL.Query().Get("periodo")
	comprobanteID := r.URL.Query().Get("comprobante_id")

	if comprobanteID != "" {
		items, err := h.svc.ListByComprobante(r.Context(), userID, comprobanteID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar percepciones")
			return
		}
		response.JSON(w, http.StatusOK, items)
		return
	}

	items, total, err := h.svc.ListByPeriodo(r.Context(), userID, periodo, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar percepciones")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *PercepcionHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreatePercepcionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreatePercepcion(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear percepcion")
		return
	}
	response.Created(w, result)
}

func (h *PercepcionHandler) Calculate(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	type calcInput struct {
		ClienteID     string  `json:"cliente_id" validate:"required,uuid"`
		BaseImponible float64 `json:"base_imponible" validate:"required,gt=0"`
	}

	var input calcInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CalculateForInvoice(r.Context(), userID, input.ClienteID, input.BaseImponible)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al calcular percepciones")
		return
	}
	response.JSON(w, http.StatusOK, result)
}
