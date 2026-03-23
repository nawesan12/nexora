package service

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/permissions"
	"github.com/pronto-erp/pronto/internal/repository"
)

type PermissionService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewPermissionService(db *pgxpool.Pool) *PermissionService {
	return &PermissionService{
		db:      db,
		queries: repository.New(db),
	}
}

type RolePermissionsResponse struct {
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	Defaults    []string `json:"defaults"`
}

func (s *PermissionService) GetAllRolesPermissions(ctx context.Context, userID pgtype.UUID) ([]RolePermissionsResponse, error) {
	allOverrides, err := s.queries.ListPermissionOverridesByUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list overrides: %w", err)
	}

	overridesByRole := make(map[string][]permissions.Override)
	for _, o := range allOverrides {
		overridesByRole[string(o.Rol)] = append(overridesByRole[string(o.Rol)], permissions.Override{
			Permission: o.Permission,
			Granted:    o.Granted,
		})
	}

	roles := []string{"ADMIN", "SUPERVISOR", "JEFE_VENTAS", "VENDEDOR", "VENDEDOR_CALLE", "DEPOSITO", "FINANZAS", "REPARTIDOR"}
	result := make([]RolePermissionsResponse, 0, len(roles))
	for _, role := range roles {
		defaults := permissions.DefaultPermissions[role]
		resolved := permissions.ResolvePermissions(role, overridesByRole[role])
		result = append(result, RolePermissionsResponse{
			Role:        role,
			Permissions: resolved,
			Defaults:    defaults,
		})
	}
	return result, nil
}

func (s *PermissionService) GetRolePermissions(ctx context.Context, userID pgtype.UUID, role string) (*RolePermissionsResponse, error) {
	if _, ok := permissions.DefaultPermissions[role]; !ok {
		return nil, fmt.Errorf("invalid role: %s", role)
	}

	rows, err := s.queries.ListPermissionOverridesByUserAndRole(ctx, repository.ListPermissionOverridesByUserAndRoleParams{
		UsuarioID: userID,
		Rol:       repository.Rol(role),
	})
	if err != nil {
		return nil, fmt.Errorf("list overrides: %w", err)
	}

	overrides := make([]permissions.Override, len(rows))
	for i, r := range rows {
		overrides[i] = permissions.Override{Permission: r.Permission, Granted: r.Granted}
	}

	defaults := permissions.DefaultPermissions[role]
	resolved := permissions.ResolvePermissions(role, overrides)
	return &RolePermissionsResponse{
		Role:        role,
		Permissions: resolved,
		Defaults:    defaults,
	}, nil
}

type UpdateRolePermissionsInput struct {
	Permissions []string `json:"permissions" validate:"required"`
}

func (s *PermissionService) UpdateRolePermissions(ctx context.Context, userID pgtype.UUID, role string, desired []string) error {
	if role == "ADMIN" {
		return fmt.Errorf("cannot modify ADMIN permissions")
	}
	defaults, ok := permissions.DefaultPermissions[role]
	if !ok {
		return fmt.Errorf("invalid role: %s", role)
	}

	defaultSet := make(map[string]bool, len(defaults))
	for _, p := range defaults {
		defaultSet[p] = true
	}

	desiredSet := make(map[string]bool, len(desired))
	for _, p := range desired {
		desiredSet[p] = true
	}

	// Delete existing overrides first
	err := s.queries.DeleteAllPermissionOverridesForRole(ctx, repository.DeleteAllPermissionOverridesForRoleParams{
		Rol:       repository.Rol(role),
		UsuarioID: userID,
	})
	if err != nil {
		return fmt.Errorf("delete overrides: %w", err)
	}

	// Create overrides for differences from defaults
	validPerms := make(map[string]bool, len(permissions.AllPermissions))
	for _, p := range permissions.AllPermissions {
		validPerms[p] = true
	}

	for _, p := range permissions.AllPermissions {
		inDefault := defaultSet[p]
		inDesired := desiredSet[p]

		if inDefault && !inDesired {
			// Permission removed from default → override granted=false
			_, err := s.queries.UpsertPermissionOverride(ctx, repository.UpsertPermissionOverrideParams{
				Rol:        repository.Rol(role),
				Permission: p,
				Granted:    false,
				UsuarioID:  userID,
			})
			if err != nil {
				return fmt.Errorf("upsert override: %w", err)
			}
		} else if !inDefault && inDesired {
			// Permission added beyond default → override granted=true
			_, err := s.queries.UpsertPermissionOverride(ctx, repository.UpsertPermissionOverrideParams{
				Rol:        repository.Rol(role),
				Permission: p,
				Granted:    true,
				UsuarioID:  userID,
			})
			if err != nil {
				return fmt.Errorf("upsert override: %w", err)
			}
		}
		// If matches default, no override needed
	}

	return nil
}

func (s *PermissionService) ResetRolePermissions(ctx context.Context, userID pgtype.UUID, role string) error {
	if _, ok := permissions.DefaultPermissions[role]; !ok {
		return fmt.Errorf("invalid role: %s", role)
	}
	return s.queries.DeleteAllPermissionOverridesForRole(ctx, repository.DeleteAllPermissionOverridesForRoleParams{
		Rol:       repository.Rol(role),
		UsuarioID: userID,
	})
}
