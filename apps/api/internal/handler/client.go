package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/pagination"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type ClientHandler struct {
	svc *service.ClientService
}

func NewClientHandler(svc *service.ClientService) *ClientHandler {
	return &ClientHandler{svc: svc}
}

// --- Clientes ---

func (h *ClientHandler) ListClientes(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")
	reputacion := r.URL.Query().Get("reputacion")
	condicionIva := r.URL.Query().Get("condicion_iva")

	items, total, err := h.svc.ListClientes(r.Context(), userID, search, reputacion, condicionIva, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar clientes")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ClientHandler) CreateCliente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateClienteInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateCliente(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrCuitDuplicado) {
			response.Error(w, http.StatusConflict, "CUIT_DUPLICADO", "ya existe un cliente con ese CUIT")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear cliente")
		return
	}
	response.Created(w, result)
}

func (h *ClientHandler) GetCliente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetCliente(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener cliente")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ClientHandler) UpdateCliente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateClienteInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateCliente(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		if errors.Is(err, service.ErrCuitDuplicado) {
			response.Error(w, http.StatusConflict, "CUIT_DUPLICADO", "ya existe un cliente con ese CUIT")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar cliente")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ClientHandler) DeleteCliente(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteCliente(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar cliente")
		return
	}
	response.NoContent(w)
}

// --- Direcciones ---

func (h *ClientHandler) ListDirecciones(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")

	items, err := h.svc.ListDirecciones(r.Context(), userID, clienteID)
	if err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar direcciones")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *ClientHandler) CreateDireccion(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")

	var input service.CreateDireccionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateDireccion(r.Context(), userID, clienteID, input)
	if err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear dirección")
		return
	}
	response.Created(w, result)
}

func (h *ClientHandler) UpdateDireccion(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")
	direccionID := chi.URLParam(r, "direccionId")

	var input service.UpdateDireccionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateDireccion(r.Context(), userID, clienteID, direccionID, input)
	if err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		if errors.Is(err, service.ErrDireccionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "dirección no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar dirección")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ClientHandler) DeleteDireccion(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")
	direccionID := chi.URLParam(r, "direccionId")

	if err := h.svc.DeleteDireccion(r.Context(), userID, clienteID, direccionID); err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		if errors.Is(err, service.ErrDireccionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "dirección no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar dirección")
		return
	}
	response.NoContent(w)
}

func (h *ClientHandler) SetDireccionPrincipal(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	clienteID := chi.URLParam(r, "id")
	direccionID := chi.URLParam(r, "direccionId")

	if err := h.svc.SetDireccionPrincipal(r.Context(), userID, clienteID, direccionID); err != nil {
		if errors.Is(err, service.ErrClienteNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "cliente no encontrado")
			return
		}
		if errors.Is(err, service.ErrDireccionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "dirección no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al marcar dirección como principal")
		return
	}
	response.NoContent(w)
}
