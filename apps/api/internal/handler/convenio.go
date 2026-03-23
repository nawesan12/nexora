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

type ConvenioHandler struct {
	svc *service.ConvenioService
}

func NewConvenioHandler(svc *service.ConvenioService) *ConvenioHandler {
	return &ConvenioHandler{svc: svc}
}

func (h *ConvenioHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateConvenioInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear convenio")
		return
	}
	response.Created(w, result)
}

func (h *ConvenioHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrConvenioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "convenio no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener convenio")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ConvenioHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar convenios")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ConvenioHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.CreateConvenioInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Update(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrConvenioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "convenio no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar convenio")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ConvenioHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrConvenioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "convenio no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar convenio")
		return
	}
	response.NoContent(w)
}
