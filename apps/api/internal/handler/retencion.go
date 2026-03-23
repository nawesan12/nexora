package handler

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pdf"
	"github.com/pronto-erp/pronto/internal/pkg/pagination"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type RetencionHandler struct {
	svc *service.RetencionService
}

func NewRetencionHandler(svc *service.RetencionService) *RetencionHandler {
	return &RetencionHandler{svc: svc}
}

func (h *RetencionHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	tipo := r.URL.Query().Get("tipo")
	entidadTipo := r.URL.Query().Get("entidad_tipo")
	periodo := r.URL.Query().Get("periodo")

	items, total, err := h.svc.List(r.Context(), userID, tipo, entidadTipo, periodo, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar retenciones")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *RetencionHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateRetencionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear retencion")
		return
	}
	response.Created(w, result)
}

func (h *RetencionHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrRetencionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "retencion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener retencion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RetencionHandler) Anular(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Anular(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrRetencionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "retencion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al anular retencion")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *RetencionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrRetencionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "retencion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar retencion")
		return
	}
	response.NoContent(w)
}

func (h *RetencionHandler) DownloadCertificate(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	info, err := h.svc.GetCertificateData(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrRetencionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "retencion no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener datos del certificado")
		return
	}

	data := pdf.RetencionCertificateData{
		CompanyName:       info.CompanyName,
		CompanyCUIT:       info.CompanyCUIT,
		CompanyAddress:    info.CompanyAddress,
		SujetoNombre:      info.SujetoNombre,
		SujetoCUIT:        info.SujetoCUIT,
		SujetoAddress:     info.SujetoAddress,
		NumeroCertificado: info.NumeroCertificado,
		Tipo:              info.Tipo,
		FechaRetencion:    info.FechaRetencion,
		Periodo:           info.Periodo,
		BaseImponible:     info.BaseImponible,
		Alicuota:          info.Alicuota,
		MontoRetenido:     info.MontoRetenido,
	}

	buf, err := pdf.GenerateRetencionCertificate(data)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar certificado PDF")
		return
	}

	filename := fmt.Sprintf("certificado-retencion-%s.pdf", id)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}
