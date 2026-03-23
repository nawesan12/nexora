package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrLoteNotFound = errors.New("lote not found")
)

type LoteService struct {
	db *pgxpool.Pool
}

func NewLoteService(db *pgxpool.Pool) *LoteService {
	return &LoteService{db: db}
}

// --- DTOs ---

type LoteResponse struct {
	ID               string  `json:"id"`
	ProductoID       string  `json:"producto_id"`
	ProductoNombre   string  `json:"producto_nombre,omitempty"`
	SucursalID       string  `json:"sucursal_id"`
	SucursalNombre   string  `json:"sucursal_nombre,omitempty"`
	NumeroLote       string  `json:"numero_lote"`
	FechaFabricacion string  `json:"fecha_fabricacion,omitempty"`
	FechaVencimiento string  `json:"fecha_vencimiento,omitempty"`
	CantidadInicial  float64 `json:"cantidad_inicial"`
	CantidadActual   float64 `json:"cantidad_actual"`
	CostoUnitario    float64 `json:"costo_unitario,omitempty"`
	DiasParaVencer   int     `json:"dias_para_vencer,omitempty"`
	Estado           string  `json:"estado"`
	CreatedAt        string  `json:"created_at"`
}

type MovimientoLoteResponse struct {
	ID             string  `json:"id"`
	LoteID         string  `json:"lote_id"`
	Tipo           string  `json:"tipo"`
	Cantidad       float64 `json:"cantidad"`
	ReferenciaTipo string  `json:"referencia_tipo,omitempty"`
	ReferenciaID   string  `json:"referencia_id,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type LoteDetailResponse struct {
	LoteResponse
	Movimientos []MovimientoLoteResponse `json:"movimientos"`
}

type CreateLoteInput struct {
	ProductoID       string  `json:"producto_id" validate:"required,uuid"`
	SucursalID       string  `json:"sucursal_id" validate:"required,uuid"`
	NumeroLote       string  `json:"numero_lote" validate:"required"`
	FechaFabricacion string  `json:"fecha_fabricacion"`
	FechaVencimiento string  `json:"fecha_vencimiento"`
	CantidadInicial  float64 `json:"cantidad_inicial" validate:"required,gt=0"`
	CostoUnitario    float64 `json:"costo_unitario"`
	ProveedorID      string  `json:"proveedor_id"`
	Observaciones    string  `json:"observaciones"`
}

type AjustarStockInput struct {
	Cantidad float64 `json:"cantidad" validate:"required"`
	Motivo   string  `json:"motivo" validate:"required,min=3,max=500"`
}

// --- Estado logic ---

func calcularEstadoLote(cantidadActual float64, fechaVencimiento pgtype.Date) (string, int) {
	if cantidadActual <= 0 {
		return "AGOTADO", 0
	}
	if !fechaVencimiento.Valid {
		return "VIGENTE", 0
	}
	now := time.Now().Truncate(24 * time.Hour)
	venc := fechaVencimiento.Time.Truncate(24 * time.Hour)
	dias := int(math.Ceil(venc.Sub(now).Hours() / 24))
	if dias < 0 {
		return "VENCIDO", dias
	}
	if dias <= 30 {
		return "POR_VENCER", dias
	}
	return "VIGENTE", dias
}

// --- Methods ---

func (s *LoteService) Create(ctx context.Context, userID pgtype.UUID, input CreateLoteInput) (*LoteResponse, error) {
	productoID, err := pgUUID(input.ProductoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	fechaFab, err := pgDate(input.FechaFabricacion)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_fabricacion: %w", err)
	}
	fechaVenc, err := pgDate(input.FechaVencimiento)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha_vencimiento: %w", err)
	}

	var proveedorID pgtype.UUID
	if input.ProveedorID != "" {
		proveedorID, err = pgUUID(input.ProveedorID)
		if err != nil {
			return nil, fmt.Errorf("invalid proveedor_id")
		}
	}

	cantInicial := numericFromFloat(input.CantidadInicial)
	costoUnit := pgtype.Numeric{}
	if input.CostoUnitario > 0 {
		costoUnit = numericFromFloat(input.CostoUnitario)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Insert lote
	var loteID pgtype.UUID
	var createdAt pgtype.Timestamptz
	err = tx.QueryRow(ctx, `
		INSERT INTO lotes_stock (producto_id, sucursal_id, numero_lote, fecha_fabricacion, fecha_vencimiento,
			cantidad_inicial, cantidad_actual, costo_unitario, proveedor_id, observaciones, usuario_id)
		VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10)
		RETURNING id, created_at`,
		productoID, sucursalID, input.NumeroLote, fechaFab, fechaVenc,
		cantInicial, costoUnit, proveedorID, pgText(input.Observaciones), userID,
	).Scan(&loteID, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("insert lote: %w", err)
	}

	// Insert initial INGRESO movement
	_, err = tx.Exec(ctx, `
		INSERT INTO movimientos_lote (lote_id, tipo, cantidad, referencia_tipo, usuario_id)
		VALUES ($1, 'INGRESO', $2, 'INGRESO_INICIAL', $3)`,
		loteID, cantInicial, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("insert movimiento inicial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	estado, dias := calcularEstadoLote(input.CantidadInicial, fechaVenc)

	resp := &LoteResponse{
		ID:              uuidStrFromPg(loteID),
		ProductoID:      input.ProductoID,
		SucursalID:      input.SucursalID,
		NumeroLote:      input.NumeroLote,
		FechaFabricacion: dateFromPg(fechaFab),
		FechaVencimiento: dateFromPg(fechaVenc),
		CantidadInicial: input.CantidadInicial,
		CantidadActual:  input.CantidadInicial,
		CostoUnitario:   input.CostoUnitario,
		DiasParaVencer:  dias,
		Estado:          estado,
		CreatedAt:       createdAt.Time.Format(time.RFC3339),
	}
	return resp, nil
}

func (s *LoteService) List(ctx context.Context, userID pgtype.UUID, productoID, sucursalID string, limit, offset int32) ([]LoteResponse, int, error) {
	// Build filters
	var prodFilter, sucFilter pgtype.UUID
	if productoID != "" {
		p, err := pgUUID(productoID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid producto_id filter")
		}
		prodFilter = p
	}
	if sucursalID != "" {
		s2, err := pgUUID(sucursalID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid sucursal_id filter")
		}
		sucFilter = s2
	}

	// Count
	var total int
	err := s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM lotes_stock ls
		WHERE ls.usuario_id = $1 AND ls.active = true
		AND ($2::uuid IS NULL OR ls.producto_id = $2)
		AND ($3::uuid IS NULL OR ls.sucursal_id = $3)`,
		userID, prodFilter, sucFilter,
	).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count lotes: %w", err)
	}

	// List with joins
	rows, err := s.db.Query(ctx, `
		SELECT ls.id, ls.producto_id, p.nombre AS producto_nombre,
			ls.sucursal_id, s.nombre AS sucursal_nombre,
			ls.numero_lote, ls.fecha_fabricacion, ls.fecha_vencimiento,
			ls.cantidad_inicial, ls.cantidad_actual, ls.costo_unitario,
			ls.created_at
		FROM lotes_stock ls
		JOIN productos p ON p.id = ls.producto_id
		JOIN sucursales s ON s.id = ls.sucursal_id
		WHERE ls.usuario_id = $1 AND ls.active = true
		AND ($2::uuid IS NULL OR ls.producto_id = $2)
		AND ($3::uuid IS NULL OR ls.sucursal_id = $3)
		ORDER BY ls.created_at DESC
		LIMIT $4 OFFSET $5`,
		userID, prodFilter, sucFilter, limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list lotes: %w", err)
	}
	defer rows.Close()

	result := make([]LoteResponse, 0)
	for rows.Next() {
		var (
			id, productoIDPg, sucursalIDPg pgtype.UUID
			productoNombre, sucursalNombre string
			numeroLote                     string
			fechaFab, fechaVenc            pgtype.Date
			cantInicial, cantActual        pgtype.Numeric
			costoUnit                      pgtype.Numeric
			createdAt                      pgtype.Timestamptz
		)
		if err := rows.Scan(&id, &productoIDPg, &productoNombre,
			&sucursalIDPg, &sucursalNombre,
			&numeroLote, &fechaFab, &fechaVenc,
			&cantInicial, &cantActual, &costoUnit,
			&createdAt); err != nil {
			return nil, 0, fmt.Errorf("scan lote: %w", err)
		}

		cantActualF := floatFromNumeric(cantActual)
		estado, dias := calcularEstadoLote(cantActualF, fechaVenc)

		result = append(result, LoteResponse{
			ID:               uuidStrFromPg(id),
			ProductoID:       uuidStrFromPg(productoIDPg),
			ProductoNombre:   productoNombre,
			SucursalID:       uuidStrFromPg(sucursalIDPg),
			SucursalNombre:   sucursalNombre,
			NumeroLote:       numeroLote,
			FechaFabricacion: dateFromPg(fechaFab),
			FechaVencimiento: dateFromPg(fechaVenc),
			CantidadInicial:  floatFromNumeric(cantInicial),
			CantidadActual:   cantActualF,
			CostoUnitario:    floatFromNumeric(costoUnit),
			DiasParaVencer:   dias,
			Estado:           estado,
			CreatedAt:        createdAt.Time.Format(time.RFC3339),
		})
	}
	return result, total, nil
}

