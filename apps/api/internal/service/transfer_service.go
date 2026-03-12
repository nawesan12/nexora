package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var (
	ErrTransferenciaNotFound      = errors.New("transferencia not found")
	ErrTransferenciaMismaSucursal = errors.New("origin and destination branches must differ")
	ErrTransferenciaNotEditable   = errors.New("transferencia is not in editable state")
	ErrInvalidTransferTransition  = errors.New("invalid transfer state transition")
	ErrUnauthorizedTransfer       = errors.New("unauthorized transfer state transition")
)

type TransferService struct {
	db       *pgxpool.Pool
	queries  *repository.Queries
	stockSvc *StockService
}

func NewTransferService(db *pgxpool.Pool, stockSvc *StockService) *TransferService {
	return &TransferService{
		db:       db,
		queries:  repository.New(db),
		stockSvc: stockSvc,
	}
}

// --- Input DTOs ---

type CreateTransferenciaInput struct {
	SucursalOrigenID  string                        `json:"sucursal_origen_id" validate:"required,uuid"`
	SucursalDestinoID string                        `json:"sucursal_destino_id" validate:"required,uuid"`
	Observaciones     string                        `json:"observaciones"`
	Items             []CreateTransferenciaItemInput `json:"items" validate:"required,min=1,dive"`
}

type CreateTransferenciaItemInput struct {
	ProductoID     string `json:"producto_id" validate:"required,uuid"`
	ProductoNombre string `json:"producto_nombre"`
	ProductoCodigo string `json:"producto_codigo"`
	Cantidad       int    `json:"cantidad" validate:"required,gt=0"`
}

type TransferTransitionInput struct {
	Estado         string                      `json:"estado" validate:"required"`
	Comentario     string                      `json:"comentario"`
	ItemsEnviados  []TransferItemCantidadInput `json:"items_enviados"`
	ItemsRecibidos []TransferItemCantidadInput `json:"items_recibidos"`
}

type TransferItemCantidadInput struct {
	ItemID   string `json:"item_id" validate:"required,uuid"`
	Cantidad int    `json:"cantidad" validate:"gte=0"`
}

// --- Response DTOs ---

type TransferenciaResponse struct {
	ID                     string                      `json:"id"`
	Numero                 string                      `json:"numero"`
	SucursalOrigenID       string                      `json:"sucursal_origen_id"`
	SucursalOrigenNombre   string                      `json:"sucursal_origen_nombre,omitempty"`
	SucursalDestinoID      string                      `json:"sucursal_destino_id"`
	SucursalDestinoNombre  string                      `json:"sucursal_destino_nombre,omitempty"`
	Estado                 string                      `json:"estado"`
	Observaciones          string                      `json:"observaciones,omitempty"`
	SolicitadoPorNombre    string                      `json:"solicitado_por_nombre,omitempty"`
	AprobadoPorNombre      string                      `json:"aprobado_por_nombre,omitempty"`
	FechaSolicitud         string                      `json:"fecha_solicitud"`
	FechaAprobacion        string                      `json:"fecha_aprobacion,omitempty"`
	FechaEnvio             string                      `json:"fecha_envio,omitempty"`
	FechaRecepcion         string                      `json:"fecha_recepcion,omitempty"`
	Items                  []TransferenciaItemResponse `json:"items"`
	CreatedAt              string                      `json:"created_at"`
}

type TransferenciaItemResponse struct {
	ID                 string `json:"id"`
	ProductoID         string `json:"producto_id"`
	ProductoNombre     string `json:"producto_nombre,omitempty"`
	ProductoCodigo     string `json:"producto_codigo,omitempty"`
	CantidadSolicitada int    `json:"cantidad_solicitada"`
	CantidadEnviada    int    `json:"cantidad_enviada"`
	CantidadRecibida   int    `json:"cantidad_recibida"`
}

type TransferenciaListResponse struct {
	ID                    string `json:"id"`
	Numero                string `json:"numero"`
	SucursalOrigenNombre  string `json:"sucursal_origen_nombre"`
	SucursalDestinoNombre string `json:"sucursal_destino_nombre"`
	Estado                string `json:"estado"`
	FechaSolicitud        string `json:"fecha_solicitud"`
	ItemsCount            int    `json:"items_count"`
}

// --- Methods ---

