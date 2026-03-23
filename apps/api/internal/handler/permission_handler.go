package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/service"
)

type PermissionHandler struct {
	svc *service.PermissionService
}

func NewPermissionHandler(svc *service.PermissionService) *PermissionHandler {
	return &PermissionHandler{svc: svc}
}

func (h *PermissionHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	userID := middleware.PgUserID(claims)
	result, err := h.svc.GetAllRolesPermissions(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *PermissionHandler) GetForRole(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	rol := chi.URLParam(r, "rol")
	userID := middleware.PgUserID(claims)
	result, err := h.svc.GetRolePermissions(r.Context(), userID, rol)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ROLE", err.Error())
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func (h *PermissionHandler) UpdateForRole(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	rol := chi.URLParam(r, "rol")

	var input service.UpdateRolePermissionsInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", "JSON inválido")
		return
	}

	userID := middleware.PgUserID(claims)
	if err := h.svc.UpdateRolePermissions(r.Context(), userID, rol, input.Permissions); err != nil {
		response.Error(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	response.JSON(w, http.StatusOK, response.Map{"message": "permisos actualizados"})
}

func (h *PermissionHandler) ResetForRole(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	rol := chi.URLParam(r, "rol")
	userID := middleware.PgUserID(claims)
	if err := h.svc.ResetRolePermissions(r.Context(), userID, rol); err != nil {
		response.Error(w, http.StatusBadRequest, "RESET_ERROR", err.Error())
		return
	}

	response.JSON(w, http.StatusOK, response.Map{"message": "permisos restablecidos a los valores por defecto"})
}
