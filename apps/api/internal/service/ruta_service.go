package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
)

var (
	ErrRutaNotFound = errors.New("ruta not found")
)

type RutaService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewRutaService(db *pgxpool.Pool) *RutaService {
	return &RutaService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type RutaResponse struct {
	ID                  string `json:"id"`
	Nombre              string `json:"nombre"`
	ZonaID              string `json:"zona_id,omitempty"`
	ZonaNombre          string `json:"zona_nombre,omitempty"`
	VehiculoID          string `json:"vehiculo_id,omitempty"`
	VehiculoPatente     string `json:"vehiculo_patente,omitempty"`
	VehiculoDescripcion string `json:"vehiculo_descripcion,omitempty"`
	DiaSemana           *int   `json:"dia_semana"`
	HoraSalidaEstimada  string `json:"hora_salida_estimada,omitempty"`
	Notas               string `json:"notas,omitempty"`
	SucursalID          string `json:"sucursal_id"`
	SucursalNombre      string `json:"sucursal_nombre,omitempty"`
	CreatedAt           string `json:"created_at"`
}

type RutaDetailResponse struct {
	RutaResponse
	Paradas []RutaParadaResponse `json:"paradas"`
}

type RutaListResponse struct {
	ID             string `json:"id"`
	Nombre         string `json:"nombre"`
	ZonaNombre     string `json:"zona_nombre,omitempty"`
	VehiculoPatente string `json:"vehiculo_patente,omitempty"`
	SucursalNombre string `json:"sucursal_nombre,omitempty"`
	DiaSemana      *int   `json:"dia_semana"`
	ParadasCount   int    `json:"paradas_count"`
	CreatedAt      string `json:"created_at"`
}

type RutaParadaResponse struct {
	ID                     string `json:"id"`
	ClienteID              string `json:"cliente_id"`
	ClienteNombre          string `json:"cliente_nombre"`
	DireccionID            string `json:"direccion_id,omitempty"`
	DireccionCalle         string `json:"direccion_calle,omitempty"`
	DireccionNumero        string `json:"direccion_numero,omitempty"`
	DireccionCiudad        string `json:"direccion_ciudad,omitempty"`
	Orden                  int    `json:"orden"`
	TiempoEstimadoMinutos  int    `json:"tiempo_estimado_minutos"`
	Notas                  string `json:"notas,omitempty"`
}

type CreateRutaInput struct {
	Nombre             string              `json:"nombre" validate:"required,min=2,max=200"`
	ZonaID             string              `json:"zona_id"`
	VehiculoID         string              `json:"vehiculo_id"`
	DiaSemana          *int                `json:"dia_semana"`
	HoraSalidaEstimada string              `json:"hora_salida_estimada"`
	Notas              string              `json:"notas"`
	SucursalID         string              `json:"sucursal_id" validate:"required,uuid"`
	Paradas            []CreateParadaInput `json:"paradas"`
}

type CreateParadaInput struct {
	ClienteID             string `json:"cliente_id" validate:"required,uuid"`
	DireccionID           string `json:"direccion_id"`
	Orden                 int    `json:"orden"`
	TiempoEstimadoMinutos int    `json:"tiempo_estimado_minutos"`
	Notas                 string `json:"notas"`
}

type GenerarRepartoInput struct {
	Fecha      string `json:"fecha" validate:"required"`
	EmpleadoID string `json:"empleado_id" validate:"required,uuid"`
}

// --- Methods ---

func (s *RutaService) Create(ctx context.Context, userID pgtype.UUID, input CreateRutaInput) (*RutaDetailResponse, error) {
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	var zonaID pgtype.UUID
	if input.ZonaID != "" {
		zonaID, err = pgUUID(input.ZonaID)
		if err != nil {
			return nil, fmt.Errorf("invalid zona_id")
		}
	}

	var vehiculoID pgtype.UUID
	if input.VehiculoID != "" {
		vehiculoID, err = pgUUID(input.VehiculoID)
		if err != nil {
			return nil, fmt.Errorf("invalid vehiculo_id")
		}
	}

	var diaSemana pgtype.Int4
	if input.DiaSemana != nil {
		diaSemana = pgtype.Int4{Int32: int32(*input.DiaSemana), Valid: true}
	}

	var horaSalida pgtype.Time
	if input.HoraSalidaEstimada != "" {
		t, err := time.Parse("15:04", input.HoraSalidaEstimada)
		if err == nil {
			horaSalida = pgtype.Time{
				Microseconds: int64(t.Hour()*3600+t.Minute()*60+t.Second()) * 1000000,
				Valid:        true,
			}
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	ruta, err := qtx.CreateRuta(ctx, repository.CreateRutaParams{
		Nombre:              input.Nombre,
		ZonaID:              zonaID,
		VehiculoID:          vehiculoID,
		DiaSemana:           diaSemana,
		HoraSalidaEstimada:  horaSalida,
		Notas:               pgText(input.Notas),
		SucursalID:          sucursalID,
		UsuarioID:           userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create ruta: %w", err)
	}

	for _, p := range input.Paradas {
		clienteID, err := pgUUID(p.ClienteID)
		if err != nil {
			return nil, fmt.Errorf("invalid cliente_id in parada")
		}

		var direccionID pgtype.UUID
		if p.DireccionID != "" {
			direccionID, err = pgUUID(p.DireccionID)
			if err != nil {
				return nil, fmt.Errorf("invalid direccion_id in parada")
			}
		}

		tiempoEst := int32(15)
		if p.TiempoEstimadoMinutos > 0 {
			tiempoEst = int32(p.TiempoEstimadoMinutos)
		}

		_, err = qtx.CreateRutaParada(ctx, repository.CreateRutaParadaParams{
			RutaID:                ruta.ID,
			ClienteID:             clienteID,
			DireccionID:           direccionID,
			Orden:                 int32(p.Orden),
			TiempoEstimadoMinutos: pgtype.Int4{Int32: tiempoEst, Valid: true},
			Notas:                 pgText(p.Notas),
		})
		if err != nil {
			return nil, fmt.Errorf("create ruta parada: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(ruta.ID))
}

func (s *RutaService) Get(ctx context.Context, userID pgtype.UUID, id string) (*RutaDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRutaNotFound
	}

	r, err := s.queries.GetRutaByID(ctx, repository.GetRutaByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRutaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get ruta: %w", err)
	}

	paradas, err := s.queries.ListRutaParadas(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list ruta paradas: %w", err)
	}

	resp := &RutaDetailResponse{
		RutaResponse: toRutaResponse(r),
	}

	resp.Paradas = make([]RutaParadaResponse, 0, len(paradas))
	for _, p := range paradas {
		clienteNombre := p.ClienteNombre
		if p.ClienteApellido.Valid && p.ClienteApellido.String != "" {
			clienteNombre += " " + p.ClienteApellido.String
		}
		resp.Paradas = append(resp.Paradas, RutaParadaResponse{
			ID:                    uuidStrFromPg(p.ID),
			ClienteID:             uuidStrFromPg(p.ClienteID),
			ClienteNombre:         clienteNombre,
			DireccionID:           uuidStrFromPg(p.DireccionID),
			DireccionCalle:        textFromPg(p.DireccionCalle),
			DireccionNumero:       textFromPg(p.DireccionNumero),
			DireccionCiudad:       textFromPg(p.DireccionCiudad),
			Orden:                 int(p.Orden),
			TiempoEstimadoMinutos: int(p.TiempoEstimadoMinutos.Int32),
			Notas:                 textFromPg(p.Notas),
		})
	}

	return resp, nil
}

func (s *RutaService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]RutaListResponse, int, error) {
	items, err := s.queries.ListRutas(ctx, repository.ListRutasParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list rutas: %w", err)
	}
	count, err := s.queries.CountRutas(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count rutas: %w", err)
	}

	result := make([]RutaListResponse, 0, len(items))
	for _, r := range items {
		item := RutaListResponse{
			ID:              uuidStrFromPg(r.ID),
			Nombre:          r.Nombre,
			ZonaNombre:      textFromPg(r.ZonaNombre),
			VehiculoPatente: textFromPg(r.VehiculoPatente),
			SucursalNombre:  r.SucursalNombre,
			ParadasCount:    int(r.ParadasCount),
			CreatedAt:       r.CreatedAt.Time.Format(time.RFC3339),
		}
		if r.DiaSemana.Valid {
			d := int(r.DiaSemana.Int32)
			item.DiaSemana = &d
		}
		result = append(result, item)
	}
	return result, int(count), nil
}

func (s *RutaService) Update(ctx context.Context, userID pgtype.UUID, id string, input CreateRutaInput) (*RutaDetailResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRutaNotFound
	}

	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	var zonaID pgtype.UUID
	if input.ZonaID != "" {
		zonaID, err = pgUUID(input.ZonaID)
		if err != nil {
			return nil, fmt.Errorf("invalid zona_id")
		}
	}

	var vehiculoID pgtype.UUID
	if input.VehiculoID != "" {
		vehiculoID, err = pgUUID(input.VehiculoID)
		if err != nil {
			return nil, fmt.Errorf("invalid vehiculo_id")
		}
	}

	var diaSemana pgtype.Int4
	if input.DiaSemana != nil {
		diaSemana = pgtype.Int4{Int32: int32(*input.DiaSemana), Valid: true}
	}

	var horaSalida pgtype.Time
	if input.HoraSalidaEstimada != "" {
		t, err := time.Parse("15:04", input.HoraSalidaEstimada)
		if err == nil {
			horaSalida = pgtype.Time{
				Microseconds: int64(t.Hour()*3600+t.Minute()*60+t.Second()) * 1000000,
				Valid:        true,
			}
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	_, err = qtx.UpdateRuta(ctx, repository.UpdateRutaParams{
		ID:                 pgID,
		UsuarioID:          userID,
		Nombre:             input.Nombre,
		ZonaID:             zonaID,
		VehiculoID:         vehiculoID,
		DiaSemana:          diaSemana,
		HoraSalidaEstimada: horaSalida,
		Notas:              pgText(input.Notas),
		SucursalID:         sucursalID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRutaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update ruta: %w", err)
	}

	// Replace paradas
	err = qtx.DeleteRutaParadasByRuta(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("delete paradas: %w", err)
	}

	for _, p := range input.Paradas {
		clienteID, err := pgUUID(p.ClienteID)
		if err != nil {
			return nil, fmt.Errorf("invalid cliente_id in parada")
		}

		var direccionID pgtype.UUID
		if p.DireccionID != "" {
			direccionID, err = pgUUID(p.DireccionID)
			if err != nil {
				return nil, fmt.Errorf("invalid direccion_id in parada")
			}
		}

		tiempoEst := int32(15)
		if p.TiempoEstimadoMinutos > 0 {
			tiempoEst = int32(p.TiempoEstimadoMinutos)
		}

		_, err = qtx.CreateRutaParada(ctx, repository.CreateRutaParadaParams{
			RutaID:                pgID,
			ClienteID:             clienteID,
			DireccionID:           direccionID,
			Orden:                 int32(p.Orden),
			TiempoEstimadoMinutos: pgtype.Int4{Int32: tiempoEst, Valid: true},
			Notas:                 pgText(p.Notas),
		})
		if err != nil {
			return nil, fmt.Errorf("create ruta parada: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *RutaService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrRutaNotFound
	}
	return s.queries.SoftDeleteRuta(ctx, repository.SoftDeleteRutaParams{
		ID: pgID, UsuarioID: userID,
	})
}

func (s *RutaService) GenerarReparto(ctx context.Context, userID pgtype.UUID, rutaID string, input GenerarRepartoInput) (*RepartoResponse, error) {
	pgRutaID, err := pgUUID(rutaID)
	if err != nil {
		return nil, ErrRutaNotFound
	}

	// Get ruta with paradas
	ruta, err := s.queries.GetRutaByID(ctx, repository.GetRutaByIDParams{
		ID: pgRutaID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRutaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get ruta: %w", err)
	}

	paradas, err := s.queries.ListRutaParadas(ctx, pgRutaID)
	if err != nil {
		return nil, fmt.Errorf("list paradas: %w", err)
	}

	// Collect pending pedido IDs for each parada's client
	var pedidoIDs []string
	for _, p := range paradas {
		pedidos, err := s.queries.ListPendingPedidosByCliente(ctx, repository.ListPendingPedidosByClienteParams{
			ClienteID: p.ClienteID,
			UsuarioID: userID,
		})
		if err != nil {
			return nil, fmt.Errorf("list pending pedidos: %w", err)
		}
		for _, ped := range pedidos {
			pedidoIDs = append(pedidoIDs, uuidStrFromPg(ped.ID))
		}
	}

	if len(pedidoIDs) == 0 {
		return nil, fmt.Errorf("no hay pedidos pendientes para esta ruta")
	}

	// Create reparto using the LogisticsService pattern
	empleadoID, err := pgUUID(input.EmpleadoID)
	if err != nil {
		return nil, fmt.Errorf("invalid empleado_id")
	}

	fecha, err := time.Parse("2006-01-02", input.Fecha)
	if err != nil {
		return nil, fmt.Errorf("invalid fecha format")
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	numero, err := qtx.NextRepartoNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next reparto numero: %w", err)
	}

	reparto, err := qtx.CreateReparto(ctx, repository.CreateRepartoParams{
		Numero:        fmt.Sprint(numero),
		Fecha:         pgtype.Date{Time: fecha, Valid: true},
		EmpleadoID:    empleadoID,
		VehiculoID:    ruta.VehiculoID,
		ZonaID:        ruta.ZonaID,
		SucursalID:    ruta.SucursalID,
		Observaciones: pgText(fmt.Sprintf("Generado desde ruta: %s", ruta.Nombre)),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create reparto: %w", err)
	}

	for i, pedidoIDStr := range pedidoIDs {
		pedidoID, err := pgUUID(pedidoIDStr)
		if err != nil {
			return nil, fmt.Errorf("invalid pedido_id")
		}
		_, err = qtx.CreateRepartoPedido(ctx, repository.CreateRepartoPedidoParams{
			RepartoID: reparto.ID,
			PedidoID:  pedidoID,
			Orden:     int32(i),
		})
		if err != nil {
			return nil, fmt.Errorf("create reparto pedido: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	// Return the newly created reparto (re-fetch for full detail)
	logSvc := NewLogisticsService(s.db)
	return logSvc.GetReparto(ctx, userID, uuidStrFromPg(reparto.ID))
}

func toRutaResponse(r repository.GetRutaByIDRow) RutaResponse {
	resp := RutaResponse{
		ID:                  uuidStrFromPg(r.ID),
		Nombre:              r.Nombre,
		ZonaID:              uuidStrFromPg(r.ZonaID),
		ZonaNombre:          textFromPg(r.ZonaNombre),
		VehiculoID:          uuidStrFromPg(r.VehiculoID),
		VehiculoPatente:     textFromPg(r.VehiculoPatente),
		VehiculoDescripcion: fmt.Sprint(r.VehiculoDescripcion),
		Notas:               textFromPg(r.Notas),
		SucursalID:          uuidStrFromPg(r.SucursalID),
		SucursalNombre:      r.SucursalNombre,
		CreatedAt:           r.CreatedAt.Time.Format(time.RFC3339),
	}
	if r.DiaSemana.Valid {
		d := int(r.DiaSemana.Int32)
		resp.DiaSemana = &d
	}
	if r.HoraSalidaEstimada.Valid {
		hours := r.HoraSalidaEstimada.Microseconds / 3600000000
		mins := (r.HoraSalidaEstimada.Microseconds % 3600000000) / 60000000
		resp.HoraSalidaEstimada = fmt.Sprintf("%02d:%02d", hours, mins)
	}
	return resp
}
