package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DebCredService struct {
	db *pgxpool.Pool
}

func NewDebCredService(db *pgxpool.Pool) *DebCredService {
	return &DebCredService{db: db}
}

type DebCredRecord struct {
	ID               string  `json:"id"`
	MovimientoCajaID string  `json:"movimiento_caja_id"`
	Tipo             string  `json:"tipo"`
	BaseImponible    float64 `json:"base_imponible"`
	Alicuota         float64 `json:"alicuota"`
	Monto            float64 `json:"monto"`
	Periodo          string  `json:"periodo"`
	CreatedAt        string  `json:"created_at"`
}

// CalculateAndRecord creates a bank debit/credit tax record.
// tipo: "DEBITO" or "CREDITO"
// Returns nil if the bank entity is exempt or the caja is not of type BANCO.
func (s *DebCredService) CalculateAndRecord(ctx context.Context, userID pgtype.UUID, movimientoCajaID pgtype.UUID, tipo string, monto float64, cajaID pgtype.UUID) error {
	if tipo != "DEBITO" && tipo != "CREDITO" {
		return fmt.Errorf("tipo must be DEBITO or CREDITO, got %s", tipo)
	}

	// 1. Check if the caja is a BANCO type - if not, skip
	var tipoCaja string
	err := s.db.QueryRow(ctx,
		`SELECT tipo FROM cajas WHERE id = $1 AND usuario_id = $2`,
		cajaID, userID,
	).Scan(&tipoCaja)
	if err != nil {
		return fmt.Errorf("get caja tipo: %w", err)
	}
	if tipoCaja != "BANCO" {
		return nil // Only applies to bank accounts
	}

	// 2. Check if the bank entity linked to the caja is exento_debcred
	// Find the entidad_bancaria associated with this caja via sucursal
	var exento bool
	err = s.db.QueryRow(ctx,
		`SELECT COALESCE(eb.exento_debcred, false)
		 FROM entidades_bancarias eb
		 JOIN cajas c ON c.sucursal_id = eb.sucursal_id AND c.usuario_id = eb.usuario_id
		 WHERE c.id = $1 AND c.usuario_id = $2
		 LIMIT 1`,
		cajaID, userID,
	).Scan(&exento)
	if err != nil {
		// No linked bank entity found, skip
		return nil
	}
	if exento {
		return nil // Bank entity is exempt
	}

	// 3. Calculate: impuesto = monto * 0.006 (0.6%)
	alicuota := 0.006
	impuesto := monto * alicuota
	if impuesto < 0 {
		impuesto = -impuesto
	}

	// 4. Insert into impuesto_debcred with periodo = current YYYY-MM
	periodo := time.Now().Format("2006-01")

	_, err = s.db.Exec(ctx,
		`INSERT INTO impuesto_debcred (movimiento_caja_id, tipo, base_imponible, alicuota, monto, periodo, usuario_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		movimientoCajaID, tipo, monto, alicuota, impuesto, periodo, userID,
	)
	if err != nil {
		return fmt.Errorf("insert impuesto_debcred: %w", err)
	}

	return nil
}

// GetMonthlyTotal returns the accumulated tax for a given period.
// Returns (totalDebitos, totalCreditos, error).
func (s *DebCredService) GetMonthlyTotal(ctx context.Context, userID pgtype.UUID, periodo string) (float64, float64, error) {
	rows, err := s.db.Query(ctx,
		`SELECT tipo, COALESCE(SUM(monto), 0)
		 FROM impuesto_debcred
		 WHERE usuario_id = $1 AND periodo = $2
		 GROUP BY tipo`,
		userID, periodo,
	)
	if err != nil {
		return 0, 0, fmt.Errorf("query impuesto_debcred: %w", err)
	}
	defer rows.Close()

	var totalDebitos, totalCreditos float64
	for rows.Next() {
		var tipo string
		var total float64
		if err := rows.Scan(&tipo, &total); err != nil {
			return 0, 0, fmt.Errorf("scan impuesto_debcred: %w", err)
		}
		switch tipo {
		case "DEBITO":
			totalDebitos = total
		case "CREDITO":
			totalCreditos = total
		}
	}
	if err := rows.Err(); err != nil {
		return 0, 0, fmt.Errorf("rows impuesto_debcred: %w", err)
	}

	return totalDebitos, totalCreditos, nil
}
