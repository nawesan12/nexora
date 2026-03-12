package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type BranchHandler struct {
	svc *service.BranchService
}

func NewBranchHandler(svc *service.BranchService) *BranchHandler {
	return &BranchHandler{svc: svc}
}

func (h *BranchHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	items, total, err := h.svc.List(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar sucursales")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, response.Map{
		"page": 1, "pageSize": total, "total": total, "totalPages": 1,
	})
}

func (h *BranchHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrBranchNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "sucursal no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener sucursal")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *BranchHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateBranchInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear sucursal")
		return
	}
	response.Created(w, result)
}

func (h *BranchHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateBranchInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Update(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrBranchNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "sucursal no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar sucursal")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *BranchHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrBranchNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "sucursal no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar sucursal")
		return
	}
	response.NoContent(w)
}
