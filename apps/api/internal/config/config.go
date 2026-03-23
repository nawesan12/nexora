package config

import "github.com/kelseyhightower/envconfig"

type Config struct {
	// Server
	Port int    `envconfig:"API_PORT" default:"8080"`
	Host string `envconfig:"API_HOST" default:"0.0.0.0"`
	Env  string `envconfig:"API_ENV" default:"development"`

	// Database
	DatabaseURL string `envconfig:"DATABASE_URL" required:"true"`

	// Redis
	RedisURL string `envconfig:"REDIS_URL" default:"redis://localhost:6379/0"`

	// JWT
	JWTSecret        string `envconfig:"JWT_SECRET" required:"true"`
	JWTRefreshSecret string `envconfig:"JWT_REFRESH_SECRET" default:""`
	JWTExpiry        string `envconfig:"JWT_EXPIRY" default:"15m"`
	JWTRefreshExpiry string `envconfig:"JWT_REFRESH_EXPIRY" default:"168h"`

	// CORS
	CORSAllowedOrigins string `envconfig:"CORS_ALLOWED_ORIGINS" default:"http://localhost:3000"`

	// Google OAuth
	GoogleClientID     string `envconfig:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string `envconfig:"GOOGLE_CLIENT_SECRET"`
	GoogleRedirectURL  string `envconfig:"GOOGLE_REDIRECT_URL" default:"http://localhost:8080/api/v1/auth/google/callback"`

	// Email (Resend)
	ResendAPIKey string `envconfig:"RESEND_API_KEY"`
	EmailFrom    string `envconfig:"EMAIL_FROM" default:"Pronto ERP <noreply@pronto.app>"`
	AppURL       string `envconfig:"APP_URL" default:"http://localhost:3000"`
}

func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
