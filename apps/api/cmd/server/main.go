package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nexora-erp/nexora/internal/cache"
	"github.com/nexora-erp/nexora/internal/config"
	"github.com/nexora-erp/nexora/internal/database"
	"github.com/hibiken/asynq"
	jwtpkg "github.com/nexora-erp/nexora/internal/pkg/jwt"
	"github.com/nexora-erp/nexora/internal/server"
	"github.com/nexora-erp/nexora/internal/worker"
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

	srv := server.New(cfg, db, rdb, jwtMgr)

	// Start WebSocket hub
	go srv.Hub().Run()

	// Start Asynq worker
	asynqSrv := worker.NewProcessor(cfg.RedisURL)
	mux := asynq.NewServeMux()
	worker.RegisterHandlers(mux)
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
