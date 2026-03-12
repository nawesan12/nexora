package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/pagination"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type PurchaseHandler struct {
	svc *service.PurchaseService
}

func NewPurchaseHandler(svc *service.PurchaseService) *PurchaseHandler {
	return &PurchaseHandler{svc: svc}
}

func (h *PurchaseHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")
	estado := r.URL.Query().Get("estado")

	items, total, err := h.svc.ListOrdenesCompra(r.Context(), userID, search, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar órdenes de compra")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, int(total)))
}

func (h *PurchaseHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateOrdenCompraInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateOrdenCompra(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear orden de compra")
		return
	}
	response.Created(w, result)
}

func (h *PurchaseHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetOrdenCompra(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrOrdenCompraNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "orden de compra no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener orden de compra")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PurchaseHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.CreateOrdenCompraInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateOrdenCompra(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrOrdenCompraNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "orden de compra no encontrada")
			return
		}
		if errors.Is(err, service.ErrOrdenCompraNotEditable) {
			response.Error(w, http.StatusConflict, "NOT_EDITABLE", "la orden de compra no se puede editar en este estado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar orden de compra")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PurchaseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteOrdenCompra(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrOrdenCompraNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "orden de compra no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar orden de compra")
		return
	}
	response.NoContent(w)
}

func (h *PurchaseHandler) Approve(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateOrdenCompraEstadoInput
	_ = json.NewDecoder(r.Body).Decode(&input)
	input.Estado = "APROBADA"

	result, err := h.svc.TransitionEstado(r.Context(), userID, id, input)
	if err != nil {
		h.handleTransitionError(w, err, "error al aprobar orden de compra")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PurchaseHandler) Receive(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.ReceiveInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.ReceiveOrdenCompra(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrOrdenCompraNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "orden de compra no encontrada")
			return
		}
		if errors.Is(err, service.ErrInvalidOrdenCompraTransition) {
			response.Error(w, http.StatusConflict, "INVALID_TRANSITION", err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al recibir orden de compra")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PurchaseHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateOrdenCompraEstadoInput
	_ = json.NewDecoder(r.Body).Decode(&input)
	input.Estado = "CANCELADA"

	result, err := h.svc.TransitionEstado(r.Context(), userID, id, input)
	if err != nil {
		h.handleTransitionError(w, err, "error al cancelar orden de compra")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PurchaseHandler) GetHistorial(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetHistorial(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrOrdenCompraNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "orden de compra no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener historial")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PurchaseHandler) handleTransitionError(w http.ResponseWriter, err error, fallbackMsg string) {
	if errors.Is(err, service.ErrOrdenCompraNotFound) {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "orden de compra no encontrada")
		return
	}
	if errors.Is(err, service.ErrOrdenCompraNotEditable) {
		response.Error(w, http.StatusConflict, "NOT_EDITABLE", "la orden de compra no se puede editar en este estado")
		return
	}
	if errors.Is(err, service.ErrInvalidOrdenCompraTransition) {
		response.Error(w, http.StatusConflict, "INVALID_TRANSITION", err.Error())
		return
	}
	response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", fallbackMsg)
}
