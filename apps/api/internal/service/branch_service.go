package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/repository"
)

var ErrBranchNotFound = errors.New("branch not found")

type BranchService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewBranchService(db *pgxpool.Pool) *BranchService {
	return &BranchService{
		db:      db,
		queries: repository.New(db),
	}
}

// --- DTOs ---

type BranchDetail struct {
	ID        string `json:"id"`
	Nombre    string `json:"nombre"`
	Direccion string `json:"direccion,omitempty"`
	Telefono  string `json:"telefono,omitempty"`
}

type CreateBranchInput struct {
	Nombre    string `json:"nombre" validate:"required,min=2,max=200"`
	Direccion string `json:"direccion"`
	Telefono  string `json:"telefono"`
}

type UpdateBranchInput struct {
	Nombre    string `json:"nombre" validate:"required,min=2,max=200"`
	Direccion string `json:"direccion"`
	Telefono  string `json:"telefono"`
}

// --- Methods ---

func (s *BranchService) List(ctx context.Context, userID pgtype.UUID) ([]BranchDetail, int, error) {
	branches, err := s.queries.ListBranchesByUser(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("list branches: %w", err)
	}

	count, err := s.queries.CountBranchesByUser(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("count branches: %w", err)
	}

	result := make([]BranchDetail, 0, len(branches))
	for _, b := range branches {
		result = append(result, toBranchDetail(b))
	}
	return result, int(count), nil
}

func (s *BranchService) Get(ctx context.Context, userID pgtype.UUID, id string) (*BranchDetail, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrBranchNotFound
	}

	b, err := s.queries.GetBranchByID(ctx, pgID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrBranchNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get branch: %w", err)
	}

	resp := toBranchDetail(b)
	return &resp, nil
}

func (s *BranchService) Create(ctx context.Context, userID pgtype.UUID, input CreateBranchInput) (*BranchDetail, error) {
	b, err := s.queries.CreateBranch(ctx, repository.CreateBranchParams{
		Nombre:    input.Nombre,
		Direccion: pgText(input.Direccion),
		Telefono:  pgText(input.Telefono),
		UsuarioID: userID,
	})
	if err != nil {
		return nil, fmt.Errorf("create branch: %w", err)
	}

	resp := toBranchDetail(b)
	return &resp, nil
}

func (s *BranchService) Update(ctx context.Context, userID pgtype.UUID, id string, input UpdateBranchInput) (*BranchDetail, error) {
	pgID, err := pgUUID(id)
	if err != nil {
		return nil, ErrBranchNotFound
	}

	b, err := s.queries.UpdateBranch(ctx, repository.UpdateBranchParams{
		ID:        pgID,
		UsuarioID: userID,
		Nombre:    input.Nombre,
		Direccion: pgText(input.Direccion),
		Telefono:  pgText(input.Telefono),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrBranchNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update branch: %w", err)
	}

	resp := toBranchDetail(b)
	return &resp, nil
}

func (s *BranchService) Delete(ctx context.Context, userID pgtype.UUID, id string) error {
	pgID, err := pgUUID(id)
	if err != nil {
		return ErrBranchNotFound
	}

	return s.queries.SoftDeleteBranch(ctx, repository.SoftDeleteBranchParams{
		ID:        pgID,
		UsuarioID: userID,
	})
}

func toBranchDetail(b repository.Sucursale) BranchDetail {
	return BranchDetail{
		ID:        uuidStrFromPg(b.ID),
		Nombre:    b.Nombre,
		Direccion: textFromPg(b.Direccion),
		Telefono:  textFromPg(b.Telefono),
	}
}
