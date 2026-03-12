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

type FinanceHandler struct {
	cajaSvc         *service.CajaService
	chequeSvc       *service.ChequeService
	gastoSvc        *service.GastoService
	presupuestoSvc  *service.PresupuestoService
	comisionSvc     *service.ComisionService
	resumenSvc      *service.FinanceResumenService
}

func NewFinanceHandler(
	cajaSvc *service.CajaService,
	chequeSvc *service.ChequeService,
	gastoSvc *service.GastoService,
	presupuestoSvc *service.PresupuestoService,
	comisionSvc *service.ComisionService,
	resumenSvc *service.FinanceResumenService,
) *FinanceHandler {
	return &FinanceHandler{
		cajaSvc:        cajaSvc,
		chequeSvc:      chequeSvc,
		gastoSvc:       gastoSvc,
		presupuestoSvc: presupuestoSvc,
		comisionSvc:    comisionSvc,
		resumenSvc:     resumenSvc,
	}
}

// ==================== Cajas ====================

func (h *FinanceHandler) ListCajas(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.cajaSvc.ListCajas(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar cajas")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreateCaja(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateCajaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.cajaSvc.CreateCaja(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear caja")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetCaja(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.cajaSvc.GetCaja(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrCajaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "caja no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener caja")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateCaja(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateCajaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.cajaSvc.UpdateCaja(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrCajaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "caja no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar caja")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) DeleteCaja(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.cajaSvc.DeleteCaja(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar caja")
		return
	}
	response.NoContent(w)
}

// ==================== Movimientos ====================

func (h *FinanceHandler) CreateMovimiento(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateMovimientoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.cajaSvc.CreateMovimiento(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrCajaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "caja no encontrada")
			return
		}
		if errors.Is(err, service.ErrInsuficientBalance) {
			response.Error(w, http.StatusBadRequest, "INSUFFICIENT_BALANCE", "saldo insuficiente")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear movimiento")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) ListMovimientos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	cajaID := chi.URLParam(r, "id")
	params := pagination.Parse(r)

	items, total, err := h.cajaSvc.ListMovimientos(r.Context(), userID, cajaID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		if errors.Is(err, service.ErrCajaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "caja no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar movimientos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

// ==================== Arqueos ====================

func (h *FinanceHandler) CreateArqueo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateArqueoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.cajaSvc.CreateArqueo(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrCajaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "caja no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear arqueo")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) ListArqueos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	cajaID := chi.URLParam(r, "id")
	params := pagination.Parse(r)

	items, total, err := h.cajaSvc.ListArqueos(r.Context(), userID, cajaID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		if errors.Is(err, service.ErrCajaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "caja no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar arqueos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) UpdateArqueoEstado(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "arqueoId")

	var input service.UpdateArqueoEstadoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.cajaSvc.UpdateArqueoEstado(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrArqueoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "arqueo no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar estado del arqueo")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// ==================== Cheques ====================

func (h *FinanceHandler) ListCheques(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")
	estado := r.URL.Query().Get("estado")

	items, total, err := h.chequeSvc.ListCheques(r.Context(), userID, search, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar cheques")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreateCheque(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateChequeInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.chequeSvc.CreateCheque(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear cheque")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetCheque(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.chequeSvc.GetCheque(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrChequeNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cheque no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener cheque")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateCheque(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateChequeInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.chequeSvc.UpdateCheque(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrChequeNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cheque no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar cheque")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateChequeEstado(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.TransicionChequeInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.chequeSvc.UpdateChequeEstado(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrChequeNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cheque no encontrado")
			return
		}
		if errors.Is(err, service.ErrInvalidChequeTransition) {
			response.Error(w, http.StatusBadRequest, "INVALID_TRANSITION", "transición de estado inválida")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar estado del cheque")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// ==================== Gastos ====================

func (h *FinanceHandler) ListGastos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	categoria := r.URL.Query().Get("categoria")

	items, total, err := h.gastoSvc.ListGastos(r.Context(), userID, categoria, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar gastos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreateGasto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateGastoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.gastoSvc.CreateGasto(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear gasto")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetGasto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.gastoSvc.GetGasto(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrGastoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "gasto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener gasto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateGasto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateGastoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.gastoSvc.UpdateGasto(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrGastoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "gasto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar gasto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) DeleteGasto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.gastoSvc.DeleteGasto(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar gasto")
		return
	}
	response.NoContent(w)
}

// ==================== Gastos Recurrentes ====================

func (h *FinanceHandler) ListGastosRecurrentes(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.gastoSvc.ListGastosRecurrentes(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar gastos recurrentes")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreateGastoRecurrente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateGastoRecurrenteInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.gastoSvc.CreateGastoRecurrente(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear gasto recurrente")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetGastoRecurrente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.gastoSvc.GetGastoRecurrente(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrGastoRecurrenteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "gasto recurrente no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener gasto recurrente")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateGastoRecurrente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateGastoRecurrenteInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.gastoSvc.UpdateGastoRecurrente(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrGastoRecurrenteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "gasto recurrente no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar gasto recurrente")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) DeleteGastoRecurrente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.gastoSvc.DeleteGastoRecurrente(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar gasto recurrente")
		return
	}
	response.NoContent(w)
}

// ==================== Metodos de Pago ====================

func (h *FinanceHandler) ListMetodosPago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.gastoSvc.ListMetodosPago(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar métodos de pago")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreateMetodoPago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateMetodoPagoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.gastoSvc.CreateMetodoPago(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear método de pago")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetMetodoPago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.gastoSvc.GetMetodoPago(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrMetodoPagoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "método de pago no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener método de pago")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateMetodoPago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateMetodoPagoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.gastoSvc.UpdateMetodoPago(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrMetodoPagoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "método de pago no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar método de pago")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) DeleteMetodoPago(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.gastoSvc.DeleteMetodoPago(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar método de pago")
		return
	}
	response.NoContent(w)
}

// ==================== Presupuestos ====================

func (h *FinanceHandler) ListPresupuestos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	estado := r.URL.Query().Get("estado")

	items, total, err := h.presupuestoSvc.ListPresupuestos(r.Context(), userID, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar presupuestos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreatePresupuesto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreatePresupuestoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.presupuestoSvc.CreatePresupuesto(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear presupuesto")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetPresupuesto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.presupuestoSvc.GetPresupuesto(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrPresupuestoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "presupuesto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener presupuesto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdatePresupuesto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdatePresupuestoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.presupuestoSvc.UpdatePresupuesto(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrPresupuestoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "presupuesto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar presupuesto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) DeletePresupuesto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.presupuestoSvc.DeletePresupuesto(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar presupuesto")
		return
	}
	response.NoContent(w)
}

// ==================== Comisiones ====================

func (h *FinanceHandler) ListConfiguracionComisiones(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.comisionSvc.ListConfiguracionesComision(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar configuraciones de comisión")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreateConfiguracionComision(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateConfiguracionComisionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.comisionSvc.CreateConfiguracionComision(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear configuración de comisión")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetConfiguracionComision(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.comisionSvc.GetConfiguracionComision(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrConfigComisionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuración de comisión no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener configuración de comisión")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateConfiguracionComision(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateConfiguracionComisionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.comisionSvc.UpdateConfiguracionComision(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrConfigComisionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "configuración de comisión no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar configuración de comisión")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) DeleteConfiguracionComision(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.comisionSvc.DeleteConfiguracionComision(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar configuración de comisión")
		return
	}
	response.NoContent(w)
}

func (h *FinanceHandler) CreateComisionVendedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateComisionVendedorInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.comisionSvc.CreateComisionVendedor(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear comisión")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) ListComisionesVendedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	empleadoID := r.URL.Query().Get("empleado_id")

	items, total, err := h.comisionSvc.ListComisionesVendedor(r.Context(), userID, empleadoID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar comisiones")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

// ==================== Entidades Bancarias ====================

func (h *FinanceHandler) ListEntidadesBancarias(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.chequeSvc.ListEntidadesBancarias(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar entidades bancarias")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *FinanceHandler) CreateEntidadBancaria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateEntidadBancariaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.chequeSvc.CreateEntidadBancaria(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear entidad bancaria")
		return
	}
	response.Created(w, result)
}

func (h *FinanceHandler) GetEntidadBancaria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.chequeSvc.GetEntidadBancaria(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrEntidadBancariaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "entidad bancaria no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener entidad bancaria")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) UpdateEntidadBancaria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateEntidadBancariaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.chequeSvc.UpdateEntidadBancaria(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrEntidadBancariaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "entidad bancaria no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar entidad bancaria")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *FinanceHandler) DeleteEntidadBancaria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.chequeSvc.DeleteEntidadBancaria(r.Context(), userID, id); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar entidad bancaria")
		return
	}
	response.NoContent(w)
}

// ==================== Resumen ====================

func (h *FinanceHandler) GetResumen(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	resumen, err := h.resumenSvc.GetResumen(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener resumen financiero")
		return
	}

	response.JSON(w, http.StatusOK, resumen)
}
