package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"project/backend/internal/shared/response"
	"project/backend/internal/users/handler/mocks"
	"project/backend/prisma/db"
)

type mockUserService struct {
    count     int
    countErr  error
    users     []db.UsuarioModel
    usersErr  error
    roles     []db.RolesModel
    rolesErr  error
}

func (m mockUserService) CountUsers(_ context.Context) (int, error) {
    return m.count, m.countErr
}

func (m mockUserService) ListUsersWithRoles(_ context.Context, _ int, _ int) ([]db.UsuarioModel, error) {
    return m.users, m.usersErr
}

func (m mockUserService) ListRoles(_ context.Context) ([]db.RolesModel, error) {
    return m.roles, m.rolesErr
}

func TestUpdateUserRoleHandler(t *testing.T) {
    newHandler := func(service mocks.MockUserRoleService) *Handler {
        return New(nil, service)
    }

    t.Run("method not allowed", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/api/user/assign-role", nil)
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusMethodNotAllowed {
            t.Fatalf("expected %d, got %d", http.StatusMethodNotAllowed, rr.Code)
        }
    })

    t.Run("forbidden without admin role", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", nil)
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusForbidden {
            t.Fatalf("expected %d, got %d", http.StatusForbidden, rr.Code)
        }
    })

    t.Run("invalid body", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", strings.NewReader("{"))
        req.Header.Set("X-Role", "ADMIN")
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusBadRequest {
            t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
        }
    })

    t.Run("invalid input - empty role", func(t *testing.T) {
        body := `{"user_id":1,"rol":""}`
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", strings.NewReader(body))
        req.Header.Set("X-Role", "ADMIN")
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusBadRequest {
            t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
        }
    })

    t.Run("invalid input - user_id <= 0", func(t *testing.T) {
        body := `{"user_id":0,"rol":"ADMIN"}`
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", strings.NewReader(body))
        req.Header.Set("X-Role", "ADMIN")
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusBadRequest {
            t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
        }
    })

    t.Run("missing fields", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", strings.NewReader(`{"user_id":0,"rol":""}`))
        req.Header.Set("X-Role", "ADMIN")
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusBadRequest {
            t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
        }
    })

    t.Run("success", func(t *testing.T) {
        body := `{"user_id":1,"rol":"ADMIN"}`
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", strings.NewReader(body))
        req.Header.Set("X-Role", "ADMIN")
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{RoleID: 1})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusOK {
            t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
        }
    })

    t.Run("db error on role lookup", func(t *testing.T) {
        body := `{"user_id":1,"rol":"ADMIN"}`
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", strings.NewReader(body))
        req.Header.Set("X-Role", "ADMIN")
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{GetRoleErr: errors.New("boom")})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusInternalServerError {
            t.Fatalf("expected %d, got %d", http.StatusInternalServerError, rr.Code)
        }
    })

    t.Run("db error on update", func(t *testing.T) {
        body := `{"user_id":1,"rol":"ADMIN"}`
        req := httptest.NewRequest(http.MethodPut, "/api/user/assign-role", strings.NewReader(body))
        req.Header.Set("X-Role", "ADMIN")
        rr := httptest.NewRecorder()
        h := newHandler(mocks.MockUserRoleService{RoleID: 1, UpdateErr: errors.New("boom")})
        h.UpdateUserRoleHandler(rr, req)
        if rr.Code != http.StatusInternalServerError {
            t.Fatalf("expected %d, got %d", http.StatusInternalServerError, rr.Code)
        }
    })
}

func TestHelloHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/api/hello", nil)
    rr := httptest.NewRecorder()

    h := &Handler{}
    h.HelloHandler(rr, req)

    if rr.Code != http.StatusOK {
        t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
    }
}

func TestUsersCountHandler(t *testing.T) {
    t.Run("success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/api/users/count", nil)
        rr := httptest.NewRecorder()

        h := &Handler{svc: mockUserService{count: 3}}
        h.UsersCountHandler(rr, req)

        if rr.Code != http.StatusOK {
            t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
        }

        var resp response.APIResponse
        if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
            t.Fatalf("decode error: %v", err)
        }
    })

    t.Run("db error", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/api/users/count", nil)
        rr := httptest.NewRecorder()

        h := &Handler{svc: mockUserService{countErr: errors.New("boom")}}
        h.UsersCountHandler(rr, req)

        if rr.Code != http.StatusInternalServerError {
            t.Fatalf("expected %d, got %d", http.StatusInternalServerError, rr.Code)
        }
    })
}

func TestUsersListHandler(t *testing.T) {
    t.Run("method not allowed", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodPost, "/api/users", nil)
        rr := httptest.NewRecorder()

        h := &Handler{svc: mockUserService{}}
        h.UsersListHandler(rr, req)

        if rr.Code != http.StatusMethodNotAllowed {
            t.Fatalf("expected %d, got %d", http.StatusMethodNotAllowed, rr.Code)
        }
    })

    t.Run("success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/api/users?limit=5&offset=0", nil)
        rr := httptest.NewRecorder()

        users := []db.UsuarioModel{
            {
                InnerUsuario: db.InnerUsuario{IDUsuario: 1, Nombre: "Juan"},
                RelationsUsuario: db.RelationsUsuario{Rol: &db.RolesModel{InnerRoles: db.InnerRoles{NombreRol: "ADMIN"}}},
            },
        }

        h := &Handler{svc: mockUserService{users: users, count: 1}}
        h.UsersListHandler(rr, req)

        if rr.Code != http.StatusOK {
            t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
        }
    })
}

func TestRolesListHandler(t *testing.T) {
    t.Run("method not allowed", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodPost, "/api/roles", nil)
        rr := httptest.NewRecorder()

        h := &Handler{svc: mockUserService{}}
        h.RolesListHandler(rr, req)

        if rr.Code != http.StatusMethodNotAllowed {
            t.Fatalf("expected %d, got %d", http.StatusMethodNotAllowed, rr.Code)
        }
    })

    t.Run("success", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/api/roles", nil)
        rr := httptest.NewRecorder()

        roles := []db.RolesModel{{InnerRoles: db.InnerRoles{IDRol: 1, NombreRol: "ADMIN"}}}
        h := &Handler{svc: mockUserService{roles: roles}}
        h.RolesListHandler(rr, req)

        if rr.Code != http.StatusOK {
            t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
        }
    })
}
