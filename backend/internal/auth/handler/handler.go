package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"project/backend/internal/auth/domain"
	"project/backend/internal/auth/dto"
	"project/backend/internal/auth/service"
	"project/backend/internal/auth/validation"
	"project/backend/internal/shared/response"
	"project/backend/internal/shared/smtp"
	"project/backend/prisma/db"
)

type Handler struct {
	Repo UserRepository
}

func mapRoles(roles []db.RolesModel) []domain.RoleInfo {
	items := make([]domain.RoleInfo, 0, len(roles))
	for _, role := range roles {
		items = append(items, domain.RoleInfo{ID: role.IDRol, Name: role.NombreRol})
	}
	return items
}

type UserRepository interface {
	FindRoleByID(ctx context.Context, roleID int) (*db.RolesModel, error)
	CreateUser(ctx context.Context, name, email, passwordHash string, roleID int) (*db.UsuarioModel, error)
	FindUserByEmail(ctx context.Context, email string) (*db.UsuarioModel, error)
	FindPrimaryRoleByUserID(ctx context.Context, userID int) (*db.RolesModel, error)
	ListRolesByUserID(ctx context.Context, userID int) ([]db.RolesModel, error)
	UpdatePassword(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error)
	DeleteActiveRegistrationTemporaryKeysByEmail(ctx context.Context, email string) error
	CreateRegistrationTemporaryKey(ctx context.Context, name, email, tokenHash string, expiresAt time.Time) error
	FindValidRegistrationTemporaryKey(ctx context.Context, email, tokenHash string, now time.Time) (*domain.RegistrationTemporaryKey, error)
	MarkRegistrationTemporaryKeyUsed(ctx context.Context, keyID int) error
	DeleteActivePasswordRecoveryTokens(ctx context.Context, userID int) error
	CreatePasswordRecoveryToken(ctx context.Context, userID int, tokenHash string, expiresAt time.Time) error
	FindValidPasswordRecoveryToken(ctx context.Context, email, tokenHash string, now time.Time) (*domain.PasswordRecoveryToken, error)
	MarkPasswordRecoveryTokenUsed(ctx context.Context, tokenID int) error
}

func New(repo UserRepository) *Handler {
	return &Handler{Repo: repo}
}

func (h *Handler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.TemporaryKey = service.NormalizeTemporaryKey(req.TemporaryKey)

	if !validation.ValidateUsername(req.Name) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidUsername)
		return
	}
	if !validation.ValidateEmail(req.Email) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidEmail)
		return
	}
	if !validation.ValidatePassword(req.Password) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidPassword)
		return
	}
	if req.TemporaryKey == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	registrationKey, err := h.Repo.FindValidRegistrationTemporaryKey(
		ctx,
		req.Email,
		service.HashTemporaryKey(req.TemporaryKey),
		time.Now().UTC(),
	)
	if err != nil {
		response.WriteError(w, http.StatusUnauthorized, response.ErrInvalidCredentials)
		return
	}

	if !strings.EqualFold(strings.TrimSpace(registrationKey.Name), req.Name) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidUsername)
		return
	}

	passwordHash, err := service.HashPassword(req.Password)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrHashPassword)
		return
	}

	user, err := h.Repo.CreateUser(ctx, req.Name, req.Email, passwordHash, 0)
	if err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrUserExists)
		return
	}

	if err = h.Repo.MarkRegistrationTemporaryKeyUsed(ctx, registrationKey.ID); err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	resp := map[string]any{
		"user": domain.AuthUser{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Roles: []domain.RoleInfo{},
		},
	}
	response.WriteSuccess(w, http.StatusCreated, response.SuccessRegister, resp)
}

func (h *Handler) RequestRegisterTemporaryKeyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.RegistrationKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if !validation.ValidateUsername(req.Name) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidUsername)
		return
	}
	if !validation.ValidateEmail(req.Email) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidEmail)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if _, err := h.Repo.FindUserByEmail(ctx, req.Email); err == nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrUserExists)
		return
	}

	temporaryKey, err := service.GenerateTemporaryKey(8)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrInternalServer)
		return
	}

	expiresAt := time.Now().UTC().Add(1 * time.Hour)
	if err := h.Repo.DeleteActiveRegistrationTemporaryKeysByEmail(ctx, req.Email); err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}
	if err := h.Repo.CreateRegistrationTemporaryKey(ctx, req.Name, req.Email, service.HashTemporaryKey(temporaryKey), expiresAt); err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	if err := smtp.SendRegistrationTemporaryKeyEmail(ctx, req.Email, temporaryKey, expiresAt); err != nil {
		log.Printf("registration temporary key email error: %v", err)
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]string{
		"message": "se envio una clave temporal a tu correo para completar el registro",
	})
}

func (h *Handler) VerifyRegisterTemporaryKeyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.RegistrationKeyVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.TemporaryKey = service.NormalizeTemporaryKey(req.TemporaryKey)

	if !validation.ValidateEmail(req.Email) || req.TemporaryKey == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	_, err := h.Repo.FindValidRegistrationTemporaryKey(ctx, req.Email, service.HashTemporaryKey(req.TemporaryKey), time.Now().UTC())
	if err != nil {
		response.WriteError(w, http.StatusUnauthorized, response.ErrInvalidCredentials)
		return
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"valid": true,
	})
}

