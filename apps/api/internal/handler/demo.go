package handler

import (
	"net/http"

	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/service"
)

// DemoHandler exposes the demo account seeder endpoint.
type DemoHandler struct {
	demoSvc *service.DemoService
}

// NewDemoHandler creates a new demo handler.
func NewDemoHandler(demoSvc *service.DemoService) *DemoHandler {
	return &DemoHandler{demoSvc: demoSvc}
}

// SeedDemo creates a demo account with sample data and returns the credentials.
func (h *DemoHandler) SeedDemo(w http.ResponseWriter, r *http.Request) {
	result, err := h.demoSvc.SeedDemoAccount(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "DEMO_SEED_ERROR", "error al crear cuenta demo: "+err.Error())
		return
	}

	response.JSON(w, http.StatusOK, result)
}
