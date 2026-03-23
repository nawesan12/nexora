package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
	"github.com/pronto-erp/pronto/internal/ws"
)

const EventNotificationNew = "notification:new"

type NotificationService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
	hub     *ws.Hub
}

func NewNotificationService(db *pgxpool.Pool, hub *ws.Hub) *NotificationService {
	return &NotificationService{
		db:      db,
		queries: repository.New(db),
		hub:     hub,
	}
}

// --- DTOs ---

type NotificacionResponse struct {
	ID             string          `json:"id"`
	DestinatarioID string          `json:"destinatario_id"`
	Tipo           string          `json:"tipo"`
	Titulo         string          `json:"titulo"`
	Mensaje        string          `json:"mensaje"`
	Enlace         string          `json:"enlace,omitempty"`
	Leida          bool            `json:"leida"`
	FechaLeida     string          `json:"fecha_leida,omitempty"`
	Metadata       json.RawMessage `json:"metadata,omitempty"`
	CreatedAt      string          `json:"created_at"`
}

type CreateNotificacionInput struct {
	DestinatarioID pgtype.UUID              `json:"-"`
	Tipo           repository.TipoNotificacion `json:"tipo"`
	Titulo         string                   `json:"titulo"`
	Mensaje        string                   `json:"mensaje"`
	Enlace         string                   `json:"enlace,omitempty"`
	Metadata       map[string]interface{}   `json:"metadata,omitempty"`
}

// --- Methods ---

func (s *NotificationService) Create(ctx context.Context, input CreateNotificacionInput) (*NotificacionResponse, error) {
	var metadataBytes []byte
	if input.Metadata != nil {
		var err error
		metadataBytes, err = json.Marshal(input.Metadata)
		if err != nil {
			return nil, fmt.Errorf("marshal metadata: %w", err)
		}
	}

	n, err := s.queries.CreateNotificacion(ctx, repository.CreateNotificacionParams{
		DestinatarioID: input.DestinatarioID,
		Tipo:           input.Tipo,
		Titulo:         input.Titulo,
		Mensaje:        input.Mensaje,
		Enlace:         pgText(input.Enlace),
		Metadata:       metadataBytes,
	})
	if err != nil {
		return nil, fmt.Errorf("create notificacion: %w", err)
	}

	resp := toNotificacionResponse(n)

	// Broadcast via WebSocket to the user's notification room
	if s.hub != nil {
		room := "user:" + uuidStrFromPg(input.DestinatarioID)
		s.hub.BroadcastToRoom(room, ws.Event{
			Type:    EventNotificationNew,
			Payload: resp,
		})
	}

	return resp, nil
}

func (s *NotificationService) ListForUser(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]NotificacionResponse, int, error) {
	items, err := s.queries.ListNotificaciones(ctx, repository.ListNotificacionesParams{
		DestinatarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list notificaciones: %w", err)
	}

	count, err := s.queries.CountNotificaciones(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count notificaciones: %w", err)
	}

	result := make([]NotificacionResponse, 0, len(items))
	for _, n := range items {
		result = append(result, *toNotificacionResponse(n))
	}
	return result, int(count), nil
}

func (s *NotificationService) MarkAsRead(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return fmt.Errorf("invalid notification id")
	}

	return s.queries.MarkAsRead(ctx, repository.MarkNotificacionReadParams{
		ID: pgID, DestinatarioID: userID,
	})
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID pgtype.UUID) error {
	return s.queries.MarkAllAsRead(ctx, userID)
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID pgtype.UUID) (int, error) {
	count, err := s.queries.GetUnreadCount(ctx, userID)
	if err != nil {
		return 0, fmt.Errorf("get unread count: %w", err)
	}
	return int(count), nil
}

func toNotificacionResponse(n repository.Notificacion) *NotificacionResponse {
	resp := &NotificacionResponse{
		ID:             uuidStrFromPg(n.ID),
		DestinatarioID: uuidStrFromPg(n.DestinatarioID),
		Tipo:           string(n.Tipo),
		Titulo:         n.Titulo,
		Mensaje:        n.Mensaje,
		Enlace:         textFromPg(n.Enlace),
		Leida:          n.Leida,
		Metadata:       n.Metadata,
		CreatedAt:      n.CreatedAt.Time.Format(time.RFC3339),
	}
	if n.FechaLeida.Valid {
		resp.FechaLeida = n.FechaLeida.Time.Format(time.RFC3339)
	}
	return resp
}
