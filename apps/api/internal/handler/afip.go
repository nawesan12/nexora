package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type AfipHandler struct {
	afipSvc    *service.AfipService
	invoiceSvc *service.InvoiceService
}

func NewAfipHandler(afipSvc *service.AfipService, invoiceSvc *service.InvoiceService) *AfipHandler {
	return &AfipHandler{afipSvc: afipSvc, invoiceSvc: invoiceSvc}
}

func (h *AfipHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	sucursalID := chi.URLParam(r, "sucursalId")

	result, err := h.afipSvc.GetConfig(r.Context(), userID, sucursalID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener configuracion AFIP")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *AfipHandler) SaveConfig(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	sucursalID := chi.URLParam(r, "sucursalId")

	var input service.SaveAfipConfigInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.afipSvc.SaveConfig(r.Context(), userID, sucursalID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al guardar configuracion AFIP")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *AfipHandler) TestConnection(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	sucursalID := chi.URLParam(r, "sucursalId")

	result, err := h.afipSvc.TestConnection(r.Context(), userID, sucursalID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al probar conexion AFIP")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *AfipHandler) AuthorizeInvoice(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.afipSvc.AuthorizeInvoice(r.Context(), userID, id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al autorizar factura en AFIP")
		return
	}
	response.JSON(w, http.StatusOK, result)
}
