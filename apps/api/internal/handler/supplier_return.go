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

type SupplierReturnHandler struct {
	svc *service.SupplierReturnService
}

func NewSupplierReturnHandler(svc *service.SupplierReturnService) *SupplierReturnHandler {
	return &SupplierReturnHandler{svc: svc}
}

func (h *SupplierReturnHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar devoluciones a proveedor")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *SupplierReturnHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrDevolucionProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "devolucion a proveedor no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener devolucion a proveedor")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SupplierReturnHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateDevolucionProveedorInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear devolucion a proveedor")
		return
	}
	response.Created(w, result)
}

func (h *SupplierReturnHandler) Transition(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.TransitionDevolucionProveedorInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Transition(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrDevolucionProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "devolucion a proveedor no encontrada")
			return
		}
		if errors.Is(err, service.ErrInvalidDevolucionProveedorTransition) {
			response.Error(w, http.StatusBadRequest, "INVALID_TRANSITION", err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al transicionar devolucion a proveedor")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SupplierReturnHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrDevolucionProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "devolucion a proveedor no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar devolucion a proveedor")
		return
	}
	response.NoContent(w)
}