func (s *LoteService) Get(ctx context.Context, userID pgtype.UUID, id string) (*LoteDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrLoteNotFound
	}

	var (
		loteID, productoIDPg, sucursalIDPg pgtype.UUID
		productoNombre, sucursalNombre     string
		numeroLote                         string
		fechaFab, fechaVenc                pgtype.Date
		cantInicial, cantActual            pgtype.Numeric
		costoUnit                          pgtype.Numeric
		createdAt                          pgtype.Timestamptz
	)

	err = s.db.QueryRow(ctx, `
		SELECT ls.id, ls.producto_id, p.nombre AS producto_nombre,
			ls.sucursal_id, s.nombre AS sucursal_nombre,
			ls.numero_lote, ls.fecha_fabricacion, ls.fecha_vencimiento,
			ls.cantidad_inicial, ls.cantidad_actual, ls.costo_unitario,
			ls.created_at
		FROM lotes_stock ls
		JOIN productos p ON p.id = ls.producto_id
		JOIN sucursales s ON s.id = ls.sucursal_id
		WHERE ls.id = $1 AND ls.usuario_id = $2 AND ls.active = true`,
		pgID, userID,
	).Scan(&loteID, &productoIDPg, &productoNombre,
		&sucursalIDPg, &sucursalNombre,
		&numeroLote, &fechaFab, &fechaVenc,
		&cantInicial, &cantActual, &costoUnit,
		&createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrLoteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get lote: %w", err)
	}

	cantActualF := floatFromNumeric(cantActual)
	estado, dias := calcularEstadoLote(cantActualF, fechaVenc)

	// Get movements
	movRows, err := s.db.Query(ctx, `
		SELECT id, lote_id, tipo, cantidad, referencia_tipo, referencia_id, created_at
		FROM movimientos_lote
		WHERE lote_id = $1
		ORDER BY created_at DESC`, pgID)
	if err != nil {
		return nil, fmt.Errorf("list movimientos lote: %w", err)
	}
	defer movRows.Close()

	movimientos := make([]MovimientoLoteResponse, 0)
	for movRows.Next() {
		var (
			mID, mLoteID pgtype.UUID
			mTipo        string
			mCantidad    pgtype.Numeric
			mRefTipo     pgtype.Text
			mRefID       pgtype.UUID
			mCreatedAt   pgtype.Timestamptz
		)
		if err := movRows.Scan(&mID, &mLoteID, &mTipo, &mCantidad, &mRefTipo, &mRefID, &mCreatedAt); err != nil {
			return nil, fmt.Errorf("scan movimiento lote: %w", err)
		}
		movimientos = append(movimientos, MovimientoLoteResponse{
			ID:             uuidStrFromPg(mID),
			LoteID:         uuidStrFromPg(mLoteID),
			Tipo:           mTipo,
			Cantidad:       floatFromNumeric(mCantidad),
			ReferenciaTipo: textFromPg(mRefTipo),
			ReferenciaID:   uuidStrFromPg(mRefID),
			CreatedAt:      mCreatedAt.Time.Format(time.RFC3339),
		})
	}

	resp := &LoteDetailResponse{
		LoteResponse: LoteResponse{
			ID:               uuidStrFromPg(loteID),
			ProductoID:       uuidStrFromPg(productoIDPg),
			ProductoNombre:   productoNombre,
			SucursalID:       uuidStrFromPg(sucursalIDPg),
			SucursalNombre:   sucursalNombre,
			NumeroLote:       numeroLote,
			FechaFabricacion: dateFromPg(fechaFab),
			FechaVencimiento: dateFromPg(fechaVenc),
			CantidadInicial:  floatFromNumeric(cantInicial),
			CantidadActual:   cantActualF,
			CostoUnitario:    floatFromNumeric(costoUnit),
			DiasParaVencer:   dias,
			Estado:           estado,
			CreatedAt:        createdAt.Time.Format(time.RFC3339),
		},
		Movimientos: movimientos,
	}
	return resp, nil
}

