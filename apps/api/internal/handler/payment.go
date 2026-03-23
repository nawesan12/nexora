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

type PaymentHandler struct {
	paymentSvc         *service.PaymentService
	supplierPaymentSvc *service.SupplierPaymentService
}

func NewPaymentHandler(paymentSvc *service.PaymentService, supplierPaymentSvc *service.SupplierPaymentService) *PaymentHandler {
	return &PaymentHandler{
		paymentSvc:         paymentSvc,
		supplierPaymentSvc: supplierPaymentSvc,
	}
}

// ==================== Client Payments ====================

func (h *PaymentHandler) ListPagos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")

	items, total, err := h.paymentSvc.ListPagos(r.Context(), userID, search, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar pagos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *PaymentHandler) CreatePago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreatePagoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.paymentSvc.CreatePago(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrComprobanteNoDeuda) {
			response.Error(w, http.StatusBadRequest, "COMPROBANTE_NO_DEUDA", "el comprobante no tiene deuda pendiente")
			return
		}
		if errors.Is(err, service.ErrMontoExceedsDebt) {
			response.Error(w, http.StatusBadRequest, "MONTO_EXCEEDS_DEBT", "el monto aplicado excede la deuda pendiente")
			return
		}
		if errors.Is(err, service.ErrCreditLimitExceeded) {
			response.Error(w, http.StatusBadRequest, "CREDIT_LIMIT_EXCEEDED", "se excede el límite de crédito del cliente")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear pago")
		return
	}
	response.Created(w, result)
}

func (h *PaymentHandler) GetPago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.paymentSvc.GetPago(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrPagoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pago no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener pago")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PaymentHandler) AnularPago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	err := h.paymentSvc.AnularPago(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrPagoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pago no encontrado")
			return
		}
		if errors.Is(err, service.ErrPagoAlreadyAnulado) {
			response.Error(w, http.StatusBadRequest, "ALREADY_ANULADO", "el pago ya está anulado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al anular pago")
		return
	}
	response.NoContent(w)
}

func (h *PaymentHandler) GetAgingReport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	result, err := h.paymentSvc.GetAgingReport(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener reporte de antigüedad")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PaymentHandler) GetClienteBalance(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")

	result, err := h.paymentSvc.GetClienteBalance(r.Context(), userID, clienteID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener balance del cliente")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PaymentHandler) UpdateClienteLimiteCredito(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")

	var input service.UpdateLimiteCreditoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	err := h.paymentSvc.UpdateClienteLimiteCredito(r.Context(), userID, clienteID, input.LimiteCredito)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar límite de crédito")
		return
	}
	response.NoContent(w)
}

func (h *PaymentHandler) ListComprobantesConDeuda(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")
	params := pagination.Parse(r)

	items, total, err := h.paymentSvc.ListComprobantesConDeuda(r.Context(), userID, clienteID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar comprobantes con deuda")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

// ==================== Supplier Payments ====================

func (h *PaymentHandler) ListPagosProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")

	items, total, err := h.supplierPaymentSvc.ListPagos(r.Context(), userID, search, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar pagos a proveedores")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *PaymentHandler) CreatePagoProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreatePagoProveedorInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.supplierPaymentSvc.CreatePago(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrOrdenCompraNoDeuda) {
			response.Error(w, http.StatusBadRequest, "OC_NO_DEUDA", "la orden de compra no tiene deuda pendiente")
			return
		}
		if errors.Is(err, service.ErrMontoExceedsOCDebt) {
			response.Error(w, http.StatusBadRequest, "MONTO_EXCEEDS_DEBT", "el monto aplicado excede la deuda pendiente de la OC")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear pago a proveedor")
		return
	}
	response.Created(w, result)
}

func (h *PaymentHandler) GetPagoProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.supplierPaymentSvc.GetPago(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrPagoProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pago a proveedor no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener pago a proveedor")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PaymentHandler) AnularPagoProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	err := h.supplierPaymentSvc.AnularPago(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrPagoProveedorNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "pago a proveedor no encontrado")
			return
		}
		if errors.Is(err, service.ErrPagoProvAlreadyAnulado) {
			response.Error(w, http.StatusBadRequest, "ALREADY_ANULADO", "el pago a proveedor ya está anulado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al anular pago a proveedor")
		return
	}
	response.NoContent(w)
}
