package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
)

type VariantHandler struct {
	svc *service.VariantService
}

func NewVariantHandler(svc *service.VariantService) *VariantHandler {
	return &VariantHandler{svc: svc}
}

func (h *VariantHandler) ListVariantes(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	productoID := chi.URLParam(r, "productoId")

	items, err := h.svc.ListVariantes(r.Context(), userID, productoID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar variantes")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *VariantHandler) CreateVariante(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	productoID := chi.URLParam(r, "productoId")

	var input service.CreateVarianteInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}
	input.ProductoID = productoID

	result, err := h.svc.CreateVariante(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear variante")
		return
	}
	response.Created(w, result)
}

func (h *VariantHandler) DeleteVariante(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteVariante(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrVarianteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "variante no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar variante")
		return
	}
	response.NoContent(w)
}

func (h *VariantHandler) ListOpciones(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	varianteID := chi.URLParam(r, "id")

	items, err := h.svc.ListOpciones(r.Context(), userID, varianteID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar opciones")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *VariantHandler) CreateOpcion(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	varianteID := chi.URLParam(r, "id")

	var input service.CreateOpcionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}
	input.VarianteID = varianteID

	result, err := h.svc.CreateOpcion(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear opcion")
		return
	}
	response.Created(w, result)
}

func (h *VariantHandler) DeleteOpcion(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	opcionID := chi.URLParam(r, "opcionId")

	if err := h.svc.DeleteOpcion(r.Context(), userID, opcionID); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar opcion")
		return
	}
	response.NoContent(w)
}

func (h *VariantHandler) ListSKUs(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	productoID := chi.URLParam(r, "productoId")

	items, err := h.svc.ListSKUs(r.Context(), userID, productoID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar SKUs")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *VariantHandler) CreateSKU(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	productoID := chi.URLParam(r, "productoId")

	var input service.CreateSKUInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}
	input.ProductoID = productoID

	result, err := h.svc.CreateSKU(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear SKU")
		return
	}
	response.Created(w, result)
}

func (h *VariantHandler) UpdateSKU(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateSKUInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateSKU(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrSKUNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "SKU no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar SKU")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *VariantHandler) DeleteSKU(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteSKU(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrSKUNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "SKU no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar SKU")
		return
	}
	response.NoContent(w)
}
