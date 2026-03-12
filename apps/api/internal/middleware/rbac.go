package middleware

import (
	"net/http"

	"github.com/nexora-erp/nexora/internal/permissions"
	"github.com/nexora-erp/nexora/internal/pkg/response"
)

func RequireRoles(roles ...string) func(http.Handler) http.Handler {
	roleSet := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		roleSet[r] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := ClaimsFromContext(r.Context())
			if claims == nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
				return
			}

			if _, ok := roleSet[claims.Role]; !ok {
				response.Error(w, http.StatusForbidden, "FORBIDDEN", "no tienes permisos para acceder a este recurso")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func RequirePermission(perm string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := ClaimsFromContext(r.Context())
			if claims == nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
				return
			}

			if claims.Role == "ADMIN" {
				next.ServeHTTP(w, r)
				return
			}

			if !permissions.HasPermission(claims.Permissions, perm) {
				response.Error(w, http.StatusForbidden, "FORBIDDEN", "no tienes permiso: "+perm)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