func (h *Handler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	user, err := h.Repo.FindUserByEmail(ctx, req.Email)
	if err != nil {
		response.WriteError(w, http.StatusUnauthorized, response.ErrInvalidCredentials)
		return
	}

	if !service.CheckPasswordHash(user.PasswordHash, req.Password) {
		response.WriteError(w, http.StatusUnauthorized, response.ErrInvalidCredentials)
		return
	}

	roles, err := h.Repo.ListRolesByUserID(ctx, user.IDUsuario)
	if err != nil {
		if db.IsErrNotFound(err) {
			roles = []db.RolesModel{}
		} else {
			response.WriteError(w, http.StatusInternalServerError, response.ErrRoleInvalid)
			return
		}
	}
	primaryRole := ""
	if len(roles) > 0 {
		primaryRole = roles[0].NombreRol
	}

	token, err := service.CreateJWT(user.IDUsuario, user.Email, primaryRole)
	if err != nil {
		log.Printf("create jwt error: %v", err)
		response.WriteError(w, http.StatusInternalServerError, response.ErrTokenCreation)
		return
	}

	resp := dto.LoginResponse{
		Message: "login ok",
		User: domain.AuthUser{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Roles: mapRoles(roles),
		},
		Token: token,
	}
	response.WriteSuccess(w, http.StatusOK, response.SuccessLogin, resp)
}

func (h *Handler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	cookie := &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	}
	http.SetCookie(w, cookie)

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]string{
		"message": "logout successful",
	})
}

func (h *Handler) ResetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.NewPassword = strings.TrimSpace(req.NewPassword)

	if !validation.ValidateEmail(req.Email) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidEmail)
		return
	}
	if !validation.ValidatePassword(req.NewPassword) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidPassword)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	passwordHash, err := service.HashPassword(req.NewPassword)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrHashPassword)
		return
	}

	_, _ = h.Repo.UpdatePassword(ctx, req.Email, passwordHash)

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]string{
		"message": "if the email exists, the password has been updated",
	})
}

func (h *Handler) RequestPasswordRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.PasswordRecoveryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if !validation.ValidateEmail(req.Email) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidEmail)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	user, err := h.Repo.FindUserByEmail(ctx, req.Email)
	if err == nil {
		temporaryKey, keyErr := service.GenerateTemporaryKey(8)
		if keyErr == nil {
			expiresAt := time.Now().UTC().Add(1 * time.Hour)
			tokenHash := service.HashTemporaryKey(temporaryKey)

			if delErr := h.Repo.DeleteActivePasswordRecoveryTokens(ctx, user.IDUsuario); delErr == nil {
				if createErr := h.Repo.CreatePasswordRecoveryToken(ctx, user.IDUsuario, tokenHash, expiresAt); createErr == nil {
					if sendErr := smtp.SendPasswordRecoveryEmail(ctx, user.Email, temporaryKey, expiresAt); sendErr != nil {
						log.Printf("password recovery email error: %v", sendErr)
					}
				}
			}
		}
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]string{
		"message": "si el correo existe, se envió una clave temporal valida por 1 hora",
	})
}

func (h *Handler) VerifyPasswordRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.PasswordRecoveryVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.TemporaryKey = service.NormalizeTemporaryKey(req.TemporaryKey)

	if !validation.ValidateEmail(req.Email) || req.TemporaryKey == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	_, err := h.Repo.FindValidPasswordRecoveryToken(ctx, req.Email, service.HashTemporaryKey(req.TemporaryKey), time.Now().UTC())
	if err != nil {
		response.WriteError(w, http.StatusUnauthorized, response.ErrInvalidCredentials)
		return
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"valid": true,
	})
}

func (h *Handler) ConfirmPasswordRecoveryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		return
	}

	var req dto.PasswordRecoveryResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.TemporaryKey = service.NormalizeTemporaryKey(req.TemporaryKey)
	req.NewPassword = strings.TrimSpace(req.NewPassword)

	if !validation.ValidateEmail(req.Email) || req.TemporaryKey == "" || req.NewPassword == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}
	if !validation.ValidatePassword(req.NewPassword) {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidPassword)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	token, err := h.Repo.FindValidPasswordRecoveryToken(ctx, req.Email, service.HashTemporaryKey(req.TemporaryKey), time.Now().UTC())
	if err != nil {
		response.WriteError(w, http.StatusUnauthorized, response.ErrInvalidCredentials)
		return
	}

	passwordHash, err := service.HashPassword(req.NewPassword)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrHashPassword)
		return
	}

	if _, err = h.Repo.UpdatePassword(ctx, req.Email, passwordHash); err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}
	if err = h.Repo.MarkPasswordRecoveryTokenUsed(ctx, token.ID); err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]string{
		"message": "contraseña actualizada correctamente",
	})
}
