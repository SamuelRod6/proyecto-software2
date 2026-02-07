package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project/backend/models"
	"project/backend/prisma/db"
	"project/backend/repository"
	"project/backend/services"
	"project/backend/utils"
)

type UserHandler struct {
	Repo        *repository.UserRepository
	RoleService services.UserRoleService
}

func NewUserHandler(repo *repository.UserRepository, roleService services.UserRoleService) *UserHandler {
	return &UserHandler{Repo: repo, RoleService: roleService}
}

// HelloHandler - returns a simple greeting
func (h *UserHandler) HelloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Hola, mundo"})
}

// UsersCountHandler - returns specific user count using DB
func (h *UserHandler) UsersCountHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	count, err := h.Repo.CountUsers(ctx)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrDatabase)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	utils.WriteSuccess(w, http.StatusOK, utils.SuccessGeneral, map[string]int{"count": count})
}

func (h *UserHandler) UsersListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, utils.ErrMethodNotAllowed)
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

	users, err := h.Repo.ListUsersWithRoles(ctx, limit, offset)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrDatabase)
		return
	}

	total, err := h.Repo.CountUsers(ctx)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrDatabase)
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

	utils.WriteSuccess(w, http.StatusOK, utils.SuccessGeneral, map[string]any{
		"users":  items,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *UserHandler) RolesListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, utils.ErrMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	roles, err := h.Repo.ListRoles(ctx)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, utils.ErrDatabase)
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

	utils.WriteSuccess(w, http.StatusOK, utils.SuccessGeneral, map[string]any{
		"roles": items,
	})
}

func (h *UserHandler) UpdateUserRoleHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.RoleService == nil {
		http.Error(w, "Role service unavailable", http.StatusInternalServerError)
		return
	}

	roleHeader := strings.TrimSpace(r.Header.Get("X-Role"))
	if strings.ToUpper(roleHeader) != "ADMIN" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req models.UpdateRoleRequest
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

	roleID, err := h.RoleService.GetRoleIDByName(ctx, req.Rol)
	if err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, "Role not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Error querying roles", http.StatusInternalServerError)
		return
	}

	if err := h.RoleService.UpdateUserRole(ctx, req.UserID, roleID); err != nil {
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
