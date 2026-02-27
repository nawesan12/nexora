package server

import (
	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/config"
)

type Server struct {
	cfg    *config.Config
	router *chi.Mux
}

func New(cfg *config.Config) *Server {
	s := &Server{cfg: cfg}
	s.router = s.setupRouter()
	return s
}

func (s *Server) Router() *chi.Mux {
	return s.router
}
