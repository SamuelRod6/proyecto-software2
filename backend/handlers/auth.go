package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"project/backend/models"
	"project/backend/repository"
	"project/backend/services"
	"project/backend/utils"
)

type AuthHandler struct {
	Repo *repository.UserRepository
}

func NewAuthHandler(repo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{Repo: repo}
}

func (h *AuthHandler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, utils.ErrMethodNotAllowed)
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidJSON)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if !services.ValidateUsername(req.Name) {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidUsername)
		return
	}
	if !services.ValidateEmail(req.Email) {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidEmail)
		return
	}
	if !services.ValidatePassword(req.Password) {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidPassword)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	passwordHash, err := services.HashPassword(req.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrHashPassword)
		return
	}

	role, err := h.Repo.FindRoleByID(ctx, req.RoleID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrRoleInvalid)
		return
	}

	user, err := h.Repo.CreateUser(ctx, req.Name, req.Email, passwordHash, role.IDRol)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrUserExists)
		return
	}

	resp := map[string]any{
		"user": models.AuthUser{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Role:  role.NombreRol,
		},
	}
	utils.WriteSuccess(w, http.StatusCreated, utils.SuccessRegister, resp)
}

func (h *AuthHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, utils.ErrMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidJSON)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrMissingFields)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	user, err := h.Repo.FindUserByEmail(ctx, req.Email)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, utils.ErrInvalidCredentials)
		return
	}

	if !services.CheckPasswordHash(user.PasswordHash, req.Password) {
		utils.WriteError(w, http.StatusUnauthorized, utils.ErrInvalidCredentials)
		return
	}

	role, err := h.Repo.FindRoleByID(ctx, user.IDRol)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrRoleInvalid)
		return
	}

	token, err := services.CreateJWT(user.IDUsuario, user.Email, role.NombreRol)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrTokenCreation)
		return
	}

	resp := models.LoginResponse{
		Message: "login ok",
		User: models.AuthUser{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Role:  role.NombreRol,
		},
		Token: token,
	}
	utils.WriteSuccess(w, http.StatusOK, utils.SuccessLogin, resp)
}

func (h *AuthHandler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, utils.ErrMethodNotAllowed)
		return
	}

	// If you store the JWT in a cookie on the client, clear the cookie here so
	// browsers will drop it. If the client stores the token in localStorage,
	// the client must remove it — server can't force that for SPAs.
	cookie := &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	}
	http.SetCookie(w, cookie)

	// Stateless JWTs: logout is effectively a client-side operation. If you
	// need server-side revocation, implement a blacklist (DB or Redis) and
	// store the token identifier or raw token until its expiration.
	utils.WriteSuccess(w, http.StatusOK, utils.SuccessGeneral, map[string]string{
		"message": "logout successful",
	})
}

func (h *AuthHandler) ResetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, utils.ErrMethodNotAllowed)
		return
	}

	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidJSON)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.NewPassword = strings.TrimSpace(req.NewPassword)

	if !services.ValidateEmail(req.Email) {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidEmail)
		return
	}
	if !services.ValidatePassword(req.NewPassword) {
		utils.WriteError(w, http.StatusBadRequest, utils.ErrInvalidPassword)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	passwordHash, err := services.HashPassword(req.NewPassword)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrHashPassword)
		return
	}

	// Try to update directly; if user doesn't exist, we just return success anyway
	_, _ = h.Repo.UpdatePassword(ctx, req.Email, passwordHash)

	utils.WriteSuccess(w, http.StatusOK, utils.SuccessGeneral, map[string]string{
		"message": "if the email exists, the password has been updated",
	})
}
