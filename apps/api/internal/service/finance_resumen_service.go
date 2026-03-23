package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
	"golang.org/x/sync/errgroup"
)

type FinanceResumenService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewFinanceResumenService(db *pgxpool.Pool) *FinanceResumenService {
	return &FinanceResumenService{
		db:      db,
		queries: repository.New(db),
	}
}

type FinanceResumenResponse struct {
	TotalIngresos         float64              `json:"total_ingresos"`
	TotalEgresos          float64              `json:"total_egresos"`
	SaldoCajas            float64              `json:"saldo_cajas"`
	TotalChequesPendientes int64               `json:"total_cheques_pendientes"`
	TotalGastosMes        float64              `json:"total_gastos_mes"`
	UltimosMovimientos    []MovimientoResumen  `json:"ultimos_movimientos"`
	ChequesPorVencer      []ChequeResumen      `json:"cheques_por_vencer"`
}

type MovimientoResumen struct {
	ID        string  `json:"id"`
	Tipo      string  `json:"tipo"`
	Monto     float64 `json:"monto"`
	Concepto  string  `json:"concepto"`
	CreatedAt string  `json:"created_at"`
	CajaNombre string `json:"caja_nombre"`
}

type ChequeResumen struct {
	ID               string  `json:"id"`
	Numero           string  `json:"numero"`
	Monto            float64 `json:"monto"`
	FechaVencimiento string  `json:"fecha_vencimiento"`
	Estado           string  `json:"estado"`
	Banco            *string `json:"banco,omitempty"`
	Emisor           *string `json:"emisor,omitempty"`
}

func (s *FinanceResumenService) GetResumen(ctx context.Context, userID pgtype.UUID) (*FinanceResumenResponse, error) {
	var (
		saldoCajas         pgtype.Numeric
		ingresosMes        pgtype.Numeric
		egresosMes         pgtype.Numeric
		chequesPendientes  int64
		gastosMes          pgtype.Numeric
		movimientos        []repository.FinanceResumenUltimosMovimientosRow
		cheques            []repository.FinanceResumenChequesPorVencerRow
	)

	g, gctx := errgroup.WithContext(ctx)

	g.Go(func() error {
		var err error
		saldoCajas, err = s.queries.FinanceResumenSaldoCajas(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		ingresosMes, err = s.queries.FinanceResumenIngresosMes(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		egresosMes, err = s.queries.FinanceResumenEgresosMes(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		chequesPendientes, err = s.queries.FinanceResumenChequesPendientes(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		gastosMes, err = s.queries.FinanceResumenGastosMes(gctx, userID)
		return err
	})
	g.Go(func() error {
		var err error
		movimientos, err = s.queries.FinanceResumenUltimosMovimientos(gctx, repository.FinanceResumenUltimosMovimientosParams{
			UsuarioID: userID,
			Limit:     10,
		})
		return err
	})
	g.Go(func() error {
		var err error
		cheques, err = s.queries.FinanceResumenChequesPorVencer(gctx, repository.FinanceResumenChequesPorVencerParams{
			UsuarioID: userID,
			Limit:     10,
		})
		return err
	})

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("finance resumen queries: %w", err)
	}

	resp := &FinanceResumenResponse{
		TotalIngresos:          numericToFloat64(ingresosMes),
		TotalEgresos:           numericToFloat64(egresosMes),
		SaldoCajas:             numericToFloat64(saldoCajas),
		TotalChequesPendientes: chequesPendientes,
		TotalGastosMes:         numericToFloat64(gastosMes),
	}

	resp.UltimosMovimientos = make([]MovimientoResumen, len(movimientos))
	for i, m := range movimientos {
		resp.UltimosMovimientos[i] = MovimientoResumen{
			ID:         fmt.Sprintf("%x", m.ID.Bytes),
			Tipo:       m.Tipo,
			Monto:      numericToFloat64(m.Monto),
			Concepto:   m.Concepto,
			CreatedAt:  m.CreatedAt.Time.Format(time.RFC3339),
			CajaNombre: m.CajaNombre,
		}
	}

	resp.ChequesPorVencer = make([]ChequeResumen, len(cheques))
	for i, c := range cheques {
		ch := ChequeResumen{
			ID:     fmt.Sprintf("%x", c.ID.Bytes),
			Numero: c.Numero,
			Monto:  numericToFloat64(c.Monto),
			Estado: c.Estado,
		}
		if c.FechaVencimiento.Valid {
			ch.FechaVencimiento = c.FechaVencimiento.Time.Format("2006-01-02")
		}
		if c.Banco.Valid {
			ch.Banco = &c.Banco.String
		}
		if c.Emisor.Valid {
			ch.Emisor = &c.Emisor.String
		}
		resp.ChequesPorVencer[i] = ch
	}

	return resp, nil
}
