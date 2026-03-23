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

type CotizacionHandler struct {
	svc *service.CotizacionService
}

func NewCotizacionHandler(svc *service.CotizacionService) *CotizacionHandler {
	return &CotizacionHandler{svc: svc}
}

func (h *CotizacionHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateCotizacionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

func (h *CotizacionHandler) GetRate(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	monedaOrigen := r.URL.Query().Get("moneda_origen")
	monedaDestino := r.URL.Query().Get("moneda_destino")
	fecha := r.URL.Query().Get("fecha")

	if monedaOrigen == "" || monedaDestino == "" || fecha == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "moneda_origen, moneda_destino, y fecha son requeridos")
		return
	}

	result, err := h.svc.GetRate(r.Context(), userID, monedaOrigen, monedaDestino, fecha)
	if errors.Is(err, service.ErrCotizacionNotFound) {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "cotizacion no encontrada para la fecha")
		return
	}
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *CotizacionHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *CotizacionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.NoContent(w)
}
