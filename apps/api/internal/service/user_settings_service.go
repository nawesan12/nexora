package service

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserSettingsService struct {
	db *pgxpool.Pool
}

func NewUserSettingsService(db *pgxpool.Pool) *UserSettingsService {
	return &UserSettingsService{db: db}
}

func (s *UserSettingsService) GetDashboardLayout(ctx context.Context, userID pgtype.UUID) (json.RawMessage, error) {
	var layout []byte
	err := s.db.QueryRow(ctx,
		`SELECT dashboard_layout FROM user_settings WHERE usuario_id = $1`, userID).Scan(&layout)
	if err != nil {
		return nil, err
	}
	return layout, nil
}

func (s *UserSettingsService) SaveDashboardLayout(ctx context.Context, userID pgtype.UUID, layout json.RawMessage) error {
	_, err := s.db.Exec(ctx,
		`INSERT INTO user_settings (usuario_id, dashboard_layout) VALUES ($1, $2)
		 ON CONFLICT (usuario_id) DO UPDATE SET dashboard_layout = $2, updated_at = NOW()`, userID, layout)
	return err
}
