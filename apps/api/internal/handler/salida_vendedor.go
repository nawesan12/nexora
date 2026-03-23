package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/pagination"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type SalidaVendedorHandler struct {
	svc *service.SalidaVendedorService
}

func NewSalidaVendedorHandler(svc *service.SalidaVendedorService) *SalidaVendedorHandler {
	return &SalidaVendedorHandler{svc: svc}
}

func (h *SalidaVendedorHandler) ListByFecha(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	fecha := r.URL.Query().Get("fecha")
	if fecha == "" {
		fecha = time.Now().Format("2006-01-02")
	}

	empleadoID := r.URL.Query().Get("empleado_id")
	if empleadoID != "" {
		items, total, err := h.svc.ListByEmpleado(r.Context(), userID, empleadoID, int32(params.PageSize), int32(params.Offset))
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar salidas")
			return
		}
		response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
		return
	}

	items, total, err := h.svc.ListByFecha(r.Context(), userID, fecha, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar salidas")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *SalidaVendedorHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrSalidaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "salida no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener salida")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SalidaVendedorHandler) RegistrarSalida(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.RegistrarSalidaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.RegistrarSalida(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al registrar salida")
		return
	}
	response.Created(w, result)
}

func (h *SalidaVendedorHandler) RegistrarRegreso(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.RegistrarRegresoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.RegistrarRegreso(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrSalidaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "salida no encontrada o no esta en campo")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al registrar regreso")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *SalidaVendedorHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrSalidaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "salida no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar salida")
		return
	}
	response.NoContent(w)
}
