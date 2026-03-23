package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/pagination"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type ConversionHandler struct {
	svc *service.ConversionService
}

func NewConversionHandler(svc *service.ConversionService) *ConversionHandler {
	return &ConversionHandler{svc: svc}
}

func (h *ConversionHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar conversiones")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ConversionHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateConversionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	response.Created(w, result)
}

func (h *ConversionHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateConversionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Update(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrConversionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "conversion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar conversion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ConversionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrConversionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "conversion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar conversion")
		return
	}
	response.NoContent(w)
}

func (h *ConversionHandler) Convert(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	fromUnit := r.URL.Query().Get("from")
	toUnit := r.URL.Query().Get("to")
	qtyStr := r.URL.Query().Get("qty")

	if fromUnit == "" || toUnit == "" || qtyStr == "" {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "from, to and qty query params are required")
		return
	}

	qty, err := strconv.ParseFloat(qtyStr, 64)
	if err != nil || qty <= 0 {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "qty must be a positive number")
		return
	}

	result, err := h.svc.Convert(r.Context(), userID, fromUnit, toUnit, qty)
	if err != nil {
		if errors.Is(err, service.ErrConversionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "conversion no encontrada para estas unidades")
			return
		}
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}
