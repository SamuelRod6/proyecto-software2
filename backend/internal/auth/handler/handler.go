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
	"project/backend/prisma/db"
)

type Handler struct {
	Repo UserRepository
}

type UserRepository interface {
	FindRoleByID(ctx context.Context, roleID int) (*db.RolesModel, error)
	CreateUser(ctx context.Context, name, email, passwordHash string, roleID int) (*db.UsuarioModel, error)
	FindUserByEmail(ctx context.Context, email string) (*db.UsuarioModel, error)
	UpdatePassword(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error)
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

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	passwordHash, err := service.HashPassword(req.Password)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrHashPassword)
		return
	}

	role, err := h.Repo.FindRoleByID(ctx, req.RoleID)
	if err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrRoleInvalid)
		return
	}

	user, err := h.Repo.CreateUser(ctx, req.Name, req.Email, passwordHash, role.IDRol)
	if err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrUserExists)
		return
	}

	resp := map[string]any{
		"user": domain.AuthUser{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Role:  role.NombreRol,
		},
	}
	response.WriteSuccess(w, http.StatusCreated, response.SuccessRegister, resp)
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

	role, err := h.Repo.FindRoleByID(ctx, user.IDRol)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrRoleInvalid)
		return
	}
	
	token, err := service.CreateJWT(user.IDUsuario, user.Email, role.NombreRol)
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
			Role:  role.NombreRol,
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
