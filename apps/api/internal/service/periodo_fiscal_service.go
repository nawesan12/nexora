package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrPeriodoNotFound = errors.New("fiscal period not found")
	ErrPeriodoCerrado  = errors.New("no se puede registrar operaciones en un periodo cerrado")
	ErrPeriodoYaCerrado = errors.New("el periodo ya esta cerrado")
	ErrPeriodoYaAbierto = errors.New("el periodo ya esta abierto")
)

type PeriodoFiscalService struct {
	db *pgxpool.Pool
}

func NewPeriodoFiscalService(db *pgxpool.Pool) *PeriodoFiscalService {
	return &PeriodoFiscalService{db: db}
}

type PeriodoFiscalResponse struct {
	ID          string `json:"id"`
	Anio        int    `json:"anio"`
	Mes         int    `json:"mes"`
	Estado      string `json:"estado"`
	FechaCierre string `json:"fecha_cierre,omitempty"`
	CreatedAt   string `json:"created_at"`
}

// EnsureOpen creates the period if it doesn't exist, returns error if it's closed.
func (s *PeriodoFiscalService) EnsureOpen(ctx context.Context, userID pgtype.UUID, date time.Time) error {
	anio := date.Year()
	mes := int(date.Month())

	var estado string
	err := s.db.QueryRow(ctx,
		`SELECT estado FROM periodos_fiscales WHERE usuario_id = $1 AND anio = $2 AND mes = $3`,
		userID, anio, mes).Scan(&estado)

	if err != nil {
		// Period doesn't exist — auto-create it as ABIERTO
		_, err = s.db.Exec(ctx,
			`INSERT INTO periodos_fiscales (anio, mes, estado, usuario_id) VALUES ($1, $2, 'ABIERTO', $3)
			 ON CONFLICT (anio, mes, usuario_id) DO NOTHING`,
			anio, mes, userID)
		if err != nil {
			return fmt.Errorf("create periodo: %w", err)
		}
		return nil
	}

	if estado == "CERRADO" {
		return fmt.Errorf("%w (%d-%02d)", ErrPeriodoCerrado, anio, mes)
	}
	return nil
}

// List returns all fiscal periods for the user.
func (s *PeriodoFiscalService) List(ctx context.Context, userID pgtype.UUID) ([]PeriodoFiscalResponse, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, anio, mes, estado, fecha_cierre, created_at
		 FROM periodos_fiscales WHERE usuario_id = $1
		 ORDER BY anio DESC, mes DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("list periodos: %w", err)
	}
	defer rows.Close()

	var results []PeriodoFiscalResponse
	for rows.Next() {
		var r PeriodoFiscalResponse
		var fechaCierre *time.Time
		var createdAt time.Time
		if err := rows.Scan(&r.ID, &r.Anio, &r.Mes, &r.Estado, &fechaCierre, &createdAt); err != nil {
			return nil, fmt.Errorf("scan periodo: %w", err)
		}
		if fechaCierre != nil {
			r.FechaCierre = fechaCierre.Format(time.RFC3339)
		}
		r.CreatedAt = createdAt.Format(time.RFC3339)
		results = append(results, r)
	}
	return results, nil
}

// Close marks a period as closed.
func (s *PeriodoFiscalService) Close(ctx context.Context, userID pgtype.UUID, anio, mes int) error {
	result, err := s.db.Exec(ctx,
		`UPDATE periodos_fiscales SET estado = 'CERRADO', fecha_cierre = NOW(), cerrado_por = $3
		 WHERE usuario_id = $1 AND anio = $4 AND mes = $5 AND estado = 'ABIERTO'`,
		userID, nil, userID, anio, mes)
	if err != nil {
		return fmt.Errorf("close periodo: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrPeriodoYaCerrado
	}
	return nil
}

// Reopen marks a closed period as open again.
func (s *PeriodoFiscalService) Reopen(ctx context.Context, userID pgtype.UUID, anio, mes int) error {
	result, err := s.db.Exec(ctx,
		`UPDATE periodos_fiscales SET estado = 'ABIERTO', fecha_cierre = NULL, cerrado_por = NULL
		 WHERE usuario_id = $1 AND anio = $2 AND mes = $3 AND estado = 'CERRADO'`,
		userID, anio, mes)
	if err != nil {
		return fmt.Errorf("reopen periodo: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrPeriodoYaAbierto
	}
	return nil
}
