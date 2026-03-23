package handler

import (
	"net/http"
	"regexp"

	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/service"
)

var periodoRegex = regexp.MustCompile(`^\d{4}-(0[1-9]|1[0-2])$`)

type TaxReportHandler struct {
	svc *service.TaxReportService
}

func NewTaxReportHandler(svc *service.TaxReportService) *TaxReportHandler {
	return &TaxReportHandler{svc: svc}
}

func (h *TaxReportHandler) LibroIVAVentas(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	periodo := r.URL.Query().Get("periodo")
	if !periodoRegex.MatchString(periodo) {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "periodo debe tener formato YYYY-MM")
		return
	}

	entries, err := h.svc.LibroIVAVentas(r.Context(), userID, periodo)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar libro IVA ventas")
		return
	}
	response.JSON(w, http.StatusOK, entries)
}

func (h *TaxReportHandler) LibroIVACompras(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	periodo := r.URL.Query().Get("periodo")
	if !periodoRegex.MatchString(periodo) {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "periodo debe tener formato YYYY-MM")
		return
	}

	entries, err := h.svc.LibroIVACompras(r.Context(), userID, periodo)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar libro IVA compras")
		return
	}
	response.JSON(w, http.StatusOK, entries)
}

func (h *TaxReportHandler) ResumenIIBB(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	periodo := r.URL.Query().Get("periodo")
	if !periodoRegex.MatchString(periodo) {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "periodo debe tener formato YYYY-MM")
		return
	}

	entries, err := h.svc.ResumenIIBB(r.Context(), userID, periodo)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar resumen IIBB")
		return
	}
	response.JSON(w, http.StatusOK, entries)
}

func (h *TaxReportHandler) ResumenRetenciones(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	periodo := r.URL.Query().Get("periodo")
	if !periodoRegex.MatchString(periodo) {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "periodo debe tener formato YYYY-MM")
		return
	}

	entries, err := h.svc.ResumenRetenciones(r.Context(), userID, periodo)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar resumen retenciones")
		return
	}
	response.JSON(w, http.StatusOK, entries)
}

func (h *TaxReportHandler) ExportCITIVentas(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	periodo := r.URL.Query().Get("periodo")
	if !periodoRegex.MatchString(periodo) {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "periodo debe tener formato YYYY-MM")
		return
	}

	data, err := h.svc.ExportCITIVentas(r.Context(), userID, periodo)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar CITI ventas")
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=CITI_VENTAS_"+periodo+".txt")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (h *TaxReportHandler) ExportCITICompras(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	periodo := r.URL.Query().Get("periodo")
	if !periodoRegex.MatchString(periodo) {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "periodo debe tener formato YYYY-MM")
		return
	}

	data, err := h.svc.ExportCITICompras(r.Context(), userID, periodo)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar CITI compras")
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=CITI_COMPRAS_"+periodo+".txt")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}
