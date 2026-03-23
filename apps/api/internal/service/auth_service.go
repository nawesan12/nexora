package service

import (
	"context"
	randio "crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	jwtpkg "github.com/pronto-erp/pronto/internal/pkg/jwt"
	"github.com/pronto-erp/pronto/internal/permissions"
	"github.com/pronto-erp/pronto/internal/repository"
	"github.com/pronto-erp/pronto/internal/worker"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists          = errors.New("user already exists")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrUserNotFound        = errors.New("user not found")
	ErrTokenInvalid        = errors.New("token is invalid or expired")
	ErrEmailNotVerified    = errors.New("email not verified")
	ErrAccountDisabled     = errors.New("account disabled")
	ErrAccessCodeNotFound  = errors.New("access code not found")
)

type UserResponse struct {
	ID            string           `json:"id"`
	Email         string           `json:"email"`
	Nombre        string           `json:"nombre"`
	Apellido      string           `json:"apellido"`
	Rol           string           `json:"rol"`
	Permissions   []string         `json:"permissions"`
	EmailVerified bool             `json:"email_verified"`
	Sucursales    []BranchResponse `json:"sucursales"`
}

type BranchResponse struct {
	ID        string `json:"id"`
	Nombre    string `json:"nombre"`
	Direccion string `json:"direccion,omitempty"`
}

type AuthService struct {
	db          *pgxpool.Pool
	queries     *repository.Queries
	jwt         *jwtpkg.Manager
	asynqClient *asynq.Client
	appURL      string
}

func NewAuthService(db *pgxpool.Pool, jwt *jwtpkg.Manager, asynqClient *asynq.Client, appURL string) *AuthService {
	return &AuthService{
		db:          db,
		queries:     repository.New(db),
		jwt:         jwt,
		asynqClient: asynqClient,
		appURL:      appURL,
	}
}

type RegisterInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Nombre   string `json:"nombre" validate:"required,min=2"`
	Apellido string `json:"apellido" validate:"required,min=2"`
	Empresa  string `json:"empresa" validate:"required,min=2"`
}

type RegisterResult struct {
	User              UserResponse
	AccessToken       string
	RefreshToken      string
	RefreshExpiry     time.Time
	VerificationToken string
}

