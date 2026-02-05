package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHelloHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/hello", nil)
	rr := httptest.NewRecorder()
	HelloHandler(rr, req)
	if rr.Code != 200 {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	got := rr.Body.String()
	want := "{\"message\":\"Hola, mundo\"}\n"
	if got != want {
		t.Fatalf("expected %s got %s", want, got)
	}
}

func TestUpdateUserRoleHandler(t *testing.T) {
	t.Run("method not allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/admin/assign-role", nil)
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusMethodNotAllowed {
			t.Fatalf("expected %d, got %d", http.StatusMethodNotAllowed, rr.Code)
		}
	})

	t.Run("forbidden without admin role", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", nil)
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected %d, got %d", http.StatusForbidden, rr.Code)
		}
	})

	t.Run("invalid body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", strings.NewReader("{"))
		req.Header.Set("X-Role", "ADMIN") // Temporal hasta merge con auth
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("invalid input - empty role", func(t *testing.T) {
		body := `{"user_id":1,"rol":""}`
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", strings.NewReader(body))
		req.Header.Set("X-Role", "ADMIN")
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("invalid input - user_id <= 0", func(t *testing.T) {
		body := `{"user_id":0,"rol":"ADMIN"}`
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", strings.NewReader(body))
		req.Header.Set("X-Role", "ADMIN")
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("missing fields", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", strings.NewReader(`{"user_id":0,"rol":""}`))
		req.Header.Set("X-Role", "ADMIN") // Temporal hasta merge con auth
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("success", func(t *testing.T) {
		orig := userRoleService
		userRoleService = mockUserRoleService{roleID: 1}
		defer func() { userRoleService = orig }()

		body := `{"user_id":1,"rol":"ADMIN"}`
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", strings.NewReader(body))
		req.Header.Set("X-Role", "ADMIN")
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})

	t.Run("db error on role lookup", func(t *testing.T) {
		orig := userRoleService
		userRoleService = mockUserRoleService{getRoleErr: errors.New("boom")}
		defer func() { userRoleService = orig }()

		body := `{"user_id":1,"rol":"ADMIN"}`
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", strings.NewReader(body))
		req.Header.Set("X-Role", "ADMIN")
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected %d, got %d", http.StatusInternalServerError, rr.Code)
		}
	})

	t.Run("db error on update", func(t *testing.T) {
		orig := userRoleService
		userRoleService = mockUserRoleService{roleID: 1, updateErr: errors.New("boom")}
		defer func() { userRoleService = orig }()

		body := `{"user_id":1,"rol":"ADMIN"}`
		req := httptest.NewRequest(http.MethodPut, "/api/admin/assign-role", strings.NewReader(body))
		req.Header.Set("X-Role", "ADMIN")
		rr := httptest.NewRecorder()
		UpdateUserRoleHandler(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected %d, got %d", http.StatusInternalServerError, rr.Code)
		}
	})
}
