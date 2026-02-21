package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project/backend/internal/roles"
	"project/backend/internal/shared/response"
	"project/backend/internal/users/repo"
	"project/backend/internal/users/service"
	"project/backend/prisma/db"
)

type Handler struct {
	svc         UserService
	roleService roles.UserRoleService
}

type UpdateRoleRequest struct {
	UserID int    `json:"user_id"`
	Rol    string `json:"rol"`
}

type UserService interface {
	CountUsers(ctx context.Context) (int, error)
	ListUsersWithRoles(ctx context.Context, limit, offset int) ([]db.UsuarioModel, error)
	ListRoles(ctx context.Context) ([]db.RolesModel, error)
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

func (h *Handler) UsersListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limit := 10
	offset := 0
	if rawLimit := strings.TrimSpace(r.URL.Query().Get("limit")); rawLimit != "" {
		if parsedLimit, err := strconv.Atoi(rawLimit); err == nil && parsedLimit > 0 {
			if parsedLimit > 100 {
				parsedLimit = 100
			}
			limit = parsedLimit
		}
	}
	if rawOffset := strings.TrimSpace(r.URL.Query().Get("offset")); rawOffset != "" {
		if parsedOffset, err := strconv.Atoi(rawOffset); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	users, err := h.svc.ListUsersWithRoles(ctx, limit, offset)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	total, err := h.svc.CountUsers(ctx)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	type userRoleItem struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
		Role string `json:"role"`
	}

	items := make([]userRoleItem, 0, len(users))
	for _, user := range users {
		roleName := ""
		if user.RelationsUsuario.Rol != nil {
			roleName = user.RelationsUsuario.Rol.NombreRol
		}
		items = append(items, userRoleItem{
			ID:   user.IDUsuario,
			Name: user.Nombre,
			Role: roleName,
		})
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"users":  items,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *Handler) RolesListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	roles, err := h.svc.ListRoles(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	type roleItem struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}

	items := make([]roleItem, 0, len(roles))
	for _, role := range roles {
		items = append(items, roleItem{
			ID:   role.IDRol,
			Name: role.NombreRol,
		})
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"roles": items,
	})
}

func (h *Handler) UpdateUserRoleHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	roleHeader := strings.TrimSpace(r.Header.Get("X-Role"))
	if !strings.EqualFold(roleHeader, "ADMIN") {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if h.roleService == nil {
		http.Error(w, "Role service unavailable", http.StatusInternalServerError)
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
