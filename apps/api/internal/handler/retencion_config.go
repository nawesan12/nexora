package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type RetencionConfigHandler struct {
	svc *service.RetencionConfigService
}

func NewRetencionConfigHandler(svc *service.RetencionConfigService) *RetencionConfigHandler {
	return &RetencionConfigHandler{svc: svc}
}

func (h *RetencionConfigHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	items, err := h.svc.List(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar configuracion de retenciones")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *RetencionConfigHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateConfigRetencionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear configuracion de retencion")
		return
	}
	response.Created(w, result)
}

func (h *RetencionConfigHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrConfigRetencionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuracion de retencion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener configuracion de retencion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RetencionConfigHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateConfigRetencionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Update(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrConfigRetencionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuracion de retencion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar configuracion de retencion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RetencionConfigHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrConfigRetencionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuracion de retencion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar configuracion de retencion")
		return
	}
	response.NoContent(w)
}
