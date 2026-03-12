package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
	secure      bool
}

func NewAuthHandler(authService *service.AuthService, secure bool) *AuthHandler {
	return &AuthHandler{authService: authService, secure: secure}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input service.RegisterInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.authService.Register(r.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrUserExists) {
			response.Error(w, http.StatusConflict, "USER_EXISTS", "ya existe un usuario con ese email")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al registrar usuario")
		return
	}

	h.setAuthCookies(w, result.AccessToken, result.RefreshToken, result.RefreshExpiry)
	response.Created(w, result.User)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input service.LoginInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.authService.LoginWithEmail(r.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "credenciales inválidas")
			return
		}
		if errors.Is(err, service.ErrAccountDisabled) {
			response.Error(w, http.StatusForbidden, "ACCOUNT_DISABLED", "cuenta deshabilitada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al iniciar sesión")
		return
	}

	h.setAuthCookies(w, result.AccessToken, result.RefreshToken, result.RefreshExpiry)
	response.JSON(w, http.StatusOK, result.User)
}

func (h *AuthHandler) LoginWithAccessCode(w http.ResponseWriter, r *http.Request) {
	var input service.AccessCodeInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.authService.LoginWithAccessCode(r.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrAccessCodeNotFound) {
			response.Error(w, http.StatusUnauthorized, "INVALID_ACCESS_CODE", "código de acceso inválido")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al iniciar sesión")
		return
	}

	h.setAuthCookies(w, result.AccessToken, result.RefreshToken, result.RefreshExpiry)
	response.JSON(w, http.StatusOK, result.User)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "NO_REFRESH_TOKEN", "no refresh token provided")
		return
	}

	result, err := h.authService.RefreshToken(r.Context(), cookie.Value)
	if err != nil {
		if errors.Is(err, service.ErrTokenInvalid) {
			h.clearAuthCookies(w)
			response.Error(w, http.StatusUnauthorized, "TOKEN_INVALID", "refresh token inválido o expirado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al refrescar token")
		return
	}

	h.setAuthCookies(w, result.AccessToken, result.RefreshToken, result.RefreshExpiry)
	response.JSON(w, http.StatusOK, result.User)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	refreshCookie, _ := r.Cookie("refresh_token")
	refreshToken := ""
	if refreshCookie != nil {
		refreshToken = refreshCookie.Value
	}

	claims := middleware.ClaimsFromContext(r.Context())
	if claims != nil {
		_ = h.authService.Logout(r.Context(), refreshToken, middleware.PgUserID(claims))
	}

	h.clearAuthCookies(w)
	response.JSON(w, http.StatusOK, response.Map{"message": "sesión cerrada"})
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email" validate:"required,email"`
	}
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	_, _ = h.authService.RequestPasswordReset(r.Context(), input.Email)
	// Always return success to not reveal if user exists
	response.JSON(w, http.StatusOK, response.Map{"message": "si el email existe, recibirás un enlace para restablecer tu contraseña"})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var input service.ResetPasswordInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	err := h.authService.ResetPassword(r.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrTokenInvalid) {
			response.Error(w, http.StatusBadRequest, "TOKEN_INVALID", "token inválido o expirado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al restablecer contraseña")
		return
	}

	response.JSON(w, http.StatusOK, response.Map{"message": "contraseña restablecida correctamente"})
}

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var input service.VerifyEmailInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	err := h.authService.VerifyEmail(r.Context(), input.Token)
	if err != nil {
		if errors.Is(err, service.ErrTokenInvalid) {
			response.Error(w, http.StatusBadRequest, "TOKEN_INVALID", "token inválido o expirado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al verificar email")
		return
	}

	response.JSON(w, http.StatusOK, response.Map{"message": "email verificado correctamente"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "no autenticado")
		return
	}

	user, err := h.authService.GetMe(r.Context(), claims.UserID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			response.Error(w, http.StatusNotFound, "USER_NOT_FOUND", "usuario no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener usuario")
		return
	}

	response.JSON(w, http.StatusOK, user)
}

func (h *AuthHandler) setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string, refreshExpiry time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		MaxAge:   900, // 15 minutes
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api/v1/auth",
		MaxAge:   int(time.Until(refreshExpiry).Seconds()),
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearAuthCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/v1/auth",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})
}
