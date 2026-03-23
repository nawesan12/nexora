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

type VisitaHandler struct {
	svc *service.VisitaService
}

func NewVisitaHandler(svc *service.VisitaService) *VisitaHandler {
	return &VisitaHandler{svc: svc}
}

func (h *VisitaHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	vendedorID := r.URL.Query().Get("vendedor_id")
	fechaDesde := r.URL.Query().Get("fecha_desde")
	fechaHasta := r.URL.Query().Get("fecha_hasta")
	resultado := r.URL.Query().Get("resultado")

	items, total, err := h.svc.List(r.Context(), userID, vendedorID, fechaDesde, fechaHasta, resultado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar visitas")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *VisitaHandler) ListToday(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	vendedorID := r.URL.Query().Get("vendedor_id")
	if vendedorID == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "vendedor_id es requerido")
		return
	}

	items, err := h.svc.ListToday(r.Context(), userID, vendedorID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar visitas de hoy")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *VisitaHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrVisitaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "visita no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener visita")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *VisitaHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateVisitaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear visita")
		return
	}
	response.Created(w, result)
}

func (h *VisitaHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateVisitaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Update(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrVisitaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "visita no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar visita")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *VisitaHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrVisitaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "visita no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar visita")
		return
	}
	response.NoContent(w)
}
