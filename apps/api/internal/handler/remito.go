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

type RemitoHandler struct {
	svc *service.RemitoService
}

func NewRemitoHandler(svc *service.RemitoService) *RemitoHandler {
	return &RemitoHandler{svc: svc}
}

func (h *RemitoHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	estado := r.URL.Query().Get("estado")

	items, total, err := h.svc.List(r.Context(), userID, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar remitos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *RemitoHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateRemitoFromPedidoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateFromPedido(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear remito")
		return
	}
	response.Created(w, result)
}

func (h *RemitoHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrRemitoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "remito no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener remito")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RemitoHandler) Emitir(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Emitir(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrRemitoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "remito no encontrado")
			return
		}
		if errors.Is(err, service.ErrInvalidRemitoTransition) {
			response.Error(w, http.StatusBadRequest, "INVALID_TRANSITION", err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al emitir remito")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RemitoHandler) Entregar(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.EntregarRemitoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.MarkAsEntregado(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrRemitoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "remito no encontrado")
			return
		}
		if errors.Is(err, service.ErrInvalidRemitoTransition) {
			response.Error(w, http.StatusBadRequest, "INVALID_TRANSITION", err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al marcar remito como entregado")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RemitoHandler) Anular(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Anular(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrRemitoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "remito no encontrado")
			return
		}
		if errors.Is(err, service.ErrInvalidRemitoTransition) {
			response.Error(w, http.StatusBadRequest, "INVALID_TRANSITION", err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al anular remito")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RemitoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrRemitoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "remito no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar remito")
		return
	}
	response.NoContent(w)
}
