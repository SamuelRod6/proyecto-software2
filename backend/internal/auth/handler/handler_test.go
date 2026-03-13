package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"project/backend/internal/auth/domain"
	"project/backend/internal/auth/dto"
	"project/backend/internal/auth/service"
	"project/backend/prisma/db"
)

type mockAuthRepo struct {
	findRoleByID           func(ctx context.Context, roleID int) (*db.RolesModel, error)
	createUser             func(ctx context.Context, name, email, passwordHash string, roleID int) (*db.UsuarioModel, error)
	findUserByEmail        func(ctx context.Context, email string) (*db.UsuarioModel, error)
	findPrimaryRole        func(ctx context.Context, userID int) (*db.RolesModel, error)
	listRoles              func(ctx context.Context, userID int) ([]db.RolesModel, error)
	updatePassword         func(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error)
	deleteRegistrationKeys func(ctx context.Context, email string) error
	createRegistrationKey  func(ctx context.Context, name, email, tokenHash string, expiresAt time.Time) error
	findRegistrationKey    func(ctx context.Context, email, tokenHash string, now time.Time) (*domain.RegistrationTemporaryKey, error)
	markRegistrationKey    func(ctx context.Context, keyID int) error
	deleteRecoveryTokens   func(ctx context.Context, userID int) error
	createRecoveryToken    func(ctx context.Context, userID int, tokenHash string, expiresAt time.Time) error
	findRecoveryToken      func(ctx context.Context, email, tokenHash string, now time.Time) (*domain.PasswordRecoveryToken, error)
	markRecoveryToken      func(ctx context.Context, tokenID int) error
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

func (m mockAuthRepo) FindPrimaryRoleByUserID(ctx context.Context, userID int) (*db.RolesModel, error) {
	if m.findPrimaryRole == nil {
		return nil, errors.New("not implemented")
	}
	return m.findPrimaryRole(ctx, userID)
}

func (m mockAuthRepo) ListRolesByUserID(ctx context.Context, userID int) ([]db.RolesModel, error) {
	if m.listRoles == nil {
		return nil, errors.New("not implemented")
	}
	return m.listRoles(ctx, userID)
}

func (m mockAuthRepo) UpdatePassword(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error) {
	if m.updatePassword == nil {
		return nil, errors.New("not implemented")
	}
	return m.updatePassword(ctx, email, passwordHash)
}

func (m mockAuthRepo) DeleteActiveRegistrationTemporaryKeysByEmail(ctx context.Context, email string) error {
	if m.deleteRegistrationKeys == nil {
		return errors.New("not implemented")
	}
	return m.deleteRegistrationKeys(ctx, email)
}

func (m mockAuthRepo) CreateRegistrationTemporaryKey(ctx context.Context, name, email, tokenHash string, expiresAt time.Time) error {
	if m.createRegistrationKey == nil {
		return errors.New("not implemented")
	}
	return m.createRegistrationKey(ctx, name, email, tokenHash, expiresAt)
}

func (m mockAuthRepo) FindValidRegistrationTemporaryKey(ctx context.Context, email, tokenHash string, now time.Time) (*domain.RegistrationTemporaryKey, error) {
	if m.findRegistrationKey == nil {
		return nil, errors.New("not implemented")
	}
	return m.findRegistrationKey(ctx, email, tokenHash, now)
}

func (m mockAuthRepo) MarkRegistrationTemporaryKeyUsed(ctx context.Context, keyID int) error {
	if m.markRegistrationKey == nil {
		return errors.New("not implemented")
	}
	return m.markRegistrationKey(ctx, keyID)
}

func (m mockAuthRepo) DeleteActivePasswordRecoveryTokens(ctx context.Context, userID int) error {
	if m.deleteRecoveryTokens == nil {
		return errors.New("not implemented")
	}
	return m.deleteRecoveryTokens(ctx, userID)
}

func (m mockAuthRepo) CreatePasswordRecoveryToken(ctx context.Context, userID int, tokenHash string, expiresAt time.Time) error {
	if m.createRecoveryToken == nil {
		return errors.New("not implemented")
	}
	return m.createRecoveryToken(ctx, userID, tokenHash, expiresAt)
}

func (m mockAuthRepo) FindValidPasswordRecoveryToken(ctx context.Context, email, tokenHash string, now time.Time) (*domain.PasswordRecoveryToken, error) {
	if m.findRecoveryToken == nil {
		return nil, errors.New("not implemented")
	}
	return m.findRecoveryToken(ctx, email, tokenHash, now)
}

func (m mockAuthRepo) MarkPasswordRecoveryTokenUsed(ctx context.Context, tokenID int) error {
	if m.markRecoveryToken == nil {
		return errors.New("not implemented")
	}
	return m.markRecoveryToken(ctx, tokenID)
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
			Name:         "Juan Perez",
			Email:        "juan@example.com",
			Password:     "Abcdef12",
			TemporaryKey: "ABCD1234",
		}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findRegistrationKey: func(_ context.Context, _ string, _ string, _ time.Time) (*domain.RegistrationTemporaryKey, error) {
				return &domain.RegistrationTemporaryKey{ID: 55, Name: "Juan Perez", Email: "juan@example.com"}, nil
			},
			createUser: func(_ context.Context, name, email, _ string, roleID int) (*db.UsuarioModel, error) {
				if roleID != 0 {
					return nil, errors.New("expected roleID 0")
				}
				return &db.UsuarioModel{InnerUsuario: db.InnerUsuario{IDUsuario: 10, Nombre: name, Email: email}}, nil
			},
			markRegistrationKey: func(_ context.Context, keyID int) error {
				if keyID != 55 {
					return errors.New("unexpected key id")
				}
				return nil
			},
		}

		h := New(repo)
		h.RegisterHandler(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected %d, got %d", http.StatusCreated, rr.Code)
		}
	})
}

