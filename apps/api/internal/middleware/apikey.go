package middleware

import (
	"context"
	"net/http"

	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/repository"
	"github.com/pronto-erp/pronto/internal/service"
)

type apiClientKey string

const apiClientCtxKey apiClientKey = "api_client"

// ApiKeyAuth authenticates requests using X-API-Key and X-API-Secret headers.
func ApiKeyAuth(svc *service.EcommerceService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			apiKey := r.Header.Get("X-API-Key")
			apiSecret := r.Header.Get("X-API-Secret")

			if apiKey == "" || apiSecret == "" {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing API credentials")
				return
			}

			client, err := svc.AuthenticateClient(r.Context(), apiKey, apiSecret)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid API credentials")
				return
			}

			ctx := context.WithValue(r.Context(), apiClientCtxKey, client)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ApiClientFromContext retrieves the authenticated API client from context.
func ApiClientFromContext(ctx context.Context) *repository.ApiClient {
	client, _ := ctx.Value(apiClientCtxKey).(*repository.ApiClient)
	return client
}
