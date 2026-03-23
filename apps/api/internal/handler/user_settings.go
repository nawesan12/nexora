package handler

import (
	"encoding/json"
	"net/http"

	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/service"
)

type UserSettingsHandler struct {
	svc *service.UserSettingsService
}

func NewUserSettingsHandler(svc *service.UserSettingsService) *UserSettingsHandler {
	return &UserSettingsHandler{svc: svc}
}

func (h *UserSettingsHandler) GetDashboardLayout(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	layout, err := h.svc.GetDashboardLayout(r.Context(), userID)
	if err != nil {
		response.JSON(w, http.StatusOK, json.RawMessage(`{}`))
		return
	}
	response.JSON(w, http.StatusOK, layout)
}

func (h *UserSettingsHandler) SaveDashboardLayout(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var layout json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&layout); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", "invalid request body")
		return
	}

	if err := h.svc.SaveDashboardLayout(r.Context(), userID, layout); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error saving layout")
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"saved": true})
}
