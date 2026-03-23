package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

type AuditService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewAuditService(db *pgxpool.Pool) *AuditService {
	return &AuditService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type AuditLogResponse struct {
	ID              string          `json:"id"`
	UsuarioID       string          `json:"usuario_id,omitempty"`
	Accion          string          `json:"accion"`
	Entidad         string          `json:"entidad"`
	EntidadID       string          `json:"entidad_id,omitempty"`
	DatosAnteriores json.RawMessage `json:"datos_anteriores,omitempty"`
	DatosNuevos     json.RawMessage `json:"datos_nuevos,omitempty"`
	IpAddress       string          `json:"ip_address,omitempty"`
	UserAgent       string          `json:"user_agent,omitempty"`
	CreatedAt       string          `json:"created_at"`
}

// --- Methods ---

func (s *AuditService) Log(ctx context.Context, userID pgtype.UUID, action, entity string, entityID pgtype.UUID, before, after any, ipAddress, userAgent string) error {
	var beforeJSON, afterJSON []byte
	var err error

	if before != nil {
		beforeJSON, err = json.Marshal(before)
		if err != nil {
			return fmt.Errorf("marshal before: %w", err)
		}
	}
	if after != nil {
		afterJSON, err = json.Marshal(after)
		if err != nil {
			return fmt.Errorf("marshal after: %w", err)
		}
	}

	_, err = s.queries.CreateAuditLog(ctx, repository.CreateAuditLogParams{
		UsuarioID:       userID,
		Accion:          action,
		Entidad:         entity,
		EntidadID:       entityID,
		DatosAnteriores: beforeJSON,
		DatosNuevos:     afterJSON,
		IpAddress:       pgText(ipAddress),
		UserAgent:       pgText(userAgent),
	})
	if err != nil {
		return fmt.Errorf("create audit log: %w", err)
	}
	return nil
}

func (s *AuditService) ListAuditLog(ctx context.Context, userID pgtype.UUID, entity, actorID, desde, hasta string, limit, offset int32) ([]AuditLogResponse, int, error) {
	var pgActorID pgtype.UUID
	if actorID != "" {
		var err error
		pgActorID, err = pgUUID(actorID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid actor_id")
		}
	}

	var fechaDesde, fechaHasta pgtype.Timestamptz
	if desde != "" {
		t, err := time.Parse("2006-01-02", desde)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid desde format")
		}
		fechaDesde = pgtype.Timestamptz{Time: t, Valid: true}
	}
	if hasta != "" {
		t, err := time.Parse("2006-01-02", hasta)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid hasta format")
		}
		fechaHasta = pgtype.Timestamptz{Time: t.Add(24 * time.Hour), Valid: true}
	}

	items, err := s.queries.ListAuditLog(ctx, repository.ListAuditLogParams{
		UsuarioID:   userID,
		Entidad:     entity,
		ActorID:     pgActorID,
		FechaDesde:  fechaDesde,
		FechaHasta:  fechaHasta,
		QueryLimit:  limit,
		QueryOffset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list audit log: %w", err)
	}

	count, err := s.queries.CountAuditLog(ctx, repository.CountAuditLogParams{
		UsuarioID:  userID,
		Entidad:    entity,
		ActorID:    pgActorID,
		FechaDesde: fechaDesde,
		FechaHasta: fechaHasta,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count audit log: %w", err)
	}

	result := make([]AuditLogResponse, 0, len(items))
	for _, a := range items {
		result = append(result, toAuditLogResponse(a))
	}
	return result, int(count), nil
}

func toAuditLogResponse(a repository.AuditLog) AuditLogResponse {
	return AuditLogResponse{
		ID:              uuidStrFromPg(a.ID),
		UsuarioID:       uuidStrFromPg(a.UsuarioID),
		Accion:          a.Accion,
		Entidad:         a.Entidad,
		EntidadID:       uuidStrFromPg(a.EntidadID),
		DatosAnteriores: a.DatosAnteriores,
		DatosNuevos:     a.DatosNuevos,
		IpAddress:       textFromPg(a.IpAddress),
		UserAgent:       textFromPg(a.UserAgent),
		CreatedAt:       a.CreatedAt.Time.Format(time.RFC3339),
	}
}
