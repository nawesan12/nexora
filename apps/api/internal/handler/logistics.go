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

type LogisticsHandler struct {
	svc *service.LogisticsService
}

func NewLogisticsHandler(svc *service.LogisticsService) *LogisticsHandler {
	return &LogisticsHandler{svc: svc}
}

// --- Vehiculos ---

func (h *LogisticsHandler) CreateVehiculo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateVehiculoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateVehiculo(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrVehiculoPatenteDuplicada) {
			response.Error(w, http.StatusConflict, "PATENTE_DUPLICADA", "ya existe un vehículo con esa patente")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear vehículo")
		return
	}
	response.Created(w, result)
}

func (h *LogisticsHandler) GetVehiculo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetVehiculo(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrVehiculoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "vehículo no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener vehículo")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LogisticsHandler) ListVehiculos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.ListVehiculos(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar vehículos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *LogisticsHandler) UpdateVehiculo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.CreateVehiculoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateVehiculo(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrVehiculoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "vehículo no encontrado")
			return
		}
		if errors.Is(err, service.ErrVehiculoPatenteDuplicada) {
			response.Error(w, http.StatusConflict, "PATENTE_DUPLICADA", "ya existe un vehículo con esa patente")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar vehículo")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LogisticsHandler) DeleteVehiculo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteVehiculo(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrVehiculoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "vehículo no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar vehículo")
		return
	}
	response.NoContent(w)
}

// --- Zonas ---

func (h *LogisticsHandler) CreateZona(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateZonaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateZona(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear zona")
		return
	}
	response.Created(w, result)
}

func (h *LogisticsHandler) GetZona(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetZona(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrZonaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "zona no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener zona")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LogisticsHandler) ListZonas(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.ListZonas(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar zonas")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *LogisticsHandler) UpdateZona(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.CreateZonaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateZona(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrZonaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "zona no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar zona")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LogisticsHandler) DeleteZona(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteZona(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrZonaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "zona no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar zona")
		return
	}
	response.NoContent(w)
}

// --- Repartos ---

func (h *LogisticsHandler) CreateReparto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateRepartoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateReparto(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear reparto")
		return
	}
	response.Created(w, result)
}

func (h *LogisticsHandler) GetReparto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetReparto(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrRepartoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "reparto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener reparto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LogisticsHandler) ListRepartos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	estado := r.URL.Query().Get("estado")

	items, total, err := h.svc.ListRepartos(r.Context(), userID, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar repartos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *LogisticsHandler) TransitionReparto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	role := claims.Role
	id := chi.URLParam(r, "id")

	var input service.RepartoTransitionInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.TransitionReparto(r.Context(), userID, role, id, input)
	if err != nil {
		if errors.Is(err, service.ErrRepartoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "reparto no encontrado")
			return
		}
		if errors.Is(err, service.ErrInvalidDeliveryTransition) {
			response.Error(w, http.StatusBadRequest, "INVALID_TRANSITION", err.Error())
			return
		}
		if errors.Is(err, service.ErrUnauthorizedDelivery) {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", err.Error())
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al cambiar estado del reparto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *LogisticsHandler) DeleteReparto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteReparto(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrRepartoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "reparto no encontrado")
			return
		}
		if errors.Is(err, service.ErrRepartoNotEditable) {
			response.Error(w, http.StatusBadRequest, "NOT_EDITABLE", "solo se pueden eliminar repartos planificados")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar reparto")
		return
	}
	response.NoContent(w)
}

// --- Eventos ---

func (h *LogisticsHandler) CreateEvento(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	repartoID := chi.URLParam(r, "id")

	var input service.CreateEventoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateEvento(r.Context(), userID, repartoID, input)
	if err != nil {
		if errors.Is(err, service.ErrRepartoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "reparto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear evento")
		return
	}
	response.Created(w, result)
}

func (h *LogisticsHandler) ListEventos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	repartoID := chi.URLParam(r, "id")

	items, err := h.svc.ListEventos(r.Context(), userID, repartoID)
	if err != nil {
		if errors.Is(err, service.ErrRepartoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "reparto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar eventos")
		return
	}
	response.JSON(w, http.StatusOK, items)
}
