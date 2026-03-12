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

type InvoiceHandler struct {
	invoiceSvc *service.InvoiceService
}

func NewInvoiceHandler(invoiceSvc *service.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{invoiceSvc: invoiceSvc}
}

func (h *InvoiceHandler) CreateFromPedido(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateFromPedidoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.invoiceSvc.CreateFromPedido(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrPedidoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pedido no encontrado")
			return
		}
		if errors.Is(err, service.ErrPedidoNotInvoiceable) {
			response.Error(w, http.StatusConflict, "NOT_INVOICEABLE", "el pedido no se puede facturar en este estado")
			return
		}
		if errors.Is(err, service.ErrComprobanteAlreadyExists) {
			response.Error(w, http.StatusConflict, "ALREADY_EXISTS", "ya existe una factura para este pedido")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear factura")
		return
	}
	response.Created(w, result)
}

func (h *InvoiceHandler) CreateManual(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateManualInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.invoiceSvc.CreateManual(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear factura")
		return
	}
	response.Created(w, result)
}

func (h *InvoiceHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")
	estado := r.URL.Query().Get("estado")
	clienteID := r.URL.Query().Get("cliente_id")

	items, total, err := h.invoiceSvc.List(r.Context(), userID, search, estado, clienteID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar facturas")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, int(total)))
}

func (h *InvoiceHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.invoiceSvc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrComprobanteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "factura no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener factura")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *InvoiceHandler) Emit(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.invoiceSvc.Emit(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrComprobanteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "factura no encontrada")
			return
		}
		if errors.Is(err, service.ErrInvalidComprobanteTransition) {
			response.Error(w, http.StatusConflict, "INVALID_TRANSITION", "solo se puede emitir una factura en estado BORRADOR")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al emitir factura")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *InvoiceHandler) Void(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.invoiceSvc.Void(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrComprobanteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "factura no encontrada")
			return
		}
		if errors.Is(err, service.ErrInvalidComprobanteTransition) {
			response.Error(w, http.StatusConflict, "INVALID_TRANSITION", "solo se puede anular una factura en estado EMITIDO")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al anular factura")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *InvoiceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.invoiceSvc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrComprobanteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "factura no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar factura")
		return
	}
	response.NoContent(w)
}
