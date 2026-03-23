package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

var (
	ErrEmpleadoNotFound = errors.New("empleado not found")
	ErrEmailDuplicado   = errors.New("email already exists")
)

type EmployeeService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewEmployeeService(db *pgxpool.Pool) *EmployeeService {
	return &EmployeeService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- Response DTOs ---

type EmpleadoResponse struct {
	ID            string   `json:"id"`
	Nombre        string   `json:"nombre"`
	Apellido      string   `json:"apellido"`
	Email         string   `json:"email,omitempty"`
	Cuil          string   `json:"cuil,omitempty"`
	AccessCode    string   `json:"access_code,omitempty"`
	Rol           string   `json:"rol"`
	SucursalID    string   `json:"sucursal_id"`
	CreatedAt     string   `json:"created_at"`
	Telefono      string   `json:"telefono,omitempty"`
	FechaIngreso  string   `json:"fecha_ingreso,omitempty"`
	FechaEgreso   string   `json:"fecha_egreso,omitempty"`
	Estado        string   `json:"estado"`
	Dni           string   `json:"dni,omitempty"`
	Direccion     string   `json:"direccion,omitempty"`
	SalarioBase   *float64 `json:"salario_base,omitempty"`
	Observaciones string   `json:"observaciones,omitempty"`
	TipoContrato  string   `json:"tipo_contrato"`
	ObraSocial    string   `json:"obra_social,omitempty"`
	NumeroLegajo  string   `json:"numero_legajo,omitempty"`
	Banco         string   `json:"banco,omitempty"`
	Cbu           string   `json:"cbu,omitempty"`
}

type EmpleadoBranchResponse struct {
	ID        string `json:"id"`
	Nombre    string `json:"nombre"`
	Direccion string `json:"direccion,omitempty"`
}

// --- Input DTOs ---

type CreateEmpleadoInput struct {
	Nombre        string  `json:"nombre" validate:"required,min=2,max=100"`
	Apellido      string  `json:"apellido" validate:"required,min=2,max=100"`
	Email         string  `json:"email"`
	Cuil          string  `json:"cuil"`
	Rol           string  `json:"rol" validate:"required,oneof=ADMIN SUPERVISOR JEFE_VENTAS VENDEDOR VENDEDOR_CALLE DEPOSITO FINANZAS REPARTIDOR"`
	SucursalID    string  `json:"sucursal_id" validate:"required,uuid"`
	Telefono      string  `json:"telefono"`
	FechaIngreso  string  `json:"fecha_ingreso"`
	FechaEgreso   string  `json:"fecha_egreso"`
	Estado        string  `json:"estado"`
	Dni           string  `json:"dni"`
	Direccion     string  `json:"direccion"`
	SalarioBase   float64 `json:"salario_base"`
	Observaciones string  `json:"observaciones"`
	TipoContrato  string  `json:"tipo_contrato"`
	ObraSocial    string  `json:"obra_social"`
	NumeroLegajo  string  `json:"numero_legajo"`
	Banco         string  `json:"banco"`
	Cbu           string  `json:"cbu"`
}

type UpdateEmpleadoInput struct {
	Nombre        string  `json:"nombre" validate:"required,min=2,max=100"`
	Apellido      string  `json:"apellido" validate:"required,min=2,max=100"`
	Email         string  `json:"email"`
	Cuil          string  `json:"cuil"`
	Rol           string  `json:"rol" validate:"required,oneof=ADMIN SUPERVISOR JEFE_VENTAS VENDEDOR VENDEDOR_CALLE DEPOSITO FINANZAS REPARTIDOR"`
	SucursalID    string  `json:"sucursal_id" validate:"required,uuid"`
	Telefono      string  `json:"telefono"`
	FechaIngreso  string  `json:"fecha_ingreso"`
	FechaEgreso   string  `json:"fecha_egreso"`
	Estado        string  `json:"estado"`
	Dni           string  `json:"dni"`
	Direccion     string  `json:"direccion"`
	SalarioBase   float64 `json:"salario_base"`
	Observaciones string  `json:"observaciones"`
	TipoContrato  string  `json:"tipo_contrato"`
	ObraSocial    string  `json:"obra_social"`
	NumeroLegajo  string  `json:"numero_legajo"`
	Banco         string  `json:"banco"`
	Cbu           string  `json:"cbu"`
}

type AssignBranchesInput struct {
	BranchIDs []string `json:"branch_ids" validate:"required"`
}

type BulkEstadoInput struct {
	IDs    []string `json:"ids" validate:"required,min=1"`
	Estado string   `json:"estado" validate:"required,oneof=ACTIVO LICENCIA DESVINCULADO"`
}

type BulkRolInput struct {
	IDs []string `json:"ids" validate:"required,min=1"`
	Rol string   `json:"rol" validate:"required,oneof=ADMIN SUPERVISOR JEFE_VENTAS VENDEDOR VENDEDOR_CALLE DEPOSITO FINANZAS REPARTIDOR"`
}

type BulkBranchesInput struct {
	IDs       []string `json:"ids" validate:"required,min=1"`
	BranchIDs []string `json:"branch_ids" validate:"required,min=1"`
}

// --- Helpers ---

func generateAccessCode() (string, error) {
	const digits = "0123456789"
	code := make([]byte, 6)
	for i := range code {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		code[i] = digits[n.Int64()]
	}
	return string(code), nil
}

func numericPtrFromPg(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f := floatFromNumeric(n)
	return &f
}

func optionalNumericFromFloat(f float64) pgtype.Numeric {
	if f == 0 {
		return pgtype.Numeric{Valid: false}
	}
	return numericFromFloat(f)
}

func optionalEstado(s string) repository.EstadoEmpleado {
	if s == "" {
		return repository.EstadoEmpleadoACTIVO
	}
	return repository.EstadoEmpleado(s)
}

func optionalTipoContrato(s string) repository.TipoContrato {
	if s == "" {
		return repository.TipoContratoRELACIONDEPENDENCIA
	}
	return repository.TipoContrato(s)
}

func optionalPgDate(s string) pgtype.Date {
	if s == "" {
		return pgtype.Date{Valid: false}
	}
	d, err := pgDate(s)
	if err != nil {
		return pgtype.Date{Valid: false}
	}
	return d
}

// --- Methods ---

func (s *EmployeeService) CreateEmployee(ctx context.Context, userID pgtype.UUID, input CreateEmpleadoInput) (*EmpleadoResponse, error) {
	// Check email uniqueness
	if input.Email != "" {
		existing, err := s.queries.GetEmployeeByEmail(ctx, repository.GetEmployeeByEmailParams{
			Email: pgText(input.Email), UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid {
			return nil, ErrEmailDuplicado
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check email: %w", err)
		}
	}

	// Generate unique access code with retry
	var accessCode string
	for i := 0; i < 10; i++ {
		code, err := generateAccessCode()
		if err != nil {
			return nil, fmt.Errorf("generate access code: %w", err)
		}
		_, err = s.queries.GetEmployeeByAccessCode(ctx, pgText(code))
		if errors.Is(err, pgx.ErrNoRows) {
			accessCode = code
			break
		}
		if err != nil {
			return nil, fmt.Errorf("check access code: %w", err)
		}
	}
	if accessCode == "" {
		return nil, fmt.Errorf("could not generate unique access code")
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id: %w", err)
	}

	emp, err := s.queries.CreateEmployee(ctx, repository.CreateEmployeeParams{
		Nombre:        input.Nombre,
		Apellido:      input.Apellido,
		Email:         pgText(input.Email),
		Cuil:          pgText(input.Cuil),
		AccessCode:    pgText(accessCode),
		Rol:           repository.Rol(input.Rol),
		SucursalID:    sucursalID,
		UsuarioID:     userID,
		Telefono:      pgText(input.Telefono),
		FechaIngreso:  optionalPgDate(input.FechaIngreso),
		FechaEgreso:   optionalPgDate(input.FechaEgreso),
		Estado:        optionalEstado(input.Estado),
		Dni:           pgText(input.Dni),
		Direccion:     pgText(input.Direccion),
		SalarioBase:   optionalNumericFromFloat(input.SalarioBase),
		Observaciones: pgText(input.Observaciones),
		TipoContrato:  optionalTipoContrato(input.TipoContrato),
		ObraSocial:    pgText(input.ObraSocial),
		NumeroLegajo:  pgText(input.NumeroLegajo),
		Banco:         pgText(input.Banco),
		Cbu:           pgText(input.Cbu),
	})
	if err != nil {
		return nil, fmt.Errorf("create employee: %w", err)
	}

	// Also assign to the primary branch
	if err := s.queries.CreateEmployeeBranch(ctx, repository.CreateEmployeeBranchParams{
		EmpleadoID: emp.ID,
		SucursalID: sucursalID,
	}); err != nil {
		return nil, fmt.Errorf("assign primary branch: %w", err)
	}

	return toEmpleadoResponse(emp), nil
}

func (s *EmployeeService) GetEmployee(ctx context.Context, userID pgtype.UUID, id string) (*EmpleadoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrEmpleadoNotFound
	}
	emp, err := s.queries.GetEmployeeByID(ctx, repository.GetEmployeeByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrEmpleadoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get employee: %w", err)
	}
	return toEmpleadoResponse(emp), nil
}

func (s *EmployeeService) ListEmployees(ctx context.Context, userID pgtype.UUID, search, rol, sucursalID, estado string, limit, offset int32) ([]EmpleadoResponse, int, error) {
	// Filter by estado
	if estado != "" {
		items, err := s.queries.ListEmployeesByEstado(ctx, repository.ListEmployeesByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoEmpleado(estado),
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list employees by estado: %w", err)
		}
		count, err := s.queries.CountEmployeesByEstado(ctx, repository.CountEmployeesByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoEmpleado(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count employees by estado: %w", err)
		}
		return toEmpleadoResponses(items), int(count), nil
	}

	// Filter by rol
	if rol != "" {
		items, err := s.queries.ListEmployeesByRol(ctx, repository.ListEmployeesByRolParams{
			UsuarioID: userID, Rol: repository.Rol(rol),
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list employees by rol: %w", err)
		}
		count, err := s.queries.CountEmployeesByRol(ctx, repository.CountEmployeesByRolParams{
			UsuarioID: userID, Rol: repository.Rol(rol),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count employees by rol: %w", err)
		}
		return toEmpleadoResponses(items), int(count), nil
	}

	// Filter by sucursal
	if sucursalID != "" {
		pgSucursalID, err := pgUUID(sucursalID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid sucursal_id: %w", err)
		}
		items, err := s.queries.ListEmployeesBySucursal(ctx, repository.ListEmployeesBySucursalParams{
			UsuarioID: userID, SucursalID: pgSucursalID,
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list employees by sucursal: %w", err)
		}
		count, err := s.queries.CountEmployeesBySucursal(ctx, repository.CountEmployeesBySucursalParams{
			UsuarioID: userID, SucursalID: pgSucursalID,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count employees by sucursal: %w", err)
		}
		return toEmpleadoResponses(items), int(count), nil
	}

	// Search
	if search != "" {
		searchPattern := "%" + search + "%"
		items, err := s.queries.SearchEmployees(ctx, repository.SearchEmployeesParams{
			UsuarioID: userID, Nombre: searchPattern,
			Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("search employees: %w", err)
		}
		count, err := s.queries.CountSearchEmployees(ctx, repository.CountSearchEmployeesParams{
			UsuarioID: userID, Nombre: searchPattern,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count search employees: %w", err)
		}
		return toEmpleadoResponses(items), int(count), nil
	}

	// Default list
	items, err := s.queries.ListEmployees(ctx, repository.ListEmployeesParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list employees: %w", err)
	}
	count, err := s.queries.CountEmployees(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count employees: %w", err)
	}
	return toEmpleadoResponses(items), int(count), nil
}

func (s *EmployeeService) UpdateEmployee(ctx context.Context, userID pgtype.UUID, id string, input UpdateEmpleadoInput) (*EmpleadoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrEmpleadoNotFound
	}

	// Check email uniqueness excluding self
	if input.Email != "" {
		existing, err := s.queries.GetEmployeeByEmail(ctx, repository.GetEmployeeByEmailParams{
			Email: pgText(input.Email), UsuarioID: userID,
		})
		if err == nil && existing.ID.Valid && uuidStrFromPg(existing.ID) != id {
			return nil, ErrEmailDuplicado
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check email: %w", err)
		}
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id: %w", err)
	}

	emp, err := s.queries.UpdateEmployee(ctx, repository.UpdateEmployeeParams{
		ID: pgID, UsuarioID: userID,
		Nombre:        input.Nombre,
		Apellido:      input.Apellido,
		Email:         pgText(input.Email),
		Cuil:          pgText(input.Cuil),
		Rol:           repository.Rol(input.Rol),
		SucursalID:    sucursalID,
		Telefono:      pgText(input.Telefono),
		FechaIngreso:  optionalPgDate(input.FechaIngreso),
		FechaEgreso:   optionalPgDate(input.FechaEgreso),
		Estado:        optionalEstado(input.Estado),
		Dni:           pgText(input.Dni),
		Direccion:     pgText(input.Direccion),
		SalarioBase:   optionalNumericFromFloat(input.SalarioBase),
		Observaciones: pgText(input.Observaciones),
		TipoContrato:  optionalTipoContrato(input.TipoContrato),
		ObraSocial:    pgText(input.ObraSocial),
		NumeroLegajo:  pgText(input.NumeroLegajo),
		Banco:         pgText(input.Banco),
		Cbu:           pgText(input.Cbu),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrEmpleadoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update employee: %w", err)
	}
	return toEmpleadoResponse(emp), nil
}

func (s *EmployeeService) DeleteEmployee(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrEmpleadoNotFound
	}
	return s.queries.SoftDeleteEmployee(ctx, repository.SoftDeleteEmployeeParams{
		ID: pgID, UsuarioID: userID,
	})
}

func (s *EmployeeService) RegenerateAccessCode(ctx context.Context, userID pgtype.UUID, id string) (*EmpleadoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrEmpleadoNotFound
	}

	// Generate unique access code with retry
	var accessCode string
	for i := 0; i < 10; i++ {
		code, err := generateAccessCode()
		if err != nil {
			return nil, fmt.Errorf("generate access code: %w", err)
		}
		_, err = s.queries.GetEmployeeByAccessCode(ctx, pgText(code))
		if errors.Is(err, pgx.ErrNoRows) {
			accessCode = code
			break
		}
		if err != nil {
			return nil, fmt.Errorf("check access code: %w", err)
		}
	}
	if accessCode == "" {
		return nil, fmt.Errorf("could not generate unique access code")
	}

	emp, err := s.queries.UpdateEmployeeAccessCode(ctx, repository.UpdateEmployeeAccessCodeParams{
		ID: pgID, UsuarioID: userID, AccessCode: pgText(accessCode),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrEmpleadoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update access code: %w", err)
	}
	return toEmpleadoResponse(emp), nil
}

func (s *EmployeeService) ExportEmployees(ctx context.Context, userID pgtype.UUID) ([]EmpleadoResponse, error) {
	items, err := s.queries.ListEmployeesForExport(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("export employees: %w", err)
	}
	return toEmpleadoResponses(items), nil
}

func (s *EmployeeService) BulkUpdateEstado(ctx context.Context, userID pgtype.UUID, input BulkEstadoInput) error {
	ids := make([]pgtype.UUID, 0, len(input.IDs))
	for _, id := range input.IDs {
		pgID, err := pgUUID(id)
		if err != nil {
			continue
		}
		ids = append(ids, pgID)
	}
	if len(ids) == 0 {
		return fmt.Errorf("no valid IDs provided")
	}
	return s.queries.BulkUpdateEmployeeEstado(ctx, repository.BulkUpdateEmployeeEstadoParams{
		Column1: ids, UsuarioID: userID, Estado: repository.EstadoEmpleado(input.Estado),
	})
}

func (s *EmployeeService) BulkUpdateRol(ctx context.Context, userID pgtype.UUID, input BulkRolInput) error {
	ids := make([]pgtype.UUID, 0, len(input.IDs))
	for _, id := range input.IDs {
		pgID, err := pgUUID(id)
		if err != nil {
			continue
		}
		ids = append(ids, pgID)
	}
	if len(ids) == 0 {
		return fmt.Errorf("no valid IDs provided")
	}
	return s.queries.BulkUpdateEmployeeRol(ctx, repository.BulkUpdateEmployeeRolParams{
		Column1: ids, UsuarioID: userID, Rol: repository.Rol(input.Rol),
	})
}

func (s *EmployeeService) BulkAssignBranches(ctx context.Context, userID pgtype.UUID, input BulkBranchesInput) error {
	for _, id := range input.IDs {
		pgID, err := pgUUID(id)
		if err != nil {
			continue
		}
		// Verify employee belongs to user
		_, err = s.queries.GetEmployeeByID(ctx, repository.GetEmployeeByIDParams{
			ID: pgID, UsuarioID: userID,
		})
		if err != nil {
			continue
		}
		// Delete existing and reassign
		if err := s.queries.DeleteEmployeeBranches(ctx, pgID); err != nil {
			return fmt.Errorf("delete branches for %s: %w", id, err)
		}
		for _, bid := range input.BranchIDs {
			pgBranchID, err := pgUUID(bid)
			if err != nil {
				continue
			}
			if err := s.queries.CreateEmployeeBranch(ctx, repository.CreateEmployeeBranchParams{
				EmpleadoID: pgID,
				SucursalID: pgBranchID,
			}); err != nil {
				return fmt.Errorf("assign branch: %w", err)
			}
		}
	}
	return nil
}

func (s *EmployeeService) ListBranches(ctx context.Context, id string) ([]EmpleadoBranchResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrEmpleadoNotFound
	}
	items, err := s.queries.ListEmployeeBranches(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list employee branches: %w", err)
	}
	result := make([]EmpleadoBranchResponse, 0, len(items))
	for _, b := range items {
		result = append(result, EmpleadoBranchResponse{
			ID:        uuidStrFromPg(b.ID),
			Nombre:    b.Nombre,
			Direccion: textFromPg(b.Direccion),
		})
	}
	return result, nil
}

func (s *EmployeeService) AssignBranches(ctx context.Context, userID pgtype.UUID, id string, branchIDs []string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrEmpleadoNotFound
	}

	// Verify employee exists and belongs to user
	_, err = s.queries.GetEmployeeByID(ctx, repository.GetEmployeeByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrEmpleadoNotFound
	}
	if err != nil {
		return fmt.Errorf("get employee: %w", err)
	}

	// Delete existing and reassign
	if err := s.queries.DeleteEmployeeBranches(ctx, pgID); err != nil {
		return fmt.Errorf("delete branches: %w", err)
	}
	for _, bid := range branchIDs {
		pgBranchID, err := pgUUID(bid)
		if err != nil {
			continue
		}
		if err := s.queries.CreateEmployeeBranch(ctx, repository.CreateEmployeeBranchParams{
			EmpleadoID: pgID,
			SucursalID: pgBranchID,
		}); err != nil {
			return fmt.Errorf("assign branch: %w", err)
		}
	}
	return nil
}

func toEmpleadoResponse(e repository.Empleado) *EmpleadoResponse {
	createdAt := ""
	if e.CreatedAt.Valid {
		createdAt = e.CreatedAt.Time.Format("2006-01-02T15:04:05Z")
	}
	return &EmpleadoResponse{
		ID:            uuidStrFromPg(e.ID),
		Nombre:        e.Nombre,
		Apellido:      e.Apellido,
		Email:         textFromPg(e.Email),
		Cuil:          textFromPg(e.Cuil),
		AccessCode:    textFromPg(e.AccessCode),
		Rol:           string(e.Rol),
		SucursalID:    uuidStrFromPg(e.SucursalID),
		CreatedAt:     createdAt,
		Telefono:      textFromPg(e.Telefono),
		FechaIngreso:  dateFromPg(e.FechaIngreso),
		FechaEgreso:   dateFromPg(e.FechaEgreso),
		Estado:        string(e.Estado),
		Dni:           textFromPg(e.Dni),
		Direccion:     textFromPg(e.Direccion),
		SalarioBase:   numericPtrFromPg(e.SalarioBase),
		Observaciones: textFromPg(e.Observaciones),
		TipoContrato:  string(e.TipoContrato),
		ObraSocial:    textFromPg(e.ObraSocial),
		NumeroLegajo:  textFromPg(e.NumeroLegajo),
		Banco:         textFromPg(e.Banco),
		Cbu:           textFromPg(e.Cbu),
	}
}

func toEmpleadoResponses(items []repository.Empleado) []EmpleadoResponse {
	result := make([]EmpleadoResponse, 0, len(items))
	for _, e := range items {
		result = append(result, *toEmpleadoResponse(e))
	}
	return result
}
