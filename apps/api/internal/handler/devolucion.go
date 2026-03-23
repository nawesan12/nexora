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

type DevolucionHandler struct {
	svc *service.DevolucionService
}

func NewDevolucionHandler(svc *service.DevolucionService) *DevolucionHandler {
	return &DevolucionHandler{svc: svc}
}

func (h *DevolucionHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar devoluciones")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *DevolucionHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrDevolucionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "devolucion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener devolucion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *DevolucionHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateDevolucionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear devolucion")
		return
	}
	response.Created(w, result)
}

func (h *DevolucionHandler) Approve(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Approve(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrDevolucionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "devolucion no encontrada")
			return
		}
		if errors.Is(err, service.ErrDevolucionInvalidState) {
			response.Error(w, http.StatusConflict, "INVALID_STATE", "la devolucion no puede ser aprobada en su estado actual")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al aprobar devolucion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *DevolucionHandler) Reject(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Reject(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrDevolucionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "devolucion no encontrada")
			return
		}
		if errors.Is(err, service.ErrDevolucionInvalidState) {
			response.Error(w, http.StatusConflict, "INVALID_STATE", "la devolucion no puede ser rechazada en su estado actual")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al rechazar devolucion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *DevolucionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrDevolucionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "devolucion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar devolucion")
		return
	}
	response.NoContent(w)
}
