package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"project/backend/prisma/db"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	RoleID   int    `json:"roleId"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthUser struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

type LoginResponse struct {
	Message string   `json:"message"`
	User    AuthUser `json:"user"`
	Token   string   `json:"token"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Name == "" || req.Email == "" || req.Password == "" || req.RoleID <= 0 {
		http.Error(w, "missing fields", http.StatusBadRequest)
		return
	}
	if len(req.Password) < 6 {
		http.Error(w, "password too short", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "hash error", http.StatusInternalServerError)
		return
	}

	role, err := prismaClient.Roles.FindUnique(
		db.Roles.IDRol.Equals(req.RoleID),
	).Exec(ctx)
	if err != nil {
		http.Error(w, "invalid role", http.StatusBadRequest)
		return
	}

	user, err := prismaClient.Usuario.CreateOne(
		db.Usuario.Nombre.Set(req.Name),
		db.Usuario.Email.Set(req.Email),
		db.Usuario.PasswordHash.Set(string(passwordHash)),
		db.Usuario.Rol.Link(db.Roles.IDRol.Equals(role.IDRol)),
	).Exec(ctx)
	if err != nil {
		http.Error(w, "user already exists or db error", http.StatusBadRequest)
		return
	}

	resp := map[string]any{
		"message": "user registered",
		"user": AuthUser{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Role:  role.NombreRol,
		},
	}
	writeJSON(w, http.StatusCreated, resp)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		http.Error(w, "missing fields", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	user, err := prismaClient.Usuario.FindUnique(
		db.Usuario.Email.Equals(req.Email),
	).Exec(ctx)
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	role, err := prismaClient.Roles.FindUnique(
		db.Roles.IDRol.Equals(user.IDRol),
	).Exec(ctx)
	if err != nil {
		http.Error(w, "role error", http.StatusInternalServerError)
		return
	}

	token, err := createJWT(user, role)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}

	resp := LoginResponse{
		Message: "login ok",
		User: AuthUser{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Role:  role.NombreRol,
		},
		Token: token,
	}
	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func createJWT(user *db.UsuarioModel, role *db.RolesModel) (string, error) {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		return "", errors.New("JWT_SECRET not set")
	}

	claims := jwt.MapClaims{
		"sub":   user.IDUsuario,
		"email": user.Email,
		"role":  role.NombreRol,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}