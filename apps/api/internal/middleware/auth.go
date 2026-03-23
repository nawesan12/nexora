package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	jwtpkg "github.com/pronto-erp/pronto/internal/pkg/jwt"
	"github.com/pronto-erp/pronto/internal/pkg/response"
)

type contextKey string

const claimsKey contextKey = "claims"

func Auth(jwtManager *jwtpkg.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString := extractToken(r)
			if tokenString == "" {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
				return
			}

			claims, err := jwtManager.ValidateAccessToken(tokenString)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "TOKEN_INVALID", "token inválido o expirado")
				return
			}

			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func extractToken(r *http.Request) string {
	if cookie, err := r.Cookie("access_token"); err == nil {
		return cookie.Value
	}

	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	return ""
}

func ClaimsFromContext(ctx context.Context) *jwtpkg.Claims {
	claims, _ := ctx.Value(claimsKey).(*jwtpkg.Claims)
	return claims
}

func PgUserID(claims *jwtpkg.Claims) pgtype.UUID {
	return pgtype.UUID{Bytes: claims.UserID, Valid: true}
}