func (s *TransferService) Create(ctx context.Context, userID pgtype.UUID, empleadoID string, input CreateTransferenciaInput) (*TransferenciaResponse, error) {
	if input.SucursalOrigenID == input.SucursalDestinoID {
		return nil, ErrTransferenciaMismaSucursal
	}

	origenID, err := pgUUID(input.SucursalOrigenID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_origen_id")
	}
	destinoID, err := pgUUID(input.SucursalDestinoID)
	if err != nil {
		return nil, fmt.Errorf("invalid sucursal_destino_id")
	}

	var empSolicitaID pgtype.UUID
	if empleadoID != "" {
		empSolicitaID, err = pgUUID(empleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	// Generate transfer number
	numero, err := qtx.NextTransferenciaNumero(ctx)
	if err != nil {
		return nil, fmt.Errorf("next transferencia numero: %w", err)
	}

	transf, err := qtx.CreateTransferencia(ctx, repository.CreateTransferenciaParams{
		Numero:            fmt.Sprint(numero),
		SucursalOrigenID:  origenID,
		SucursalDestinoID: destinoID,
		Observaciones:     pgText(input.Observaciones),
		SolicitadoPor:     empSolicitaID,
		UsuarioID:         userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create transferencia: %w", err)
	}

	for _, item := range input.Items {
		prodID, err := pgUUID(item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("invalid producto_id")
		}

		_, err = qtx.CreateItemTransferencia(ctx, repository.CreateItemTransferenciaParams{
			TransferenciaID:    transf.ID,
			ProductoID:         prodID,
			ProductoNombre:     item.ProductoNombre,
			ProductoCodigo:     pgText(item.ProductoCodigo),
			CantidadSolicitada: int32(item.Cantidad),
		})
		if err != nil {
			return nil, fmt.Errorf("create item transferencia: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(transf.ID))
}

func (s *TransferService) Get(ctx context.Context, userID pgtype.UUID, id string) (*TransferenciaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrTransferenciaNotFound
	}

	t, err := s.queries.GetTransferenciaByID(ctx, repository.GetTransferenciaByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTransferenciaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get transferencia: %w", err)
	}

	items, err := s.queries.ListItemsTransferencia(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list items transferencia: %w", err)
	}

	resp := &TransferenciaResponse{
		ID:                    uuidStrFromPg(t.ID),
		Numero:                t.Numero,
		SucursalOrigenID:      uuidStrFromPg(t.SucursalOrigenID),
		SucursalOrigenNombre:  t.SucursalOrigenNombre,
		SucursalDestinoID:     uuidStrFromPg(t.SucursalDestinoID),
		SucursalDestinoNombre: t.SucursalDestinoNombre,
		Estado:                string(t.Estado),
		Observaciones:         textFromPg(t.Observaciones),
		SolicitadoPorNombre:   textFromPg(t.SolicitadoPorNombre),
		AprobadoPorNombre:     textFromPg(t.AprobadoPorNombre),
		FechaSolicitud:        t.FechaSolicitud.Time.Format(time.RFC3339),
		CreatedAt:             t.CreatedAt.Time.Format(time.RFC3339),
	}
	if t.FechaAprobacion.Valid {
		resp.FechaAprobacion = t.FechaAprobacion.Time.Format(time.RFC3339)
	}
	if t.FechaEnvio.Valid {
		resp.FechaEnvio = t.FechaEnvio.Time.Format(time.RFC3339)
	}
	if t.FechaRecepcion.Valid {
		resp.FechaRecepcion = t.FechaRecepcion.Time.Format(time.RFC3339)
	}

	resp.Items = make([]TransferenciaItemResponse, 0, len(items))
	for _, item := range items {
		resp.Items = append(resp.Items, TransferenciaItemResponse{
			ID:                 uuidStrFromPg(item.ID),
			ProductoID:         uuidStrFromPg(item.ProductoID),
			ProductoNombre:     item.ProductoNombre,
			ProductoCodigo:     textFromPg(item.ProductoCodigo),
			CantidadSolicitada: int(item.CantidadSolicitada),
			CantidadEnviada:    int(item.CantidadEnviada),
			CantidadRecibida:   int(item.CantidadRecibida),
		})
	}

	return resp, nil
}

func (s *TransferService) List(ctx context.Context, userID pgtype.UUID, estado string, limit, offset int32) ([]TransferenciaListResponse, int, error) {
	if estado != "" {
		items, err := s.queries.ListTransferenciasByEstado(ctx, repository.ListTransferenciasByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoTransferencia(estado), Limit: limit, Offset: offset,
		})
		if err != nil {
			return nil, 0, fmt.Errorf("list transferencias by estado: %w", err)
		}
		count, err := s.queries.CountTransferenciasByEstado(ctx, repository.CountTransferenciasByEstadoParams{
			UsuarioID: userID, Estado: repository.EstadoTransferencia(estado),
		})
		if err != nil {
			return nil, 0, fmt.Errorf("count transferencias by estado: %w", err)
		}
		result := make([]TransferenciaListResponse, 0, len(items))
		for _, t := range items {
			result = append(result, TransferenciaListResponse{
				ID:                    uuidStrFromPg(t.ID),
				Numero:                t.Numero,
				SucursalOrigenNombre:  t.SucursalOrigenNombre,
				SucursalDestinoNombre: t.SucursalDestinoNombre,
				Estado:                string(t.Estado),
				FechaSolicitud:        t.FechaSolicitud.Time.Format(time.RFC3339),
				ItemsCount:            int(t.ItemsCount),
			})
		}
		return result, int(count), nil
	}

	items, err := s.queries.ListTransferencias(ctx, repository.ListTransferenciasParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list transferencias: %w", err)
	}
	count, err := s.queries.CountTransferencias(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count transferencias: %w", err)
	}
	result := make([]TransferenciaListResponse, 0, len(items))
	for _, t := range items {
		result = append(result, TransferenciaListResponse{
			ID:                    uuidStrFromPg(t.ID),
			Numero:                t.Numero,
			SucursalOrigenNombre:  t.SucursalOrigenNombre,
			SucursalDestinoNombre: t.SucursalDestinoNombre,
			Estado:                string(t.Estado),
			FechaSolicitud:        t.FechaSolicitud.Time.Format(time.RFC3339),
			ItemsCount:            int(t.ItemsCount),
		})
	}
	return result, int(count), nil
}

func (s *TransferService) Transition(ctx context.Context, userID pgtype.UUID, role, empleadoID, id string, input TransferTransitionInput) (*TransferenciaResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrTransferenciaNotFound
	}

	transf, err := s.queries.GetTransferenciaByID(ctx, repository.GetTransferenciaByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTransferenciaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get transferencia: %w", err)
	}

	currentState := string(transf.Estado)
	newState := input.Estado

	if !canTransferTransition(currentState, newState) {
		return nil, fmt.Errorf("%w: %s -> %s", ErrInvalidTransferTransition, currentState, newState)
	}
	if !canRoleTransferTo(role, newState) {
		return nil, fmt.Errorf("%w: role %s cannot transition to %s", ErrUnauthorizedTransfer, role, newState)
	}

	var empID pgtype.UUID
	if empleadoID != "" {
		empID, err = pgUUID(empleadoID)
		if err != nil {
			return nil, fmt.Errorf("invalid empleado_id")
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := repository.New(tx)

	switch newState {
	case "APROBADA":
		err = qtx.UpdateTransferenciaAprobacion(ctx, repository.UpdateTransferenciaAprobacionParams{
			ID: pgID, UsuarioID: userID, AprobadoPor: empID,
		})
		if err != nil {
			return nil, fmt.Errorf("update aprobacion: %w", err)
		}

	case "EN_TRANSITO":
		err = qtx.UpdateTransferenciaEnvio(ctx, repository.UpdateTransferenciaEnvioParams{
			ID: pgID, UsuarioID: userID,
		})
		if err != nil {
			return nil, fmt.Errorf("update envio: %w", err)
		}
		for _, itemInput := range input.ItemsEnviados {
			itemID, err := pgUUID(itemInput.ItemID)
			if err != nil {
				return nil, fmt.Errorf("invalid item_id")
			}
			err = qtx.UpdateItemEnviado(ctx, repository.UpdateItemEnviadoParams{
				ID:              itemID,
				CantidadEnviada: int32(itemInput.Cantidad),
			})
			if err != nil {
				return nil, fmt.Errorf("update item enviado: %w", err)
			}
		}

	case "COMPLETADA":
		err = qtx.UpdateTransferenciaRecepcion(ctx, repository.UpdateTransferenciaRecepcionParams{
			ID: pgID, UsuarioID: userID,
		})
		if err != nil {
			return nil, fmt.Errorf("update recepcion: %w", err)
		}
		for _, itemInput := range input.ItemsRecibidos {
			itemID, err := pgUUID(itemInput.ItemID)
			if err != nil {
				return nil, fmt.Errorf("invalid item_id")
			}
			err = qtx.UpdateItemRecibido(ctx, repository.UpdateItemRecibidoParams{
				ID:               itemID,
				CantidadRecibida: int32(itemInput.Cantidad),
			})
			if err != nil {
				return nil, fmt.Errorf("update item recibido: %w", err)
			}
		}
		// Move stock: deduct from origin, add to destination
		items, err := qtx.ListItemsTransferenciaSimple(ctx, pgID)
		if err != nil {
			return nil, fmt.Errorf("list items transferencia: %w", err)
		}
		for _, item := range items {
			cantidadRecibida := int(item.CantidadRecibida)
			if cantidadRecibida <= 0 {
				continue
			}
			transferIDStr := uuidStrFromPg(transf.ID)
			// Deduct from origin
			_, err = s.stockSvc.RecordMovementInTx(ctx, qtx, userID, RecordMovementInput{
				ProductoID:     uuidStrFromPg(item.ProductoID),
				SucursalID:     uuidStrFromPg(transf.SucursalOrigenID),
				Tipo:           "TRANSFERENCIA",
				Cantidad:       -cantidadRecibida,
				Motivo:         fmt.Sprintf("Transferencia %s - envio", transf.Numero),
				ReferenciaID:   transferIDStr,
				ReferenciaTipo: "TRANSFERENCIA",
			})
			if err != nil {
				return nil, fmt.Errorf("deduct stock origin: %w", err)
			}
			// Add to destination
			_, err = s.stockSvc.RecordMovementInTx(ctx, qtx, userID, RecordMovementInput{
				ProductoID:     uuidStrFromPg(item.ProductoID),
				SucursalID:     uuidStrFromPg(transf.SucursalDestinoID),
				Tipo:           "TRANSFERENCIA",
				Cantidad:       cantidadRecibida,
				Motivo:         fmt.Sprintf("Transferencia %s - recepcion", transf.Numero),
				ReferenciaID:   transferIDStr,
				ReferenciaTipo: "TRANSFERENCIA",
			})
			if err != nil {
				return nil, fmt.Errorf("add stock destination: %w", err)
			}
		}

	case "CANCELADA":
		err = qtx.UpdateTransferenciaEstado(ctx, repository.UpdateTransferenciaEstadoParams{
			ID: pgID, UsuarioID: userID, Estado: repository.EstadoTransferencia(newState),
		})
		if err != nil {
			return nil, fmt.Errorf("update estado: %w", err)
		}
		// If cancelling from EN_TRANSITO, restore stock at origin
		if currentState == "EN_TRANSITO" {
			items, err := qtx.ListItemsTransferenciaSimple(ctx, pgID)
			if err != nil {
				return nil, fmt.Errorf("list items transferencia: %w", err)
			}
			transferIDStr := uuidStrFromPg(transf.ID)
			for _, item := range items {
				cantidadEnviada := int(item.CantidadEnviada)
				if cantidadEnviada <= 0 {
					continue
				}
				_, err = s.stockSvc.RecordMovementInTx(ctx, qtx, userID, RecordMovementInput{
					ProductoID:     uuidStrFromPg(item.ProductoID),
					SucursalID:     uuidStrFromPg(transf.SucursalOrigenID),
					Tipo:           "TRANSFERENCIA",
					Cantidad:       cantidadEnviada,
					Motivo:         fmt.Sprintf("Transferencia %s - cancelacion", transf.Numero),
					ReferenciaID:   transferIDStr,
					ReferenciaTipo: "TRANSFERENCIA",
				})
				if err != nil {
					return nil, fmt.Errorf("restore stock origin: %w", err)
				}
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *TransferService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrTransferenciaNotFound
	}

	transf, err := s.queries.GetTransferenciaByID(ctx, repository.GetTransferenciaByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrTransferenciaNotFound
	}
	if err != nil {
		return fmt.Errorf("get transferencia: %w", err)
	}

	if transf.Estado != repository.EstadoTransferenciaPENDIENTE {
		return ErrTransferenciaNotEditable
	}

	return s.queries.SoftDeleteTransferencia(ctx, repository.SoftDeleteTransferenciaParams{
		ID: pgID, UsuarioID: userID,
	})
}
