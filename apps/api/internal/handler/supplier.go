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

type SupplierHandler struct {
	svc *service.ProveedorService
}

func NewSupplierHandler(svc *service.ProveedorService) *SupplierHandler {
	return &SupplierHandler{svc: svc}
}

func (h *SupplierHandler) ListProveedores(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")

	items, total, err := h.svc.ListProveedores(r.Context(), userID, search, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar proveedores")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *SupplierHandler) CreateProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateProveedorInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateProveedor(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrProveedorDuplicateCuit) {
			response.Error(w, http.StatusConflict, "CUIT_DUPLICADO", "ya existe un proveedor con ese CUIT")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear proveedor")
		return
	}
	response.Created(w, result)
}

func (h *SupplierHandler) GetProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetProveedor(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "proveedor no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener proveedor")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SupplierHandler) UpdateProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateProveedorInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateProveedor(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "proveedor no encontrado")
			return
		}
		if errors.Is(err, service.ErrProveedorDuplicateCuit) {
			response.Error(w, http.StatusConflict, "CUIT_DUPLICADO", "ya existe un proveedor con ese CUIT")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar proveedor")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SupplierHandler) DeleteProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteProveedor(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "proveedor no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar proveedor")
		return
	}
	response.NoContent(w)
}
