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

type LoteHandler struct {
	svc *service.LoteService
}

func NewLoteHandler(svc *service.LoteService) *LoteHandler {
	return &LoteHandler{svc: svc}
}

func (h *LoteHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	productoID := r.URL.Query().Get("producto_id")
	sucursalID := r.URL.Query().Get("sucursal_id")

	items, total, err := h.svc.List(r.Context(), userID, productoID, sucursalID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar lotes")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *LoteHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrLoteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lote no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener lote")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LoteHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateLoteInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear lote")
		return
	}
	response.Created(w, result)
}

func (h *LoteHandler) AjustarStock(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.AjustarStockInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.AjustarStock(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrLoteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lote no encontrado")
			return
		}
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LoteHandler) Alertas(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	dias := 30
	if d := r.URL.Query().Get("dias"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			dias = parsed
		}
	}

	items, err := h.svc.GetAlertasVencimiento(r.Context(), userID, dias)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener alertas de vencimiento")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *LoteHandler) FIFO(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	productoID := r.URL.Query().Get("producto_id")
	sucursalID := r.URL.Query().Get("sucursal_id")
	cantidadStr := r.URL.Query().Get("cantidad")

	if productoID == "" || sucursalID == "" || cantidadStr == "" {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "producto_id, sucursal_id y cantidad son requeridos")
		return
	}

	cantidad, err := strconv.ParseFloat(cantidadStr, 64)
	if err != nil || cantidad <= 0 {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "cantidad debe ser un numero positivo")
		return
	}

	items, err := h.svc.GetLotesFIFO(r.Context(), userID, productoID, sucursalID, cantidad)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener lotes FIFO")
		return
	}
	response.JSON(w, http.StatusOK, items)
}
