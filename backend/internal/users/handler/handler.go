package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"project/backend/internal/roles"
	"project/backend/internal/shared/response"
	"project/backend/internal/users/repo"
	"project/backend/internal/users/service"
	"project/backend/prisma/db"
)

type Handler struct {
	svc *service.Service
	roleService roles.UserRoleService
}

type UpdateRoleRequest struct {
	UserID int    `json:"user_id"`
	Rol    string `json:"rol"`
}

func New(repository *repo.UserRepository, roleService roles.UserRoleService) *Handler {
	return &Handler{svc: service.New(repository), roleService: roleService}
}

func (h *Handler) HelloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Hola, mundo"})
}

func (h *Handler) UsersCountHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	count, err := h.svc.CountUsers(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]int{"count": count})
}

func (h *Handler) UpdateUserRoleHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.roleService == nil {
		http.Error(w, "Role service unavailable", http.StatusInternalServerError)
		return
	}

	roleHeader := strings.TrimSpace(r.Header.Get("X-Role"))
	if strings.ToUpper(roleHeader) != "ADMIN" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID <= 0 || strings.TrimSpace(req.Rol) == "" {
		http.Error(w, "user_id and rol are required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	roleID, err := h.roleService.GetRoleIDByName(ctx, req.Rol)
	if err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, "Role not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Error querying roles", http.StatusInternalServerError)
		return
	}

	if err := h.roleService.UpdateUserRole(ctx, req.UserID, roleID); err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Error updating role", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Role updated successfully"})
}