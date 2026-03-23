package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hibiken/asynq"
	"github.com/pronto-erp/pronto/internal/cache"
	"github.com/pronto-erp/pronto/internal/config"
	"github.com/pronto-erp/pronto/internal/database"
	"github.com/pronto-erp/pronto/internal/email"
	jwtpkg "github.com/pronto-erp/pronto/internal/pkg/jwt"
	"github.com/pronto-erp/pronto/internal/server"
	"github.com/pronto-erp/pronto/internal/worker"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	if cfg.Env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	if cfg.Env == "development" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	ctx := context.Background()

	db, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer db.Close()

	rdb, err := cache.NewRedisClient(ctx, cfg.RedisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to redis")
	}
	defer rdb.Close()

	accessExpiry, err := time.ParseDuration(cfg.JWTExpiry)
	if err != nil {
		accessExpiry = 15 * time.Minute
	}
	refreshExpiry, err := time.ParseDuration(cfg.JWTRefreshExpiry)
	if err != nil {
		refreshExpiry = 7 * 24 * time.Hour
	}

	refreshSecret := cfg.JWTRefreshSecret
	if refreshSecret == "" {
		refreshSecret = cfg.JWTSecret + "-refresh"
	}

	jwtMgr := jwtpkg.NewManager(cfg.JWTSecret, refreshSecret, accessExpiry, refreshExpiry)

	// Asynq client for enqueuing tasks
	redisOpt, err := asynq.ParseRedisURI(cfg.RedisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to parse redis URL for asynq client")
	}
	asynqClient := asynq.NewClient(redisOpt)
	defer asynqClient.Close()

	// Email sender (optional — gracefully degrades if not configured)
	var emailSender *email.Sender
	if cfg.ResendAPIKey != "" {
		emailSender = email.NewSender(cfg.ResendAPIKey, cfg.EmailFrom)
		log.Info().Msg("email sending enabled via Resend")
	} else {
		log.Warn().Msg("RESEND_API_KEY not set — email sending disabled")
	}

	srv := server.New(cfg, db, rdb, jwtMgr, asynqClient)

	// Start WebSocket hub
	go srv.Hub().Run()

	// Start Asynq worker
	asynqSrv := worker.NewProcessor(cfg.RedisURL)
	mux := asynq.NewServeMux()
	emailWorker := worker.NewEmailWorker(emailSender)
	worker.RegisterHandlers(mux, emailWorker)
	go func() {
		if err := asynqSrv.Run(mux); err != nil {
			log.Error().Err(err).Msg("asynq worker stopped")
		}
	}()

	httpServer := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Handler:      srv.Router(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info().
			Str("host", cfg.Host).
			Int("port", cfg.Port).
			Str("env", cfg.Env).
			Msg("starting server")

		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server failed")
		}
	}()

	<-quit
	log.Info().Msg("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Fatal().Err(err).Msg("server forced to shutdown")
	}

	asynqSrv.Shutdown()
	log.Info().Msg("server stopped")
}
