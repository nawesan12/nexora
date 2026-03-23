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
	ErrVehiculoNotFound          = errors.New("vehiculo not found")
	ErrVehiculoPatenteDuplicada  = errors.New("patente already exists")
	ErrZonaNotFound              = errors.New("zona not found")
	ErrRepartoNotFound           = errors.New("reparto not found")
	ErrRepartoNotEditable        = errors.New("reparto is not in editable state")
	ErrInvalidDeliveryTransition = errors.New("invalid delivery state transition")
	ErrUnauthorizedDelivery      = errors.New("unauthorized delivery state transition")
)

type LogisticsService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewLogisticsService(db *pgxpool.Pool) *LogisticsService {
	return &LogisticsService{
		db:      db,
		queries: repository.New(db),
	}
}

// =====================
// Vehiculos
// =====================

type VehiculoResponse struct {
	ID              string  `json:"id"`
	Marca           string  `json:"marca"`
	Modelo          string  `json:"modelo"`
	Patente         string  `json:"patente"`
	Anio            int     `json:"anio,omitempty"`
	CapacidadKg     float64 `json:"capacidad_kg,omitempty"`
	CapacidadVolumen float64 `json:"capacidad_volumen,omitempty"`
	SucursalID      string  `json:"sucursal_id,omitempty"`
	SucursalNombre  string  `json:"sucursal_nombre,omitempty"`
	CreatedAt       string  `json:"created_at"`
}

type CreateVehiculoInput struct {
	Marca            string  `json:"marca" validate:"required,min=1,max=100"`
	Modelo           string  `json:"modelo" validate:"required,min=1,max=100"`
	Patente          string  `json:"patente" validate:"required,min=1,max=20"`
	Anio             int     `json:"anio"`
	CapacidadKg      float64 `json:"capacidad_kg" validate:"gte=0"`
	CapacidadVolumen float64 `json:"capacidad_volumen" validate:"gte=0"`
	SucursalID       string  `json:"sucursal_id"`
}

func (s *LogisticsService) CreateVehiculo(ctx context.Context, userID pgtype.UUID, input CreateVehiculoInput) (*VehiculoResponse, error) {
	var sucursalID pgtype.UUID
	var err error
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	v, err := s.queries.CreateVehiculo(ctx, repository.CreateVehiculoParams{
		Marca:            input.Marca,
		Modelo:           input.Modelo,
		Patente:          input.Patente,
		Anio:             pgInt4(input.Anio),
		CapacidadKg:      numericFromFloat(input.CapacidadKg),
		CapacidadVolumen: numericFromFloat(input.CapacidadVolumen),
		SucursalID:       sucursalID,
		UsuarioID:        userID,
	})
	if err != nil {
		if isDuplicateKey(err) {
			return nil, ErrVehiculoPatenteDuplicada
		}
		return nil, fmt.Errorf("create vehiculo: %w", err)
	}
	return toVehiculoResponseFromRow(v), nil
}

