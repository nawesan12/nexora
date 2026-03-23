package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/pronto-erp/pronto/internal/pkg/response"
)

// RateLimit applies a fixed rate limit per IP address.
func RateLimit(rdb *redis.Client, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			key := fmt.Sprintf("ratelimit:%s", ip)

			if !checkRateLimit(rdb, key, limit, window, w) {
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RateLimitByMethod applies different rate limits based on HTTP method:
//   - GET: 200 requests/minute
//   - POST, PUT, PATCH, DELETE: 60 requests/minute
//   - Other methods: 100 requests/minute
func RateLimitByMethod(rdb *redis.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var limit int
			var window time.Duration

			switch r.Method {
			case http.MethodGet:
				limit = 200
				window = time.Minute
			case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
				limit = 60
				window = time.Minute
			default:
				limit = 100
				window = time.Minute
			}

			ip := r.RemoteAddr
			key := fmt.Sprintf("ratelimit:%s:%s", ip, r.Method)

			if !checkRateLimit(rdb, key, limit, window, w) {
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RateLimitExport applies a strict rate limit for export/report endpoints: 10 requests/minute.
func RateLimitExport(rdb *redis.Client) func(http.Handler) http.Handler {
	return RateLimit(rdb, 10, time.Minute)
}

// checkRateLimit increments the counter for the given key and returns false if the limit is exceeded.
func checkRateLimit(rdb *redis.Client, key string, limit int, window time.Duration, w http.ResponseWriter) bool {
	ctx := context.Background()
	count, err := rdb.Incr(ctx, key).Result()
	if err != nil {
		// On Redis failure, allow the request through
		return true
	}

	if count == 1 {
		rdb.Expire(ctx, key, window)
	}

	if count > int64(limit) {
		w.Header().Set("Retry-After", fmt.Sprintf("%d", int(window.Seconds())))
		response.Error(w, http.StatusTooManyRequests, "RATE_LIMITED", "demasiadas solicitudes, intentá de nuevo más tarde")
		return false
	}

	return true
}
