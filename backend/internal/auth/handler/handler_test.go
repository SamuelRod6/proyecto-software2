package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"project/backend/internal/auth/dto"
	"project/backend/internal/auth/service"
	"project/backend/prisma/db"
)

type mockAuthRepo struct {
	findRoleByID    func(ctx context.Context, roleID int) (*db.RolesModel, error)
	createUser      func(ctx context.Context, name, email, passwordHash string, roleID int) (*db.UsuarioModel, error)
	findUserByEmail func(ctx context.Context, email string) (*db.UsuarioModel, error)
	updatePassword  func(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error)
}

func (m mockAuthRepo) FindRoleByID(ctx context.Context, roleID int) (*db.RolesModel, error) {
	if m.findRoleByID == nil {
		return nil, errors.New("not implemented")
	}
	return m.findRoleByID(ctx, roleID)
}

func (m mockAuthRepo) CreateUser(ctx context.Context, name, email, passwordHash string, roleID int) (*db.UsuarioModel, error) {
	if m.createUser == nil {
		return nil, errors.New("not implemented")
	}
	return m.createUser(ctx, name, email, passwordHash, roleID)
}

func (m mockAuthRepo) FindUserByEmail(ctx context.Context, email string) (*db.UsuarioModel, error) {
	if m.findUserByEmail == nil {
		return nil, errors.New("not implemented")
	}
	return m.findUserByEmail(ctx, email)
}

func (m mockAuthRepo) UpdatePassword(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error) {
	if m.updatePassword == nil {
		return nil, errors.New("not implemented")
	}
	return m.updatePassword(ctx, email, passwordHash)
}

func TestRegisterHandler(t *testing.T) {
	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBufferString("{"))
		rr := httptest.NewRecorder()
		h := New(mockAuthRepo{})
		h.RegisterHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("success", func(t *testing.T) {
		reqBody := dto.RegisterRequest{
			Name:     "Juan Perez",
			Email:    "juan@example.com",
			Password: "Abcdef12",
			RoleID:   1,
		}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findRoleByID: func(_ context.Context, _ int) (*db.RolesModel, error) {
				return &db.RolesModel{InnerRoles: db.InnerRoles{IDRol: 1, NombreRol: "ADMIN"}}, nil
			},
			createUser: func(_ context.Context, name, email, _ string, roleID int) (*db.UsuarioModel, error) {
				return &db.UsuarioModel{InnerUsuario: db.InnerUsuario{IDUsuario: 10, Nombre: name, Email: email, IDRol: roleID}}, nil
			},
		}

		h := New(repo)
		h.RegisterHandler(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected %d, got %d", http.StatusCreated, rr.Code)
		}
	})
}

func TestLoginHandler(t *testing.T) {
	t.Run("invalid credentials", func(t *testing.T) {
		reqBody := dto.LoginRequest{Email: "nope@example.com", Password: "Abcdef12"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findUserByEmail: func(_ context.Context, _ string) (*db.UsuarioModel, error) {
				return nil, errors.New("not found")
			},
		}

		h := New(repo)
		h.LoginHandler(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected %d, got %d", http.StatusUnauthorized, rr.Code)
		}
	})

	t.Run("success", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "test-secret")
		passwordHash, err := service.HashPassword("Abcdef12")
		if err != nil {
			t.Fatalf("hash error: %v", err)
		}

		reqBody := dto.LoginRequest{Email: "user@example.com", Password: "Abcdef12"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findUserByEmail: func(_ context.Context, _ string) (*db.UsuarioModel, error) {
				return &db.UsuarioModel{InnerUsuario: db.InnerUsuario{IDUsuario: 2, Email: "user@example.com", PasswordHash: passwordHash, IDRol: 1}}, nil
			},
			findRoleByID: func(_ context.Context, _ int) (*db.RolesModel, error) {
				return &db.RolesModel{InnerRoles: db.InnerRoles{IDRol: 1, NombreRol: "ADMIN"}}, nil
			},
		}

		h := New(repo)
		h.LoginHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})
}

func TestResetPasswordHandler(t *testing.T) {
	t.Run("invalid email", func(t *testing.T) {
		reqBody := dto.ResetPasswordRequest{Email: "bad", NewPassword: "Abcdef12"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		h := New(mockAuthRepo{})
		h.ResetPasswordHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("success", func(t *testing.T) {
		reqBody := dto.ResetPasswordRequest{Email: "user@example.com", NewPassword: "Abcdef12"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			updatePassword: func(_ context.Context, _ string, _ string) (*db.UsuarioModel, error) {
				return &db.UsuarioModel{InnerUsuario: db.InnerUsuario{IDUsuario: 1}}, nil
			},
		}

		h := New(repo)
		h.ResetPasswordHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})
}

func TestLogoutHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	rr := httptest.NewRecorder()

	h := New(mockAuthRepo{})
	h.LogoutHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
	}
}
