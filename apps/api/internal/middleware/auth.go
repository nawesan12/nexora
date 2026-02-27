package middleware

import (
	"net/http"

	"github.com/nexora-erp/nexora/internal/pkg/response"
)

// Auth is a placeholder JWT authentication middleware.
// It will be implemented when the auth module is built.
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing authorization header")
			return
		}

		// TODO: Validate JWT token, extract claims, set user in context
		next.ServeHTTP(w, r)
	})
}
