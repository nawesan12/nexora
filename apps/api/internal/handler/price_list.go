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

type PriceListHandler struct {
	svc *service.PriceListService
}

func NewPriceListHandler(svc *service.PriceListService) *PriceListHandler {
	return &PriceListHandler{svc: svc}
}

func (h *PriceListHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.List(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar listas de precios")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *PriceListHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateListaPrecioInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Create(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear lista de precios")
		return
	}
	response.Created(w, result)
}

func (h *PriceListHandler) Get(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.Get(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrListaPrecioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lista de precios no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener lista de precios")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PriceListHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateListaPrecioInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.Update(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrListaPrecioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lista de precios no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar lista de precios")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PriceListHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrListaPrecioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lista de precios no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar lista de precios")
		return
	}
	response.NoContent(w)
}

// --- Precios within a lista ---

func (h *PriceListHandler) ListPrecios(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	listaID := chi.URLParam(r, "id")

	items, err := h.svc.ListPrecios(r.Context(), userID, listaID)
	if err != nil {
		if errors.Is(err, service.ErrListaPrecioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lista de precios no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar precios")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *PriceListHandler) UpsertPrecio(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	listaID := chi.URLParam(r, "id")

	var input service.UpsertPrecioInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpsertPrecio(r.Context(), userID, listaID, input)
	if err != nil {
		if errors.Is(err, service.ErrListaPrecioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lista de precios no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al guardar precio")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *PriceListHandler) DeletePrecio(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	listaID := chi.URLParam(r, "id")
	precioID := chi.URLParam(r, "precioId")

	if err := h.svc.DeletePrecio(r.Context(), userID, listaID, precioID); err != nil {
		if errors.Is(err, service.ErrListaPrecioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "lista de precios no encontrada")
			return
		}
		if errors.Is(err, service.ErrPrecioNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "precio no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar precio")
		return
	}
	response.NoContent(w)
}

// GetPreciosForCliente returns prices from the client's assigned price list.
func (h *PriceListHandler) GetPreciosForCliente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "clienteId")

	precios, err := h.svc.GetPreciosForCliente(r.Context(), userID, clienteID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, precios)
}
