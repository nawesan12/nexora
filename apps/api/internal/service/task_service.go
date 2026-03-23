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
	ErrTaskNotFound = errors.New("task not found")
)

type TaskService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewTaskService(db *pgxpool.Pool) *TaskService {
	return &TaskService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type TaskResponse struct {
	ID             string  `json:"id"`
	Titulo         string  `json:"titulo"`
	Descripcion    string  `json:"descripcion,omitempty"`
	Prioridad      string  `json:"prioridad"`
	Estado         string  `json:"estado"`
	AsignadoA      string  `json:"asignado_a,omitempty"`
	AsignadoNombre string  `json:"asignado_nombre,omitempty"`
	FechaLimite    string  `json:"fecha_limite,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type TaskCommentResponse struct {
	ID            string `json:"id"`
	TaskID        string `json:"task_id"`
	Contenido     string `json:"contenido"`
	UsuarioNombre string `json:"usuario_nombre,omitempty"`
	CreatedAt     string `json:"created_at"`
}

type CreateTaskInput struct {
	Titulo      string `json:"titulo" validate:"required,min=2,max=300"`
	Descripcion string `json:"descripcion"`
	Prioridad   string `json:"prioridad" validate:"required,oneof=BAJA MEDIA ALTA URGENTE"`
	Estado      string `json:"estado" validate:"required,oneof=PENDIENTE EN_PROGRESO COMPLETADA CANCELADA"`
	AsignadoA   string `json:"asignado_a"`
	FechaLimite string `json:"fecha_limite"`
}

type CreateCommentInput struct {
	Contenido string `json:"contenido" validate:"required,min=1,max=5000"`
}

// --- Methods ---

func (s *TaskService) Create(ctx context.Context, userID pgtype.UUID, input CreateTaskInput) (*TaskResponse, error) {
	var asignadoA pgtype.UUID
	if input.AsignadoA != "" {
		var err error
		asignadoA, err = pgUUID(input.AsignadoA)
		if err != nil {
			return nil, fmt.Errorf("invalid asignado_a")
		}
	}

	var fechaLimite pgtype.Date
	if input.FechaLimite != "" {
		t, err := time.Parse("2006-01-02", input.FechaLimite)
		if err == nil {
			fechaLimite = pgtype.Date{Time: t, Valid: true}
		}
	}

	task, err := s.queries.CreateTask(ctx, repository.CreateTaskParams{
		Titulo:      input.Titulo,
		Descripcion: pgText(input.Descripcion),
		Prioridad:   repository.TaskPriority(input.Prioridad),
		Estado:      repository.TaskStatus(input.Estado),
		AsignadoA:   asignadoA,
		FechaLimite: fechaLimite,
		UsuarioID:   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}

	return s.Get(ctx, userID, uuidStrFromPg(task.ID))
}

func (s *TaskService) Get(ctx context.Context, userID pgtype.UUID, id string) (*TaskResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrTaskNotFound
	}

	t, err := s.queries.GetTaskByID(ctx, repository.GetTaskByIDParams{
		ID: pgID, UsuarioID: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTaskNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get task: %w", err)
	}

	return toTaskResponse(t), nil
}

func (s *TaskService) List(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]TaskResponse, int, error) {
	items, err := s.queries.ListTasks(ctx, repository.ListTasksParams{
		UsuarioID: userID, Limit: limit, Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list tasks: %w", err)
	}
	count, err := s.queries.CountTasks(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count tasks: %w", err)
	}

	result := make([]TaskResponse, 0, len(items))
	for _, t := range items {
		resp := TaskResponse{
			ID:        uuidStrFromPg(t.ID),
			Titulo:    t.Titulo,
			Prioridad: string(t.Prioridad),
			Estado:    string(t.Estado),
			CreatedAt: t.CreatedAt.Time.Format(time.RFC3339),
		}
		if t.Descripcion.Valid {
			resp.Descripcion = t.Descripcion.String
		}
		if t.AsignadoA.Valid {
			resp.AsignadoA = uuidStrFromPg(t.AsignadoA)
		}
		if t.AsignadoNombre != nil {
			resp.AsignadoNombre = fmt.Sprint(t.AsignadoNombre)
		}
		if t.FechaLimite.Valid {
			resp.FechaLimite = t.FechaLimite.Time.Format("2006-01-02")
		}
		result = append(result, resp)
	}
	return result, int(count), nil
}

func (s *TaskService) Update(ctx context.Context, userID pgtype.UUID, id string, input CreateTaskInput) (*TaskResponse, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrTaskNotFound
	}

	var asignadoA pgtype.UUID
	if input.AsignadoA != "" {
		asignadoA, err = pgUUID(input.AsignadoA)
		if err != nil {
			return nil, fmt.Errorf("invalid asignado_a")
		}
	}

	var fechaLimite pgtype.Date
	if input.FechaLimite != "" {
		t, err := time.Parse("2006-01-02", input.FechaLimite)
		if err == nil {
			fechaLimite = pgtype.Date{Time: t, Valid: true}
		}
	}

	_, err = s.queries.UpdateTask(ctx, repository.UpdateTaskParams{
		ID:          pgID,
		UsuarioID:   userID,
		Titulo:      input.Titulo,
		Descripcion: pgText(input.Descripcion),
		Prioridad:   repository.TaskPriority(input.Prioridad),
		Estado:      repository.TaskStatus(input.Estado),
		AsignadoA:   asignadoA,
		FechaLimite: fechaLimite,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTaskNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}

	return s.Get(ctx, userID, id)
}

func (s *TaskService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrTaskNotFound
	}
	return s.queries.SoftDeleteTask(ctx, repository.SoftDeleteTaskParams{
		ID: pgID, UsuarioID: userID,
	})
}

func (s *TaskService) ListComments(ctx context.Context, taskID string) ([]TaskCommentResponse, error) {
	pgID, err := pgUUID(taskID)
	if err != nil {
		return nil, ErrTaskNotFound
	}

	items, err := s.queries.ListTaskComments(ctx, pgID)
	if err != nil {
		return nil, fmt.Errorf("list task comments: %w", err)
	}

	result := make([]TaskCommentResponse, 0, len(items))
	for _, c := range items {
		resp := TaskCommentResponse{
			ID:        uuidStrFromPg(c.ID),
			TaskID:    uuidStrFromPg(c.TaskID),
			Contenido: c.Contenido,
			CreatedAt: c.CreatedAt.Time.Format(time.RFC3339),
		}
		if c.UsuarioNombre != nil {
			resp.UsuarioNombre = fmt.Sprint(c.UsuarioNombre)
		}
		result = append(result, resp)
	}
	return result, nil
}

func (s *TaskService) CreateComment(ctx context.Context, userID pgtype.UUID, taskID string, input CreateCommentInput) (*TaskCommentResponse, error) {
	pgTaskID, err := pgUUID(taskID)
	if err != nil {
		return nil, ErrTaskNotFound
	}

	comment, err := s.queries.CreateTaskComment(ctx, repository.CreateTaskCommentParams{
		TaskID:    pgTaskID,
		Contenido: input.Contenido,
		UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create task comment: %w", err)
	}

	return &TaskCommentResponse{
		ID:        uuidStrFromPg(comment.ID),
		TaskID:    uuidStrFromPg(comment.TaskID),
		Contenido: comment.Contenido,
		CreatedAt: comment.CreatedAt.Time.Format(time.RFC3339),
	}, nil
}

func toTaskResponse(t repository.GetTaskByIDRow) *TaskResponse {
	resp := &TaskResponse{
		ID:        uuidStrFromPg(t.ID),
		Titulo:    t.Titulo,
		Prioridad: string(t.Prioridad),
		Estado:    string(t.Estado),
		CreatedAt: t.CreatedAt.Time.Format(time.RFC3339),
	}
	if t.Descripcion.Valid {
		resp.Descripcion = t.Descripcion.String
	}
	if t.AsignadoA.Valid {
		resp.AsignadoA = uuidStrFromPg(t.AsignadoA)
	}
	if t.AsignadoNombre != nil {
		resp.AsignadoNombre = fmt.Sprint(t.AsignadoNombre)
	}
	if t.FechaLimite.Valid {
		resp.FechaLimite = t.FechaLimite.Time.Format("2006-01-02")
	}
	return resp
}
