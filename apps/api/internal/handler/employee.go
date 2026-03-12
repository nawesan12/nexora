package handler

import (
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/pagination"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type EmployeeHandler struct {
	svc *service.EmployeeService
}

func NewEmployeeHandler(svc *service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{svc: svc}
}

func (h *EmployeeHandler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")
	rol := r.URL.Query().Get("rol")
	sucursalID := r.URL.Query().Get("sucursal_id")
	estado := r.URL.Query().Get("estado")

	items, total, err := h.svc.ListEmployees(r.Context(), userID, search, rol, sucursalID, estado, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar empleados")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *EmployeeHandler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateEmpleadoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateEmployee(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrEmailDuplicado) {
			response.Error(w, http.StatusConflict, "EMAIL_DUPLICADO", "ya existe un empleado con ese email")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear empleado")
		return
	}
	response.Created(w, result)
}

func (h *EmployeeHandler) GetEmployee(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetEmployee(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrEmpleadoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "empleado no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener empleado")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *EmployeeHandler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateEmpleadoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateEmployee(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrEmpleadoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "empleado no encontrado")
			return
		}
		if errors.Is(err, service.ErrEmailDuplicado) {
			response.Error(w, http.StatusConflict, "EMAIL_DUPLICADO", "ya existe un empleado con ese email")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar empleado")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *EmployeeHandler) DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteEmployee(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrEmpleadoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "empleado no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar empleado")
		return
	}
	response.NoContent(w)
}

func (h *EmployeeHandler) ListEmployeeBranches(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	items, err := h.svc.ListBranches(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrEmpleadoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "empleado no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar sucursales del empleado")
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *EmployeeHandler) AssignEmployeeBranches(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.AssignBranchesInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	if err := h.svc.AssignBranches(r.Context(), userID, id, input.BranchIDs); err != nil {
		if errors.Is(err, service.ErrEmpleadoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "empleado no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al asignar sucursales")
		return
	}
	response.NoContent(w)
}

func (h *EmployeeHandler) RegenerateAccessCode(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.RegenerateAccessCode(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrEmpleadoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "empleado no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al regenerar codigo de acceso")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *EmployeeHandler) ExportEmployees(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	items, err := h.svc.ExportEmployees(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al exportar empleados")
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=empleados.csv")
	w.WriteHeader(http.StatusOK)

	csvWriter := csv.NewWriter(w)
	defer csvWriter.Flush()

	// Header
	_ = csvWriter.Write([]string{
		"ID", "Nombre", "Apellido", "Email", "CUIL", "Rol", "Estado",
		"DNI", "Telefono", "Fecha Ingreso", "Numero Legajo",
		"Tipo Contrato", "Banco", "CBU", "Obra Social",
	})

	for _, e := range items {
		salario := ""
		if e.SalarioBase != nil {
			salario = fmt.Sprintf("%.2f", *e.SalarioBase)
		}
		_ = salario // we don't include salario in the export columns per spec

		_ = csvWriter.Write([]string{
			e.ID, e.Nombre, e.Apellido, e.Email, e.Cuil, e.Rol, e.Estado,
			e.Dni, e.Telefono, e.FechaIngreso, e.NumeroLegajo,
			e.TipoContrato, e.Banco, e.Cbu, e.ObraSocial,
		})
	}
}

func (h *EmployeeHandler) BulkUpdateEstado(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.BulkEstadoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	if err := h.svc.BulkUpdateEstado(r.Context(), userID, input); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar estado masivamente")
		return
	}
	response.NoContent(w)
}

func (h *EmployeeHandler) BulkUpdateRol(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.BulkRolInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	if err := h.svc.BulkUpdateRol(r.Context(), userID, input); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar rol masivamente")
		return
	}
	response.NoContent(w)
}

func (h *EmployeeHandler) BulkAssignBranches(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.BulkBranchesInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	if err := h.svc.BulkAssignBranches(r.Context(), userID, input); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al asignar sucursales masivamente")
		return
	}
	response.NoContent(w)
}
