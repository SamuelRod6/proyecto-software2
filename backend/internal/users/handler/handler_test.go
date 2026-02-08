package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"project/backend/internal/users/handler/mocks"
)

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
