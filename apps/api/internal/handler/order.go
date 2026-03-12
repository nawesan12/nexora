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

type OrderHandler struct {
	orderSvc *service.OrderService
	taxSvc   *service.TaxService
}

func NewOrderHandler(orderSvc *service.OrderService, taxSvc *service.TaxService) *OrderHandler {
	return &OrderHandler{orderSvc: orderSvc, taxSvc: taxSvc}
}

// --- Pedidos ---

func (h *OrderHandler) CreatePedido(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	role := claims.Role

	var input service.CreatePedidoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.orderSvc.CreatePedido(r.Context(), userID, role, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear pedido")
		return
	}
	response.Created(w, result)
}

func (h *OrderHandler) GetPedido(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.orderSvc.GetPedido(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrPedidoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pedido no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener pedido")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *OrderHandler) ListPedidos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")
	estado := r.URL.Query().Get("estado")

	items, total, err := h.orderSvc.ListPedidos(r.Context(), userID, search, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar pedidos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, int(total)))
}

func (h *OrderHandler) UpdatePedido(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.CreatePedidoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.orderSvc.UpdatePedido(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrPedidoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pedido no encontrado")
			return
		}
		if errors.Is(err, service.ErrPedidoNotEditable) {
			response.Error(w, http.StatusConflict, "NOT_EDITABLE", "el pedido no se puede editar en este estado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar pedido")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *OrderHandler) DeletePedido(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.orderSvc.DeletePedido(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrPedidoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pedido no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar pedido")
		return
	}
	response.NoContent(w)
}

func (h *OrderHandler) TransitionEstado(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	role := claims.Role
	id := chi.URLParam(r, "id")

	var input service.UpdateEstadoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.orderSvc.TransitionEstado(r.Context(), userID, id, role, input)
	if err != nil {
		if errors.Is(err, service.ErrPedidoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pedido no encontrado")
			return
		}
		if errors.Is(err, service.ErrInvalidTransition) {
			response.Error(w, http.StatusConflict, "INVALID_TRANSITION", err.Error())
			return
		}
		if errors.Is(err, service.ErrUnauthorizedTransition) {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al cambiar estado")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *OrderHandler) GetHistorial(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.orderSvc.GetHistorial(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrPedidoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pedido no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener historial")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// --- Tax Config ---

func (h *OrderHandler) ListConfigImpuestos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	result, err := h.taxSvc.ListConfigImpuestos(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar impuestos")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *OrderHandler) CreateConfigImpuesto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateConfigImpuestoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.taxSvc.CreateConfigImpuesto(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear impuesto")
		return
	}
	response.Created(w, result)
}

func (h *OrderHandler) UpdateConfigImpuesto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateConfigImpuestoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.taxSvc.UpdateConfigImpuesto(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrConfigImpuestoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "impuesto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar impuesto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *OrderHandler) DeleteConfigImpuesto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.taxSvc.DeleteConfigImpuesto(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrConfigImpuestoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "impuesto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar impuesto")
		return
	}
	response.NoContent(w)
}