func (s *AuthService) Register(ctx context.Context, input RegisterInput) (*RegisterResult, error) {
	_, err := s.queries.GetUserByEmail(ctx, input.Email)
	if err == nil {
		return nil, ErrUserExists
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("check user: %w", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	user, err := qtx.CreateUser(ctx, repository.CreateUserParams{
		Email:        input.Email,
		PasswordHash: string(hash),
		Nombre:       input.Nombre,
		Apellido:     input.Apellido,
		Rol:          repository.RolADMIN,
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	_, err = qtx.CreateBranch(ctx, repository.CreateBranchParams{
		Nombre:    input.Empresa,
		Direccion: pgtype.Text{},
		Telefono:  pgtype.Text{},
		UsuarioID: user.ID,
	})
	if err != nil {
		return nil, fmt.Errorf("create branch: %w", err)
	}

	_, err = qtx.CreateUserSettings(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("create settings: %w", err)
	}

	verificationRaw := uuid.New().String()
	verificationHash := jwtpkg.HashToken(verificationRaw)
	_, err = qtx.CreateEmailVerificationToken(ctx, repository.CreateEmailVerificationTokenParams{
		Email:     input.Email,
		TokenHash: verificationHash,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(24 * time.Hour), Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create verification token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	branches, _ := s.queries.ListBranchesByUser(ctx, user.ID)

	userID := uuidFromPgtype(user.ID)
	sucursales := toBranchResponses(branches)
	var sucursalIDs []string
	for _, b := range sucursales {
		sucursalIDs = append(sucursalIDs, b.ID)
	}

	resolvedPerms := permissions.ResolvePermissions(string(user.Rol), nil)

	accessToken, err := s.jwt.GenerateAccessToken(jwtpkg.Claims{
		UserID:      userID,
		Role:        string(user.Rol),
		Permissions: resolvedPerms,
		Sucursales:  sucursalIDs,
		Name:        user.Nombre + " " + user.Apellido,
		Email:       user.Email,
	})
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshRaw, refreshHash, refreshExpiry, err := s.jwt.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	_, err = s.queries.CreateRefreshToken(ctx, repository.CreateRefreshTokenParams{
		UsuarioID: user.ID,
		TokenHash: refreshHash,
		ExpiresAt: pgtype.Timestamptz{Time: refreshExpiry, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	// Enqueue welcome + verification emails
	s.enqueueEmail(func() (*asynq.Task, error) {
		return worker.NewWelcomeEmailTask(user.Email, user.Nombre, s.appURL+"/login")
	})
	s.enqueueEmail(func() (*asynq.Task, error) {
		return worker.NewEmailVerificationTask(user.Email, user.Nombre, s.appURL+"/verify?token="+verificationRaw)
	})

	return &RegisterResult{
		User: UserResponse{
			ID:            userID.String(),
			Email:         user.Email,
			Nombre:        user.Nombre,
			Apellido:      user.Apellido,
			Rol:           string(user.Rol),
			Permissions:   resolvedPerms,
			EmailVerified: user.EmailVerified,
			Sucursales:    sucursales,
		},
		AccessToken:       accessToken,
		RefreshToken:      refreshRaw,
		RefreshExpiry:     refreshExpiry,
		VerificationToken: verificationRaw,
	}, nil
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResult struct {
	User          UserResponse
	AccessToken   string
	RefreshToken  string
	RefreshExpiry time.Time
}

func (s *AuthService) LoginWithEmail(ctx context.Context, input LoginInput) (*LoginResult, error) {
	user, err := s.queries.GetUserByEmail(ctx, input.Email)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}

	if !user.Active {
		return nil, ErrAccountDisabled
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.generateLoginResult(ctx, user)
}

type AccessCodeInput struct {
	AccessCode string `json:"access_code" validate:"required,min=4,max=10"`
}

func (s *AuthService) LoginWithAccessCode(ctx context.Context, input AccessCodeInput) (*LoginResult, error) {
	emp, err := s.queries.GetEmployeeByAccessCode(ctx, pgtype.Text{String: input.AccessCode, Valid: true})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrAccessCodeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get employee: %w", err)
	}

	user, err := s.queries.GetUserByID(ctx, emp.UsuarioID)
	if err != nil {
		return nil, fmt.Errorf("get owner user: %w", err)
	}

	branches, _ := s.queries.ListEmployeeBranches(ctx, emp.ID)
	empID := uuidFromPgtype(emp.ID)

	var sucursalIDs []string
	var sucursales []BranchResponse
	for _, b := range branches {
		bid := uuidFromPgtype(b.ID)
		sucursalIDs = append(sucursalIDs, bid.String())
		sucursales = append(sucursales, BranchResponse{
			ID:     bid.String(),
			Nombre: b.Nombre,
		})
	}

	if len(sucursales) == 0 {
		sid := uuidFromPgtype(emp.SucursalID)
		sucursalIDs = []string{sid.String()}
		sucursales = []BranchResponse{{ID: sid.String(), Nombre: emp.SucursalNombre}}
	}

	overrides := s.fetchPermissionOverrides(ctx, emp.UsuarioID, string(emp.Rol))
	resolvedPerms := permissions.ResolvePermissions(string(emp.Rol), overrides)

	accessToken, err := s.jwt.GenerateAccessToken(jwtpkg.Claims{
		UserID:      empID,
		Role:        string(emp.Rol),
		Permissions: resolvedPerms,
		Sucursales:  sucursalIDs,
		Name:        emp.Nombre + " " + emp.Apellido,
		Email:       user.Email,
	})
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshRaw, refreshHash, refreshExpiry, err := s.jwt.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	_, err = s.queries.CreateRefreshToken(ctx, repository.CreateRefreshTokenParams{
		UsuarioID: emp.UsuarioID,
		TokenHash: refreshHash,
		ExpiresAt: pgtype.Timestamptz{Time: refreshExpiry, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &LoginResult{
		User: UserResponse{
			ID:            empID.String(),
			Email:         user.Email,
			Nombre:        emp.Nombre,
			Apellido:      emp.Apellido,
			Rol:           string(emp.Rol),
			Permissions:   resolvedPerms,
			EmailVerified: true,
			Sucursales:    sucursales,
		},
		AccessToken:   accessToken,
		RefreshToken:  refreshRaw,
		RefreshExpiry: refreshExpiry,
	}, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, rawToken string) (*LoginResult, error) {
	tokenHash := jwtpkg.HashToken(rawToken)
	rt, err := s.queries.GetRefreshToken(ctx, tokenHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTokenInvalid
	}
	if err != nil {
		return nil, fmt.Errorf("get refresh token: %w", err)
	}

	_ = s.queries.RevokeRefreshToken(ctx, tokenHash)

	user, err := s.queries.GetUserByID(ctx, rt.UsuarioID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}

	return s.generateLoginResult(ctx, user)
}

func (s *AuthService) Logout(ctx context.Context, refreshTokenRaw string, userID pgtype.UUID) error {
	if refreshTokenRaw != "" {
		hash := jwtpkg.HashToken(refreshTokenRaw)
		_ = s.queries.RevokeRefreshToken(ctx, hash)
	}
	return nil
}

func (s *AuthService) GetMe(ctx context.Context, userID uuid.UUID) (*UserResponse, error) {
	pgID := pgtype.UUID{Bytes: userID, Valid: true}
	user, err := s.queries.GetUserByID(ctx, pgID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}

	branches, _ := s.queries.ListBranchesByUser(ctx, user.ID)
	overrides := s.fetchPermissionOverrides(ctx, user.ID, string(user.Rol))
	resolvedPerms := permissions.ResolvePermissions(string(user.Rol), overrides)

	resp := &UserResponse{
		ID:            uuidFromPgtype(user.ID).String(),
		Email:         user.Email,
		Nombre:        user.Nombre,
		Apellido:      user.Apellido,
		Rol:           string(user.Rol),
		Permissions:   resolvedPerms,
		EmailVerified: user.EmailVerified,
		Sucursales:    toBranchResponses(branches),
	}
	return resp, nil
}

func (s *AuthService) RequestPasswordReset(ctx context.Context, email string) (string, error) {
	user, err := s.queries.GetUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil // don't reveal if user exists
	}
	if err != nil {
		return "", fmt.Errorf("get user: %w", err)
	}

	raw := uuid.New().String()
	hash := jwtpkg.HashToken(raw)
	_, err = s.queries.CreatePasswordResetToken(ctx, repository.CreatePasswordResetTokenParams{
		Email:     email,
		TokenHash: hash,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(1 * time.Hour), Valid: true},
	})
	if err != nil {
		return "", fmt.Errorf("create token: %w", err)
	}

	// Enqueue password reset email
	s.enqueueEmail(func() (*asynq.Task, error) {
		return worker.NewPasswordResetTask(email, user.Nombre, s.appURL+"/reset-password?token="+raw)
	})

	return raw, nil
}

type ResetPasswordInput struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=8"`
}

func (s *AuthService) ResetPassword(ctx context.Context, input ResetPasswordInput) error {
	hash := jwtpkg.HashToken(input.Token)
	token, err := s.queries.GetPasswordResetToken(ctx, hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrTokenInvalid
	}
	if err != nil {
		return fmt.Errorf("get token: %w", err)
	}

	pwHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	err = s.queries.UpdateUserPassword(ctx, repository.UpdateUserPasswordParams{
		PasswordHash: string(pwHash),
		Email:        token.Email,
	})
	if err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	_ = s.queries.MarkPasswordResetTokenUsed(ctx, token.ID)
	return nil
}

type VerifyEmailInput struct {
	Token string `json:"token" validate:"required"`
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	hash := jwtpkg.HashToken(token)
	vt, err := s.queries.GetEmailVerificationToken(ctx, hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrTokenInvalid
	}
	if err != nil {
		return fmt.Errorf("get token: %w", err)
	}

	err = s.queries.UpdateUserEmailVerified(ctx, vt.Email)
	if err != nil {
		return fmt.Errorf("update verified: %w", err)
	}

	_ = s.queries.MarkEmailVerificationTokenUsed(ctx, vt.ID)
	return nil
}

// GoogleLoginInput holds Google OAuth user data.
type GoogleLoginInput struct {
	Email    string
	Nombre   string
	Apellido string
}

// LoginOrRegisterGoogle finds an existing user by email or creates a new one,
// then returns JWT tokens. The user's email is marked as verified.
func (s *AuthService) LoginOrRegisterGoogle(ctx context.Context, input GoogleLoginInput) (*LoginResult, error) {
	user, err := s.queries.GetUserByEmail(ctx, input.Email)
	if err == nil {
		// Existing user — generate tokens
		return s.generateLoginResult(ctx, user)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("get user by email: %w", err)
	}

	// User does not exist — register with a random password
	randomBytes := make([]byte, 32)
	if _, err := randio.Read(randomBytes); err != nil {
		return nil, fmt.Errorf("generate random password: %w", err)
	}
	randomPassword := hex.EncodeToString(randomBytes)

	hash, err := bcrypt.GenerateFromPassword([]byte(randomPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	nombre := input.Nombre
	if nombre == "" {
		nombre = "Usuario"
	}
	apellido := input.Apellido
	if apellido == "" {
		apellido = "Google"
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	user, err = qtx.CreateUser(ctx, repository.CreateUserParams{
		Email:        input.Email,
		PasswordHash: string(hash),
		Nombre:       nombre,
		Apellido:     apellido,
		Rol:          repository.RolADMIN,
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	_, err = qtx.CreateBranch(ctx, repository.CreateBranchParams{
		Nombre:    nombre + " " + apellido,
		Direccion: pgtype.Text{},
		Telefono:  pgtype.Text{},
		UsuarioID: user.ID,
	})
	if err != nil {
		return nil, fmt.Errorf("create branch: %w", err)
	}

	_, err = qtx.CreateUserSettings(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("create settings: %w", err)
	}

	// Mark email as verified since Google already verified it
	err = qtx.UpdateUserEmailVerified(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("verify email: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	// Re-fetch user to get updated email_verified flag
	user, err = s.queries.GetUserByEmail(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("re-fetch user: %w", err)
	}

	return s.generateLoginResult(ctx, user)
}

// helpers

func (s *AuthService) generateLoginResult(ctx context.Context, user repository.Usuario) (*LoginResult, error) {
	branches, _ := s.queries.ListBranchesByUser(ctx, user.ID)

	userID := uuidFromPgtype(user.ID)
	sucursales := toBranchResponses(branches)
	var sucursalIDs []string
	for _, b := range sucursales {
		sucursalIDs = append(sucursalIDs, b.ID)
	}

	overrides := s.fetchPermissionOverrides(ctx, user.ID, string(user.Rol))
	resolvedPerms := permissions.ResolvePermissions(string(user.Rol), overrides)

	accessToken, err := s.jwt.GenerateAccessToken(jwtpkg.Claims{
		UserID:      userID,
		Role:        string(user.Rol),
		Permissions: resolvedPerms,
		Sucursales:  sucursalIDs,
		Name:        user.Nombre + " " + user.Apellido,
		Email:       user.Email,
	})
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshRaw, refreshHash, refreshExpiry, err := s.jwt.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	_, err = s.queries.CreateRefreshToken(ctx, repository.CreateRefreshTokenParams{
		UsuarioID: user.ID,
		TokenHash: refreshHash,
		ExpiresAt: pgtype.Timestamptz{Time: refreshExpiry, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &LoginResult{
		User: UserResponse{
			ID:            userID.String(),
			Email:         user.Email,
			Nombre:        user.Nombre,
			Apellido:      user.Apellido,
			Rol:           string(user.Rol),
			Permissions:   resolvedPerms,
			EmailVerified: user.EmailVerified,
			Sucursales:    sucursales,
		},
		AccessToken:   accessToken,
		RefreshToken:  refreshRaw,
		RefreshExpiry: refreshExpiry,
	}, nil
}

func uuidFromPgtype(id pgtype.UUID) uuid.UUID {
	return uuid.UUID(id.Bytes)
}

func (s *AuthService) fetchPermissionOverrides(ctx context.Context, usuarioID pgtype.UUID, role string) []permissions.Override {
	rows, err := s.queries.ListPermissionOverridesByUserAndRole(ctx, repository.ListPermissionOverridesByUserAndRoleParams{
		UsuarioID: usuarioID,
		Rol:       repository.Rol(role),
	})
	if err != nil {
		return nil
	}
	overrides := make([]permissions.Override, len(rows))
	for i, r := range rows {
		overrides[i] = permissions.Override{
			Permission: r.Permission,
			Granted:    r.Granted,
		}
	}
	return overrides
}

func toBranchResponses(branches []repository.Sucursale) []BranchResponse {
	result := make([]BranchResponse, 0, len(branches))
	for _, b := range branches {
		br := BranchResponse{
			ID:     uuidFromPgtype(b.ID).String(),
			Nombre: b.Nombre,
		}
		if b.Direccion.Valid {
			br.Direccion = b.Direccion.String
		}
		result = append(result, br)
	}
	return result
}

func (s *AuthService) enqueueEmail(fn func() (*asynq.Task, error)) {
	if s.asynqClient == nil {
		return
	}
	task, err := fn()
	if err != nil {
		log.Error().Err(err).Msg("failed to create email task")
		return
	}
	if _, err := s.asynqClient.Enqueue(task); err != nil {
		log.Error().Err(err).Msg("failed to enqueue email task")
	}
}