func (s *LogisticsService) GetVehiculo(ctx context.Context, userID pgtype.UUID, id string) (*VehiculoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrVehiculoNotFound
	}
	v, err := s.queries.GetVehiculoByID(ctx, repository.GetVehiculoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrVehiculoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get vehiculo: %w", err)
	}
	return &VehiculoResponse{
		ID:               uuidStrFromPg(v.ID),
		Marca:            v.Marca,
		Modelo:           v.Modelo,
		Patente:          v.Patente,
		Anio:             int(v.Anio.Int32),
		CapacidadKg:      floatFromNumeric(v.CapacidadKg),
		CapacidadVolumen: floatFromNumeric(v.CapacidadVolumen),
		SucursalID:       uuidStrFromPg(v.SucursalID),
		SucursalNombre:   textFromPg(v.SucursalNombre),
		CreatedAt:        v.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *LogisticsService) ListVehiculos(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]VehiculoResponse, int, error) {
	items, err := s.queries.ListVehiculos(ctx, repository.ListVehiculosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list vehiculos: %w", err)
	}
	count, err := s.queries.CountVehiculos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count vehiculos: %w", err)
	}
	result := make([]VehiculoResponse, 0, len(items))
	for _, v := range items {
		result = append(result, VehiculoResponse{
			ID:               uuidStrFromPg(v.ID),
			Marca:            v.Marca,
			Modelo:           v.Modelo,
			Patente:          v.Patente,
			Anio:             int(v.Anio.Int32),
			CapacidadKg:      floatFromNumeric(v.CapacidadKg),
			CapacidadVolumen: floatFromNumeric(v.CapacidadVolumen),
			SucursalID:       uuidStrFromPg(v.SucursalID),
			SucursalNombre:   textFromPg(v.SucursalNombre),
			CreatedAt:        v.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, int(count), nil
}

func (s *LogisticsService) UpdateVehiculo(ctx context.Context, userID pgtype.UUID, id string, input CreateVehiculoInput) (*VehiculoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrVehiculoNotFound
	}

	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	v, err := s.queries.UpdateVehiculo(ctx, repository.UpdateVehiculoParams{
		ID:               pgID,
		UsuarioID:        userID,
		Marca:            input.Marca,
		Modelo:           input.Modelo,
		Patente:          input.Patente,
		Anio:             pgInt4(input.Anio),
		CapacidadKg:      numericFromFloat(input.CapacidadKg),
		CapacidadVolumen: numericFromFloat(input.CapacidadVolumen),
		SucursalID:       sucursalID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrVehiculoNotFound
	}
	if err != nil {
		if isDuplicateKey(err) {
			return nil, ErrVehiculoPatenteDuplicada
		}
		return nil, fmt.Errorf("update vehiculo: %w", err)
	}
	return toVehiculoResponseFromRow(v), nil
}

func (s *LogisticsService) DeleteVehiculo(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrVehiculoNotFound
	}
	return s.queries.SoftDeleteVehiculo(ctx, repository.SoftDeleteVehiculoParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toVehiculoResponseFromRow(v repository.Vehiculo) *VehiculoResponse {
	return &VehiculoResponse{
		ID:               uuidStrFromPg(v.ID),
		Marca:            v.Marca,
		Modelo:           v.Modelo,
		Patente:          v.Patente,
		Anio:             int(v.Anio.Int32),
		CapacidadKg:      floatFromNumeric(v.CapacidadKg),
		CapacidadVolumen: floatFromNumeric(v.CapacidadVolumen),
		SucursalID:       uuidStrFromPg(v.SucursalID),
		CreatedAt:        v.CreatedAt.Time.Format(time.RFC3339),
	}
}

// =====================
// Zonas
// =====================

type ZonaResponse struct {
	ID             string `json:"id"`
	Nombre         string `json:"nombre"`
	Descripcion    string `json:"descripcion,omitempty"`
	SucursalID     string `json:"sucursal_id,omitempty"`
	SucursalNombre string `json:"sucursal_nombre,omitempty"`
	CreatedAt      string `json:"created_at"`
}

type CreateZonaInput struct {
	Nombre      string `json:"nombre" validate:"required,min=2,max=200"`
	Descripcion string `json:"descripcion"`
	SucursalID  string `json:"sucursal_id"`
}

func (s *LogisticsService) CreateZona(ctx context.Context, userID pgtype.UUID, input CreateZonaInput) (*ZonaResponse, error) {
	var sucursalID pgtype.UUID
	var err error
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	z, err := s.queries.CreateZona(ctx, repository.CreateZonaParams{
		Nombre:      input.Nombre,
		Descripcion: pgText(input.Descripcion),
		SucursalID:  sucursalID,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create zona: %w", err)
	}
	return toZonaResponseFromRow(z), nil
}

func (s *LogisticsService) GetZona(ctx context.Context, userID pgtype.UUID, id string) (*ZonaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrZonaNotFound
	}
	z, err := s.queries.GetZonaByID(ctx, repository.GetZonaByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrZonaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get zona: %w", err)
	}
	return &ZonaResponse{
		ID:             uuidStrFromPg(z.ID),
		Nombre:         z.Nombre,
		Descripcion:    textFromPg(z.Descripcion),
		SucursalID:     uuidStrFromPg(z.SucursalID),
		SucursalNombre: textFromPg(z.SucursalNombre),
		CreatedAt:      z.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *LogisticsService) ListZonas(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]ZonaResponse, int, error) {
	items, err := s.queries.ListZonas(ctx, repository.ListZonasParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list zonas: %w", err)
	}
	count, err := s.queries.CountZonas(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count zonas: %w", err)
	}
	result := make([]ZonaResponse, 0, len(items))
	for _, z := range items {
		result = append(result, ZonaResponse{
			ID:             uuidStrFromPg(z.ID),
			Nombre:         z.Nombre,
			Descripcion:    textFromPg(z.Descripcion),
			SucursalID:     uuidStrFromPg(z.SucursalID),
			SucursalNombre: textFromPg(z.SucursalNombre),
			CreatedAt:      z.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, int(count), nil
}

func (s *LogisticsService) UpdateZona(ctx context.Context, userID pgtype.UUID, id string, input CreateZonaInput) (*ZonaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrZonaNotFound
	}

	var sucursalID pgtype.UUID
	if input.SucursalID != "" {
		sucursalID, err = pgUUID(input.SucursalID)
		if err != nil {
			return nil, fmt.Errorf("invalid sucursal_id")
		}
	}

	z, err := s.queries.UpdateZona(ctx, repository.UpdateZonaParams{
		ID:          pgID,
		UsuarioID:   userID,
		Nombre:      input.Nombre,
		Descripcion: pgText(input.Descripcion),
		SucursalID:  sucursalID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrZonaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update zona: %w", err)
	}
	return toZonaResponseFromRow(z), nil
}

func (s *LogisticsService) DeleteZona(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrZonaNotFound
	}
	return s.queries.SoftDeleteZona(ctx, repository.SoftDeleteZonaParams{
		ID: pgID, UsuarioID: userID,
	})
}

func toZonaResponseFromRow(z repository.Zona) *ZonaResponse {
	return &ZonaResponse{
		ID:          uuidStrFromPg(z.ID),
		Nombre:      z.Nombre,
		Descripcion: textFromPg(z.Descripcion),
		SucursalID:  uuidStrFromPg(z.SucursalID),
		CreatedAt:   z.CreatedAt.Time.Format(time.RFC3339),
	}
}

// =====================
// Repartos
// =====================

type RepartoResponse struct {
	ID               string                  `json:"id"`
	Numero           string                  `json:"numero"`
	Fecha            string                  `json:"fecha"`
	Estado           string                  `json:"estado"`
	EmpleadoID       string                  `json:"empleado_id"`
	EmpleadoNombre   string                  `json:"empleado_nombre,omitempty"`
	VehiculoID       string                  `json:"vehiculo_id,omitempty"`
	VehiculoPatente  string                  `json:"vehiculo_patente,omitempty"`
	VehiculoDesc     string                  `json:"vehiculo_descripcion,omitempty"`
	ZonaID           string                  `json:"zona_id,omitempty"`
	ZonaNombre       string                  `json:"zona_nombre,omitempty"`
	SucursalID       string                  `json:"sucursal_id"`
	SucursalNombre   string                  `json:"sucursal_nombre,omitempty"`
	HoraSalida       string                  `json:"hora_salida,omitempty"`
	HoraRegreso      string                  `json:"hora_regreso,omitempty"`
	KmInicio         float64                 `json:"km_inicio,omitempty"`
	KmFin            float64                 `json:"km_fin,omitempty"`
	Observaciones    string                  `json:"observaciones,omitempty"`
	Pedidos          []RepartoPedidoResponse `json:"pedidos"`
	Eventos          []EventoRepartoResponse `json:"eventos"`
	CreatedAt        string                  `json:"created_at"`
}

type RepartoPedidoResponse struct {
	ID            string  `json:"id"`
	PedidoID      string  `json:"pedido_id"`
	PedidoNumero  string  `json:"pedido_numero"`
	ClienteNombre string  `json:"cliente_nombre,omitempty"`
	PedidoEstado  string  `json:"pedido_estado"`
	PedidoTotal   float64 `json:"pedido_total"`
	Orden         int     `json:"orden"`
}

type EventoRepartoResponse struct {
	ID             string  `json:"id"`
	RepartoID      string  `json:"reparto_id"`
	PedidoID       string  `json:"pedido_id,omitempty"`
	PedidoNumero   string  `json:"pedido_numero,omitempty"`
	Tipo           string  `json:"tipo"`
	Latitud        float64 `json:"latitud,omitempty"`
	Longitud       float64 `json:"longitud,omitempty"`
	Comentario     string  `json:"comentario,omitempty"`
	MontoCobrado   float64 `json:"monto_cobrado,omitempty"`
	FirmaURL       string  `json:"firma_url,omitempty"`
	EmpleadoNombre string  `json:"empleado_nombre,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type RepartoListResponse struct {
	ID             string `json:"id"`
	Numero         string `json:"numero"`
	Fecha          string `json:"fecha"`
	Estado         string `json:"estado"`
	EmpleadoNombre string `json:"empleado_nombre"`
	VehiculoPatente string `json:"vehiculo_patente,omitempty"`
	ZonaNombre     string `json:"zona_nombre,omitempty"`
	SucursalNombre string `json:"sucursal_nombre"`
	PedidosCount   int    `json:"pedidos_count"`
}

type CreateRepartoInput struct {
	Fecha         string   `json:"fecha" validate:"required"`
	EmpleadoID    string   `json:"empleado_id" validate:"required,uuid"`
	VehiculoID    string   `json:"vehiculo_id"`
	ZonaID        string   `json:"zona_id"`
	SucursalID    string   `json:"sucursal_id" validate:"required,uuid"`
	Observaciones string   `json:"observaciones"`
	PedidoIDs     []string `json:"pedido_ids" validate:"required,min=1"`
}

type RepartoTransitionInput struct {
	Estado   string  `json:"estado" validate:"required"`
	KmInicio float64 `json:"km_inicio"`
	KmFin    float64 `json:"km_fin"`
}

type CreateEventoInput struct {
	PedidoID     string  `json:"pedido_id"`
	Tipo         string  `json:"tipo" validate:"required,oneof=LLEGADA ENTREGA NO_ENTREGA ENTREGA_PARCIAL COBRO"`
	Latitud      float64 `json:"latitud"`
	Longitud     float64 `json:"longitud"`
	Comentario   string  `json:"comentario"`
	MontoCobrado float64 `json:"monto_cobrado"`
	EmpleadoID   string  `json:"empleado_id"`
	FirmaURL     string  `json:"firma_url"`
}

// --- Repartos CRUD ---

func (s *LogisticsService) CreateReparto(ctx context.Context, userID pgtype.UUID, input CreateRepartoInput) (*RepartoResponse, error) {
	empleadoID, err := pgUUID(input.EmpleadoID)
	if err != nil {
		return nil, fmt.Errorf("invalid empleado_id")
	}
	sucursalID, err := pgUUID(input.SucursalID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_id")
	}

	var vehiculoID pgtype.UUID
	if input.VehiculoID != "" {
		vehiculoID, err = pgUUID(input.VehiculoID)
		if err != nil {
			return nil, fmt.Errorf("invalid vehiculo_id")
		}
	}

	var zonaID pgtype.UUID
	if input.ZonaID != "" {
		zonaID, err = pgUUID(input.ZonaID)
		if err != nil {
			return nil, fmt.Errorf("invalid zona_id")
		}
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
		VehiculoID:    vehiculoID,
		ZonaID:        zonaID,
		SucursalID:    sucursalID,
		Observaciones: pgText(input.Observaciones),
		UsuarioID:     userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create reparto: %w", err)
	}

	for i, pedidoIDStr := range input.PedidoIDs {
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

	return s.GetReparto(ctx, userID, uuidStrFromPg(reparto.ID))
}

func (s *LogisticsService) GetReparto(ctx context.Context, userID pgtype.UUID, id string) (*RepartoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRepartoNotFound
	}

	r, err := s.queries.GetRepartoByID(ctx, repository.GetRepartoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRepartoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get reparto: %w", err)
	}

	pedidos, err := s.queries.ListRepartoPedidos(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list reparto pedidos: %w", err)
	}

	eventos, err := s.queries.ListEventosReparto(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list eventos reparto: %w", err)
	}

	resp := &RepartoResponse{
		ID:              uuidStrFromPg(r.ID),
		Numero:          r.Numero,
		Fecha:           r.Fecha.Time.Format("2006-01-02"),
		Estado:          string(r.Estado),
		EmpleadoID:      uuidStrFromPg(r.EmpleadoID),
		EmpleadoNombre:  r.EmpleadoNombre,
		VehiculoID:      uuidStrFromPg(r.VehiculoID),
		VehiculoPatente: textFromPg(r.VehiculoPatente),
		VehiculoDesc:    fmt.Sprint(r.VehiculoDescripcion),
		ZonaID:          uuidStrFromPg(r.ZonaID),
		ZonaNombre:      textFromPg(r.ZonaNombre),
		SucursalID:      uuidStrFromPg(r.SucursalID),
		SucursalNombre:  r.SucursalNombre,
		KmInicio:        floatFromNumeric(r.KmInicio),
		KmFin:           floatFromNumeric(r.KmFin),
		Observaciones:   textFromPg(r.Observaciones),
		CreatedAt:       r.CreatedAt.Time.Format(time.RFC3339),
	}
	if r.HoraSalida.Valid {
		resp.HoraSalida = r.HoraSalida.Time.Format(time.RFC3339)
	}
	if r.HoraRegreso.Valid {
		resp.HoraRegreso = r.HoraRegreso.Time.Format(time.RFC3339)
	}

	resp.Pedidos = make([]RepartoPedidoResponse, 0, len(pedidos))
	for _, p := range pedidos {
		resp.Pedidos = append(resp.Pedidos, RepartoPedidoResponse{
			ID:            uuidStrFromPg(p.ID),
			PedidoID:      uuidStrFromPg(p.PedidoID),
			PedidoNumero:  p.PedidoNumero,
			ClienteNombre: textFromPg(p.ClienteNombre),
			PedidoEstado:  string(p.PedidoEstado),
			PedidoTotal:   floatFromNumeric(p.PedidoTotal),
			Orden:         int(p.Orden),
		})
	}

	resp.Eventos = make([]EventoRepartoResponse, 0, len(eventos))
	for _, e := range eventos {
		resp.Eventos = append(resp.Eventos, EventoRepartoResponse{
			ID:             uuidStrFromPg(e.ID),
			RepartoID:      uuidStrFromPg(e.RepartoID),
			PedidoID:       uuidStrFromPg(e.PedidoID),
			PedidoNumero:   textFromPg(e.PedidoNumero),
			Tipo:           string(e.Tipo),
			Latitud:        floatFromNumeric(e.Latitud),
			Longitud:       floatFromNumeric(e.Longitud),
			Comentario:     textFromPg(e.Comentario),
			MontoCobrado:   floatFromNumeric(e.MontoCobrado),
			FirmaURL:       textFromPg(e.FirmaURL),
			EmpleadoNombre: textFromPg(e.EmpleadoNombre),
			CreatedAt:      e.CreatedAt.Time.Format(time.RFC3339),
		})
	}

	return resp, nil
}

func (s *LogisticsService) ListRepartos(ctx context.Context, userID pgtype.UUID, estado string, limit, offset int32) ([]RepartoListResponse, int, error) {
	if estado != "" {
		items, err := s.queries.ListRepartosByEstado(ctx, repository.ListRepartosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoReparto(estado), Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list repartos by estado: %w", err)
		}
		count, err := s.queries.CountRepartosByEstado(ctx, repository.CountRepartosByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoReparto(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count repartos by estado: %w", err)
		}
		result := make([]RepartoListResponse, 0, len(items))
		for _, r := range items {
			result = append(result, toRepartoListFromEstado(r))
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListRepartos(ctx, repository.ListRepartosParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list repartos: %w", err)
	}
	count, err := s.queries.CountRepartos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count repartos: %w", err)
	}
	result := make([]RepartoListResponse, 0, len(items))
	for _, r := range items {
		result = append(result, toRepartoListFromList(r))
	}
	return result, int(count), nil
}

func toRepartoListFromList(r repository.ListRepartosRow) RepartoListResponse {
	return RepartoListResponse{
		ID:              uuidStrFromPg(r.ID),
		Numero:          r.Numero,
		Fecha:           r.Fecha.Time.Format("2006-01-02"),
		Estado:          string(r.Estado),
		EmpleadoNombre:  r.EmpleadoNombre,
		VehiculoPatente: textFromPg(r.VehiculoPatente),
		ZonaNombre:      textFromPg(r.ZonaNombre),
		SucursalNombre:  r.SucursalNombre,
		PedidosCount:    int(r.PedidosCount),
	}
}

func toRepartoListFromEstado(r repository.ListRepartosByEstadoRow) RepartoListResponse {
	return RepartoListResponse{
		ID:              uuidStrFromPg(r.ID),
		Numero:          r.Numero,
		Fecha:           r.Fecha.Time.Format("2006-01-02"),
		Estado:          string(r.Estado),
		EmpleadoNombre:  r.EmpleadoNombre,
		VehiculoPatente: textFromPg(r.VehiculoPatente),
		ZonaNombre:      textFromPg(r.ZonaNombre),
		SucursalNombre:  r.SucursalNombre,
		PedidosCount:    int(r.PedidosCount),
	}
}

func (s *LogisticsService) TransitionReparto(ctx context.Context, userID pgtype.UUID, role, id string, input RepartoTransitionInput) (*RepartoResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrRepartoNotFound
	}

	reparto, err := s.queries.GetRepartoByID(ctx, repository.GetRepartoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRepartoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get reparto: %w", err)
	}

	currentState := string(reparto.Estado)
	newState := input.Estado

	if !canDeliveryTransition(currentState, newState) {
		return nil, fmt.Errorf("%w: %s -> %s", ErrInvalidDeliveryTransition, currentState, newState)
	}
	if !canRoleDeliveryTo(role, newState) {
		return nil, fmt.Errorf("%w: role %s cannot transition to %s", ErrUnauthorizedDelivery, role, newState)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	err = qtx.UpdateRepartoEstado(ctx, repository.UpdateRepartoEstadoParams{
		ID: pgID, UsuarioID: userID, Estado: repository.EstadoReparto(newState),
	})
	if err != nil {
		return nil, fmt.Errorf("update reparto estado: %w", err)
	}

	switch newState {
	case "EN_CURSO":
		err = qtx.UpdateRepartoSalida(ctx, repository.UpdateRepartoSalidaParams{
			ID: pgID, UsuarioID: userID, KmInicio: numericFromFloat(input.KmInicio),
		})
		if err != nil {
			return nil, fmt.Errorf("update salida: %w", err)
		}

	case "FINALIZADO":
		err = qtx.UpdateRepartoRegreso(ctx, repository.UpdateRepartoRegresoParams{
			ID: pgID, UsuarioID: userID, KmFin: numericFromFloat(input.KmFin),
		})
		if err != nil {
			return nil, fmt.Errorf("update regreso: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetReparto(ctx, userID, id)
}

func (s *LogisticsService) DeleteReparto(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrRepartoNotFound
	}

	reparto, err := s.queries.GetRepartoByID(ctx, repository.GetRepartoByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrRepartoNotFound
	}
	if err != nil {
		return fmt.Errorf("get reparto: %w", err)
	}

	if reparto.Estado != repository.EstadoRepartoPLANIFICADO {
		return ErrRepartoNotEditable
	}

	return s.queries.SoftDeleteReparto(ctx, repository.SoftDeleteRepartoParams{
		ID: pgID, UsuarioID: userID,
	})
}

// =====================
// Eventos
// =====================

func (s *LogisticsService) CreateEvento(ctx context.Context, userID pgtype.UUID, repartoID string, input CreateEventoInput) (*EventoRepartoResponse, error) {
	pgRepartoID, err := pgUUID(repartoID)
	if err != nil {
		return nil, ErrRepartoNotFound
	}

	_, err = s.queries.GetRepartoByID(ctx, repository.GetRepartoByIDParams{
		ID: pgRepartoID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRepartoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get reparto: %w", err)
	}

	var pedidoID pgtype.UUID
	if input.PedidoID != "" {
		pedidoID, err = pgUUID(input.PedidoID)
		if err != nil {
			return nil, fmt.Errorf("invalid pedido_id")
		}
	}

	var empleadoID pgtype.UUID
	if input.EmpleadoID != "" {
		empleadoID, err = pgUUID(input.EmpleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	e, err := s.queries.CreateEventoReparto(ctx, repository.CreateEventoRepartoParams{
		RepartoID:    pgRepartoID,
		PedidoID:     pedidoID,
		Tipo:         repository.TipoEventoReparto(input.Tipo),
		Latitud:      numericFromFloat(input.Latitud),
		Longitud:     numericFromFloat(input.Longitud),
		Comentario:   pgText(input.Comentario),
		MontoCobrado: numericFromFloat(input.MontoCobrado),
		EmpleadoID:   empleadoID,
		FirmaURL:     pgText(input.FirmaURL),
	})
	if err != nil {
		return nil, fmt.Errorf("create evento: %w", err)
	}

	return &EventoRepartoResponse{
		ID:           uuidStrFromPg(e.ID),
		RepartoID:    uuidStrFromPg(e.RepartoID),
		PedidoID:     uuidStrFromPg(e.PedidoID),
		Tipo:         string(e.Tipo),
		Latitud:      floatFromNumeric(e.Latitud),
		Longitud:     floatFromNumeric(e.Longitud),
		Comentario:   textFromPg(e.Comentario),
		MontoCobrado: floatFromNumeric(e.MontoCobrado),
		FirmaURL:     textFromPg(e.FirmaURL),
		CreatedAt:    e.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func (s *LogisticsService) ListEventos(ctx context.Context, userID pgtype.UUID, repartoID string) ([]EventoRepartoResponse, error) {
	pgRepartoID, err := pgUUID(repartoID)
	if err != nil {
		return nil, ErrRepartoNotFound
	}

	_, err = s.queries.GetRepartoByID(ctx, repository.GetRepartoByIDParams{
		ID: pgRepartoID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRepartoNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get reparto: %w", err)
	}

	eventos, err := s.queries.ListEventosReparto(ctx, pgRepartoID)
	if err != nil {
		return nil, fmt.Errorf("list eventos: %w", err)
	}

	result := make([]EventoRepartoResponse, 0, len(eventos))
	for _, e := range eventos {
		result = append(result, EventoRepartoResponse{
			ID:             uuidStrFromPg(e.ID),
			RepartoID:      uuidStrFromPg(e.RepartoID),
			PedidoID:       uuidStrFromPg(e.PedidoID),
			PedidoNumero:   textFromPg(e.PedidoNumero),
			Tipo:           string(e.Tipo),
			Latitud:        floatFromNumeric(e.Latitud),
			Longitud:       floatFromNumeric(e.Longitud),
			Comentario:     textFromPg(e.Comentario),
			MontoCobrado:   floatFromNumeric(e.MontoCobrado),
			FirmaURL:       textFromPg(e.FirmaURL),
			EmpleadoNombre: textFromPg(e.EmpleadoNombre),
			CreatedAt:      e.CreatedAt.Time.Format(time.RFC3339),
		})
	}
	return result, nil
}
