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

type SupplierInvoiceHandler struct {
	svc *service.SupplierInvoiceService
}

func NewSupplierInvoiceHandler(svc *service.SupplierInvoiceService) *SupplierInvoiceHandler {
	return &SupplierInvoiceHandler{svc: svc}
}

func (h *SupplierInvoiceHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar facturas de proveedor")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *SupplierInvoiceHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrFacturaProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "factura de proveedor no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener factura de proveedor")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SupplierInvoiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateFacturaProveedorInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear factura de proveedor")
		return
	}
	response.Created(w, result)
}

func (h *SupplierInvoiceHandler) Anular(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Anular(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrFacturaProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "factura de proveedor no encontrada")
			return
		}
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SupplierInvoiceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrFacturaProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "factura de proveedor no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar factura de proveedor")
		return
	}
	response.NoContent(w)
}
