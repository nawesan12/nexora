package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/pagination"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type TransferHandler struct {
	svc *service.TransferService
}

func NewTransferHandler(svc *service.TransferService) *TransferHandler {
	return &TransferHandler{svc: svc}
}

func (h *TransferHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateTransferenciaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, "", input)
	if err != nil {
		if errors.Is(err, service.ErrTransferenciaMismaSucursal) {
			response.Error(w, http.StatusBadRequest, "SAME_BRANCH", "las sucursales de origen y destino deben ser diferentes")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear transferencia")
		return
	}
	response.Created(w, result)
}

func (h *TransferHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrTransferenciaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "transferencia no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener transferencia")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *TransferHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	estado := r.URL.Query().Get("estado")

	items, total, err := h.svc.List(r.Context(), userID, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar transferencias")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *TransferHandler) Transition(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	role := claims.Role
	id := chi.URLParam(r, "id")

	var input service.TransferTransitionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Transition(r.Context(), userID, role, "", id, input)
	if err != nil {
		if errors.Is(err, service.ErrTransferenciaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "transferencia no encontrada")
			return
		}
		if errors.Is(err, service.ErrInvalidTransferTransition) {
			response.Error(w, http.StatusBadRequest, "INVALID_TRANSITION", err.Error())
			return
		}
		if errors.Is(err, service.ErrUnauthorizedTransfer) {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", err.Error())
			return
		}
		if errors.Is(err, service.ErrStockInsuficiente) {
			response.Error(w, http.StatusConflict, "STOCK_INSUFICIENTE", "stock insuficiente")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al cambiar estado de transferencia")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *TransferHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrTransferenciaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "transferencia no encontrada")
			return
		}
		if errors.Is(err, service.ErrTransferenciaNotEditable) {
			response.Error(w, http.StatusBadRequest, "NOT_EDITABLE", "solo se pueden eliminar transferencias pendientes")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar transferencia")
		return
	}
	response.NoContent(w)
}
