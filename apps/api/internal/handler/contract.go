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

type ContractHandler struct {
	svc *service.ContractService
}

func NewContractHandler(svc *service.ContractService) *ContractHandler {
	return &ContractHandler{svc: svc}
}

func (h *ContractHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	empleadoID := chi.URLParam(r, "id")
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, empleadoID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar contratos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ContractHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	empleadoID := chi.URLParam(r, "id")

	var input service.CreateContratoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, empleadoID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear contrato")
		return
	}
	response.Created(w, result)
}

func (h *ContractHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	contratoID := chi.URLParam(r, "contratoId")

	result, err := h.svc.Get(r.Context(), userID, contratoID)
	if err != nil {
		if errors.Is(err, service.ErrContratoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "contrato no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener contrato")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ContractHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	contratoID := chi.URLParam(r, "contratoId")

	var input service.UpdateContratoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Update(r.Context(), userID, contratoID, input)
	if err != nil {
		if errors.Is(err, service.ErrContratoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "contrato no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar contrato")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ContractHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	contratoID := chi.URLParam(r, "contratoId")

	if err := h.svc.Delete(r.Context(), userID, contratoID); err != nil {
		if errors.Is(err, service.ErrContratoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "contrato no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar contrato")
		return
	}
	response.NoContent(w)
}
