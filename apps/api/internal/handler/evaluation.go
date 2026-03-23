package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/pagination"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type EvaluationHandler struct {
	svc *service.EvaluationService
}

func NewEvaluationHandler(svc *service.EvaluationService) *EvaluationHandler {
	return &EvaluationHandler{svc: svc}
}

func (h *EvaluationHandler) CreateEvaluacion(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateEvaluacionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateEvaluacion(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear evaluacion")
		return
	}
	response.Created(w, result)
}

func (h *EvaluationHandler) ListByProveedor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	proveedorID := r.URL.Query().Get("proveedor_id")
	if proveedorID == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "proveedor_id is required")
		return
	}

	items, total, err := h.svc.ListByProveedor(r.Context(), userID, proveedorID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar evaluaciones")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, int(total)))
}

func (h *EvaluationHandler) GetPromedio(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	proveedorID := chi.URLParam(r, "proveedorId")

	result, err := h.svc.GetPromedio(r.Context(), userID, proveedorID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener promedio")
		return
	}
	response.JSON(w, http.StatusOK, result)
}
