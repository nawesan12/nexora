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

type EcommerceHandler struct {
	svc *service.EcommerceService
}

func NewEcommerceHandler(svc *service.EcommerceService) *EcommerceHandler {
	return &EcommerceHandler{svc: svc}
}

// --- Admin handlers (API client management) ---

func (h *EcommerceHandler) ListClients(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.ListClients(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar API clients")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, int(total)))
}

func (h *EcommerceHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateApiClientInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateClient(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear API client")
		return
	}
	response.Created(w, result)
}

func (h *EcommerceHandler) GetClient(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetClient(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrApiClientNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "API client no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener API client")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *EcommerceHandler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateApiClientInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateClient(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrApiClientNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "API client no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar API client")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *EcommerceHandler) DeleteClient(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteClient(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrApiClientNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "API client no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar API client")
		return
	}
	response.NoContent(w)
}

func (h *EcommerceHandler) RotateSecret(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.RotateSecret(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrApiClientNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "API client no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al rotar secret")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// --- Public API handlers (for external e-commerce access) ---

func (h *EcommerceHandler) PublicListProducts(w http.ResponseWriter, r *http.Request) {
	client := middleware.ApiClientFromContext(r.Context())
	if client == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")

	items, total, err := h.svc.ListProducts(r.Context(), client.UsuarioID, search, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar productos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, int(total)))
}

func (h *EcommerceHandler) PublicGetProduct(w http.ResponseWriter, r *http.Request) {
	client := middleware.ApiClientFromContext(r.Context())
	if client == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	id := chi.URLParam(r, "id")

	result, err := h.svc.GetProduct(r.Context(), client.UsuarioID, id)
	if err != nil {
		if errors.Is(err, service.ErrProductoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "producto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener producto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *EcommerceHandler) PublicGetInventoryMetrics(w http.ResponseWriter, r *http.Request) {
	client := middleware.ApiClientFromContext(r.Context())
	if client == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	result, err := h.svc.GetInventoryMetrics(r.Context(), client.UsuarioID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener metricas de inventario")
		return
	}
	response.JSON(w, http.StatusOK, result)
}
