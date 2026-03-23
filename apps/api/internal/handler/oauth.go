package handler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/pronto-erp/pronto/internal/config"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/service"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// OAuthHandler manages Google OAuth login/callback flows.
type OAuthHandler struct {
	authSvc    *service.AuthService
	cfg        *oauth2.Config
	corsOrigin string
	secure     bool
}

// NewOAuthHandler creates a new OAuth handler. If Google credentials are not
// configured the handler will return 501 for every request.
func NewOAuthHandler(authSvc *service.AuthService, appCfg *config.Config) *OAuthHandler {
	var oauthCfg *oauth2.Config
	if appCfg.GoogleClientID != "" {
		oauthCfg = &oauth2.Config{
			ClientID:     appCfg.GoogleClientID,
			ClientSecret: appCfg.GoogleClientSecret,
			RedirectURL:  appCfg.GoogleRedirectURL,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		}
	}

	return &OAuthHandler{
		authSvc:    authSvc,
		cfg:        oauthCfg,
		corsOrigin: appCfg.CORSAllowedOrigins,
		secure:     appCfg.Env != "development",
	}
}

// GoogleLogin redirects the user to Google's OAuth consent screen.
func (h *OAuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if h.cfg == nil {
		response.Error(w, http.StatusNotImplemented, "OAUTH_NOT_CONFIGURED", "Google OAuth no esta configurado")
		return
	}

	state := generateRandomState()
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   300,
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})

	url := h.cfg.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// GoogleCallback handles the redirect from Google after the user consents.
func (h *OAuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	if h.cfg == nil {
		response.Error(w, http.StatusNotImplemented, "OAUTH_NOT_CONFIGURED", "Google OAuth no esta configurado")
		return
	}

	feURL := h.frontendURL()

	// Verify state parameter for CSRF protection.
	stateCookie, err := r.Cookie("oauth_state")
	if err != nil || stateCookie.Value != r.URL.Query().Get("state") {
		http.Redirect(w, r, feURL+"/login?error=invalid_state", http.StatusTemporaryRedirect)
		return
	}

	// Clear state cookie.
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})

	// Check for error from Google.
	if errParam := r.URL.Query().Get("error"); errParam != "" {
		http.Redirect(w, r, feURL+"/login?error="+errParam, http.StatusTemporaryRedirect)
		return
	}

	// Exchange authorization code for tokens.
	code := r.URL.Query().Get("code")
	token, err := h.cfg.Exchange(context.Background(), code)
	if err != nil {
		http.Redirect(w, r, feURL+"/login?error=exchange_failed", http.StatusTemporaryRedirect)
		return
	}

	// Fetch user info from Google.
	client := h.cfg.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Redirect(w, r, feURL+"/login?error=userinfo_failed", http.StatusTemporaryRedirect)
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		Email      string `json:"email"`
		Name       string `json:"given_name"`
		FamilyName string `json:"family_name"`
		Picture    string `json:"picture"`
		Verified   bool   `json:"verified_email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		http.Redirect(w, r, feURL+"/login?error=decode_failed", http.StatusTemporaryRedirect)
		return
	}

	// Authenticate or register in our system.
	result, err := h.authSvc.LoginOrRegisterGoogle(r.Context(), service.GoogleLoginInput{
		Email:    googleUser.Email,
		Nombre:   googleUser.Name,
		Apellido: googleUser.FamilyName,
	})
	if err != nil {
		http.Redirect(w, r, feURL+"/login?error=auth_failed", http.StatusTemporaryRedirect)
		return
	}

	// Set auth cookies (same approach as normal login).
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    result.AccessToken,
		Path:     "/",
		MaxAge:   900, // 15 minutes
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    result.RefreshToken,
		Path:     "/api/v1/auth",
		MaxAge:   7 * 24 * 3600,
		HttpOnly: true,
		Secure:   h.secure,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, feURL+"/dashboard", http.StatusTemporaryRedirect)
}

// frontendURL extracts the first origin from the CORS configuration.
func (h *OAuthHandler) frontendURL() string {
	origins := strings.TrimSpace(h.corsOrigin)
	if origins == "" {
		return "http://localhost:3000"
	}
	if idx := strings.Index(origins, ","); idx > 0 {
		return strings.TrimSpace(origins[:idx])
	}
	return origins
}

// generateRandomState creates a cryptographically random hex string for CSRF.
func generateRandomState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