func TestRegisterTemporaryKeyHandlers(t *testing.T) {
	t.Run("request key success", func(t *testing.T) {
		reqBody := dto.RegistrationKeyRequest{Name: "Ana Perez", Email: "ana@example.com"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register/request-key", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findUserByEmail: func(_ context.Context, _ string) (*db.UsuarioModel, error) {
				return nil, errors.New("not found")
			},
			deleteRegistrationKeys: func(_ context.Context, _ string) error {
				return nil
			},
			createRegistrationKey: func(_ context.Context, _ string, _ string, _ string, _ time.Time) error {
				return nil
			},
		}

		h := New(repo)
		h.RequestRegisterTemporaryKeyHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})

	t.Run("verify key success", func(t *testing.T) {
		reqBody := dto.RegistrationKeyVerifyRequest{Email: "ana@example.com", TemporaryKey: "ABCD1234"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register/verify-key", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findRegistrationKey: func(_ context.Context, email, _ string, _ time.Time) (*domain.RegistrationTemporaryKey, error) {
				return &domain.RegistrationTemporaryKey{ID: 1, Name: "Ana Perez", Email: email}, nil
			},
		}

		h := New(repo)
		h.VerifyRegisterTemporaryKeyHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
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
				return &db.UsuarioModel{InnerUsuario: db.InnerUsuario{IDUsuario: 2, Email: "user@example.com", PasswordHash: passwordHash}}, nil
			},
			listRoles: func(_ context.Context, _ int) ([]db.RolesModel, error) {
				return []db.RolesModel{
					{InnerRoles: db.InnerRoles{IDRol: 1, NombreRol: "ADMIN"}},
				}, nil
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

func TestPasswordRecoveryHandlers(t *testing.T) {
	t.Run("request invalid email", func(t *testing.T) {
		reqBody := dto.PasswordRecoveryRequest{Email: "bad"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/password-recovery/request", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		h := New(mockAuthRepo{})
		h.RequestPasswordRecoveryHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("verify success", func(t *testing.T) {
		reqBody := dto.PasswordRecoveryVerifyRequest{Email: "user@example.com", TemporaryKey: "ABCD1234"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/password-recovery/verify", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findRecoveryToken: func(_ context.Context, email, _ string, _ time.Time) (*domain.PasswordRecoveryToken, error) {
				return &domain.PasswordRecoveryToken{ID: 10, IDUsuario: 1, Email: email}, nil
			},
		}

		h := New(repo)
		h.VerifyPasswordRecoveryHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})

	t.Run("confirm success", func(t *testing.T) {
		reqBody := dto.PasswordRecoveryResetRequest{Email: "user@example.com", TemporaryKey: "ABCD1234", NewPassword: "Abcdef12"}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/password-recovery/reset", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		repo := mockAuthRepo{
			findRecoveryToken: func(_ context.Context, _ string, _ string, _ time.Time) (*domain.PasswordRecoveryToken, error) {
				return &domain.PasswordRecoveryToken{ID: 77, IDUsuario: 1, Email: "user@example.com"}, nil
			},
			updatePassword: func(_ context.Context, _ string, _ string) (*db.UsuarioModel, error) {
				return &db.UsuarioModel{InnerUsuario: db.InnerUsuario{IDUsuario: 1}}, nil
			},
			markRecoveryToken: func(_ context.Context, tokenID int) error {
				if tokenID != 77 {
					return errors.New("unexpected token id")
				}
				return nil
			},
		}

		h := New(repo)
		h.ConfirmPasswordRecoveryHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})
}