func (s *LoteService) AjustarStock(ctx context.Context, userID pgtype.UUID, loteID string, input AjustarStockInput) (*LoteResponse, error) {
	pgID, err := pgUUID(loteID)
	if err != nil {
		return nil, ErrLoteNotFound
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Lock the row and verify ownership
	var cantActual pgtype.Numeric
	var fechaVenc pgtype.Date
	err = tx.QueryRow(ctx, `
		SELECT cantidad_actual, fecha_vencimiento FROM lotes_stock
		WHERE id = $1 AND usuario_id = $2 AND active = true
		FOR UPDATE`, pgID, userID,
	).Scan(&cantActual, &fechaVenc)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrLoteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("lock lote: %w", err)
	}

	newCant := floatFromNumeric(cantActual) + input.Cantidad
	if newCant < 0 {
		return nil, fmt.Errorf("stock insuficiente en el lote")
	}

	newCantNum := numericFromFloat(newCant)

	// Update cantidad_actual
	_, err = tx.Exec(ctx, `
		UPDATE lotes_stock SET cantidad_actual = $1, updated_at = NOW()
		WHERE id = $2`, newCantNum, pgID)
	if err != nil {
		return nil, fmt.Errorf("update lote cantidad: %w", err)
	}

	// Determine movement type
	tipo := "AJUSTE"
	cantMov := numericFromFloat(input.Cantidad)

	_, err = tx.Exec(ctx, `
		INSERT INTO movimientos_lote (lote_id, tipo, cantidad, referencia_tipo, usuario_id)
		VALUES ($1, $2, $3, $4, $5)`,
		pgID, tipo, cantMov, pgText(input.Motivo), userID,
	)
	if err != nil {
		return nil, fmt.Errorf("insert movimiento ajuste: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	// Return updated lote
	return s.getSimpleLote(ctx, userID, loteID)
}

func (s *LoteService) GetAlertasVencimiento(ctx context.Context, userID pgtype.UUID, dias int) ([]LoteResponse, error) {
	if dias <= 0 {
		dias = 30
	}

	rows, err := s.db.Query(ctx, `
		SELECT ls.id, ls.producto_id, p.nombre AS producto_nombre,
			ls.sucursal_id, s.nombre AS sucursal_nombre,
			ls.numero_lote, ls.fecha_fabricacion, ls.fecha_vencimiento,
			ls.cantidad_inicial, ls.cantidad_actual, ls.costo_unitario,
			ls.created_at
		FROM lotes_stock ls
		JOIN productos p ON p.id = ls.producto_id
		JOIN sucursales s ON s.id = ls.sucursal_id
		WHERE ls.usuario_id = $1 AND ls.active = true
		AND ls.cantidad_actual > 0
		AND ls.fecha_vencimiento IS NOT NULL
		AND ls.fecha_vencimiento <= CURRENT_DATE + ($2 || ' days')::interval
		ORDER BY ls.fecha_vencimiento ASC`,
		userID, fmt.Sprintf("%d", dias),
	)
	if err != nil {
		return nil, fmt.Errorf("list alertas vencimiento: %w", err)
	}
	defer rows.Close()

	return s.scanLoteRows(rows)
}

func (s *LoteService) GetLotesFIFO(ctx context.Context, userID pgtype.UUID, productoID, sucursalID string, cantidad float64) ([]LoteResponse, error) {
	prodID, err := pgUUID(productoID)
	if err != nil {
		return nil, fmt.Errorf("invalid producto_id")
	}
	sucID, err := pgUUID(sucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	rows, err := s.db.Query(ctx, `
		SELECT ls.id, ls.producto_id, p.nombre AS producto_nombre,
			ls.sucursal_id, s.nombre AS sucursal_nombre,
			ls.numero_lote, ls.fecha_fabricacion, ls.fecha_vencimiento,
			ls.cantidad_inicial, ls.cantidad_actual, ls.costo_unitario,
			ls.created_at
		FROM lotes_stock ls
		JOIN productos p ON p.id = ls.producto_id
		JOIN sucursales s ON s.id = ls.sucursal_id
		WHERE ls.usuario_id = $1 AND ls.active = true
		AND ls.producto_id = $2
		AND ls.sucursal_id = $3
		AND ls.cantidad_actual > 0
		ORDER BY ls.created_at ASC`,
		userID, prodID, sucID,
	)
	if err != nil {
		return nil, fmt.Errorf("list lotes FIFO: %w", err)
	}
	defer rows.Close()

	allLotes, err := s.scanLoteRows(rows)
	if err != nil {
		return nil, err
	}

	// Select lots in FIFO order to cover requested quantity
	result := make([]LoteResponse, 0)
	remaining := cantidad
	for _, lote := range allLotes {
		if remaining <= 0 {
			break
		}
		result = append(result, lote)
		remaining -= lote.CantidadActual
	}

	return result, nil
}

// --- Internal helpers ---

func (s *LoteService) getSimpleLote(ctx context.Context, userID pgtype.UUID, id string) (*LoteResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrLoteNotFound
	}

	var (
		loteID, productoIDPg, sucursalIDPg pgtype.UUID
		productoNombre, sucursalNombre     string
		numeroLote                         string
		fechaFab, fechaVenc                pgtype.Date
		cantInicial, cantActual            pgtype.Numeric
		costoUnit                          pgtype.Numeric
		createdAt                          pgtype.Timestamptz
	)

	err = s.db.QueryRow(ctx, `
		SELECT ls.id, ls.producto_id, p.nombre AS producto_nombre,
			ls.sucursal_id, s.nombre AS sucursal_nombre,
			ls.numero_lote, ls.fecha_fabricacion, ls.fecha_vencimiento,
			ls.cantidad_inicial, ls.cantidad_actual, ls.costo_unitario,
			ls.created_at
		FROM lotes_stock ls
		JOIN productos p ON p.id = ls.producto_id
		JOIN sucursales s ON s.id = ls.sucursal_id
		WHERE ls.id = $1 AND ls.usuario_id = $2 AND ls.active = true`,
		pgID, userID,
	).Scan(&loteID, &productoIDPg, &productoNombre,
		&sucursalIDPg, &sucursalNombre,
		&numeroLote, &fechaFab, &fechaVenc,
		&cantInicial, &cantActual, &costoUnit,
		&createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrLoteNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get lote: %w", err)
	}

	cantActualF := floatFromNumeric(cantActual)
	estado, dias := calcularEstadoLote(cantActualF, fechaVenc)

	return &LoteResponse{
		ID:               uuidStrFromPg(loteID),
		ProductoID:       uuidStrFromPg(productoIDPg),
		ProductoNombre:   productoNombre,
		SucursalID:       uuidStrFromPg(sucursalIDPg),
		SucursalNombre:   sucursalNombre,
		NumeroLote:       numeroLote,
		FechaFabricacion: dateFromPg(fechaFab),
		FechaVencimiento: dateFromPg(fechaVenc),
		CantidadInicial:  floatFromNumeric(cantInicial),
		CantidadActual:   cantActualF,
		CostoUnitario:    floatFromNumeric(costoUnit),
		DiasParaVencer:   dias,
		Estado:           estado,
		CreatedAt:        createdAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *LoteService) scanLoteRows(rows pgx.Rows) ([]LoteResponse, error) {
	result := make([]LoteResponse, 0)
	for rows.Next() {
		var (
			id, productoIDPg, sucursalIDPg pgtype.UUID
			productoNombre, sucursalNombre string
			numeroLote                     string
			fechaFab, fechaVenc            pgtype.Date
			cantInicial, cantActual        pgtype.Numeric
			costoUnit                      pgtype.Numeric
			createdAt                      pgtype.Timestamptz
		)
		if err := rows.Scan(&id, &productoIDPg, &productoNombre,
			&sucursalIDPg, &sucursalNombre,
			&numeroLote, &fechaFab, &fechaVenc,
			&cantInicial, &cantActual, &costoUnit,
			&createdAt); err != nil {
			return nil, fmt.Errorf("scan lote: %w", err)
		}

		cantActualF := floatFromNumeric(cantActual)
		estado, dias := calcularEstadoLote(cantActualF, fechaVenc)

		result = append(result, LoteResponse{
			ID:               uuidStrFromPg(id),
			ProductoID:       uuidStrFromPg(productoIDPg),
			ProductoNombre:   productoNombre,
			SucursalID:       uuidStrFromPg(sucursalIDPg),
			SucursalNombre:   sucursalNombre,
			NumeroLote:       numeroLote,
			FechaFabricacion: dateFromPg(fechaFab),
			FechaVencimiento: dateFromPg(fechaVenc),
			CantidadInicial:  floatFromNumeric(cantInicial),
			CantidadActual:   cantActualF,
			CostoUnitario:    floatFromNumeric(costoUnit),
			DiasParaVencer:   dias,
			Estado:           estado,
			CreatedAt:        createdAt.Time.Format(time.RFC3339),
		})
	}
	return result, nil
}
