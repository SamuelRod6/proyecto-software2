package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	roles "project/backend/internal/roles/service"
	"project/backend/internal/shared/response"
	"project/backend/internal/users/repo"
	"project/backend/internal/users/service"
	"project/backend/prisma/db"
)

type Handler struct {
	svc         UserService
	roleService roles.UserRoleService
}

const (
	contentTypeHeader = "Content-Type"
	contentTypeJSON   = "application/json"
	roleHeaderKey     = "X-Role"

	errMethodNotAllowed       = "Method not allowed"
	errForbidden              = "Forbidden"
	errRoleServiceUnavailable = "Role service unavailable"
	errQueryRoles             = "Error querying roles"
	errQueryPermissions       = "Error querying permissions"
	errInvalidBody            = "Invalid request body"
	errUserIDRequired         = "user_id is required"
	errUserIDAndRoleRequired  = "user_id and rol are required"
	errRoleNotFound           = "Role not found"
	errUserNotFound           = "User not found"
	errUpdateRole             = "Error updating role"
	errUpdateRoles            = "Error updating roles"
)

type UpdateRoleRequest struct {
	UserID int    `json:"user_id"`
	Rol    string `json:"rol"`
}

type UpdateRolesRequest struct {
	UserID int      `json:"user_id"`
	Roles  []string `json:"roles"`
}

type userRoleItem struct {
	ID    int      `json:"id"`
	Name  string   `json:"name"`
	Email string   `json:"email"`
	Roles []string `json:"roles"`
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
	w.Header().Set(contentTypeHeader, contentTypeJSON)
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
		http.Error(w, errMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}

	limit, offset := parsePagination(r)

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	users, err := h.svc.ListUsersWithRoles(ctx, limit, offset)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	total, err := h.svc.CountUsers(ctx)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	items := buildUserRoleItems(users)

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"users":  items,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *Handler) RolesListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, errMethodNotAllowed, http.StatusMethodNotAllowed)
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
		http.Error(w, errMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}

	roleHeader := strings.TrimSpace(r.Header.Get(roleHeaderKey))
	if roleHeader == "" {
		http.Error(w, errForbidden, http.StatusForbidden)
		return
	}
	roleNames := parseRoleHeader(roleHeader)
	if len(roleNames) == 0 {
		http.Error(w, errForbidden, http.StatusForbidden)
		return
	}

	if h.roleService == nil {
		http.Error(w, errRoleServiceUnavailable, http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	allowed, err := h.authorizeRolesManage(ctx, roleNames)
	if err != nil {
		http.Error(w, errQueryPermissions, http.StatusInternalServerError)
		return
	}
	if !allowed {
		http.Error(w, errForbidden, http.StatusForbidden)
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errInvalidBody, http.StatusBadRequest)
		return
	}

	if req.UserID <= 0 || strings.TrimSpace(req.Rol) == "" {
		http.Error(w, errUserIDAndRoleRequired, http.StatusBadRequest)
		return
	}

	roleID, err := h.roleService.GetRoleIDByName(ctx, req.Rol)
	if err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, errRoleNotFound, http.StatusNotFound)
			return
		}
		http.Error(w, errQueryRoles, http.StatusInternalServerError)
		return
	}

	if err := h.roleService.UpdateUserRole(ctx, req.UserID, roleID); err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, errUserNotFound, http.StatusNotFound)
			return
		}
		http.Error(w, errUpdateRole, http.StatusInternalServerError)
		return
	}

	w.Header().Set(contentTypeHeader, contentTypeJSON)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Role updated successfully"})
}

func (h *Handler) UpdateUserRolesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, errMethodNotAllowed, http.StatusMethodNotAllowed)
		return
	}

	roleHeader := strings.TrimSpace(r.Header.Get(roleHeaderKey))
	if roleHeader == "" {
		http.Error(w, errForbidden, http.StatusForbidden)
		return
	}
	roleNames := parseRoleHeader(roleHeader)
	if len(roleNames) == 0 {
		http.Error(w, errForbidden, http.StatusForbidden)
		return
	}

	if h.roleService == nil {
		http.Error(w, errRoleServiceUnavailable, http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	allowed, err := h.authorizeRolesManage(ctx, roleNames)
	if err != nil {
		http.Error(w, errQueryPermissions, http.StatusInternalServerError)
		return
	}
	if !allowed {
		http.Error(w, errForbidden, http.StatusForbidden)
		return
	}

	var req UpdateRolesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, errInvalidBody, http.StatusBadRequest)
		return
	}

	if req.UserID <= 0 {
		http.Error(w, errUserIDRequired, http.StatusBadRequest)
		return
	}

	roleIDsToAssign := []int{}
	if len(req.Roles) > 0 {
		roleIDsToAssign, err = h.roleService.GetRoleIDsByNames(ctx, req.Roles)
		if err != nil {
			if db.IsErrNotFound(err) {
				http.Error(w, errRoleNotFound, http.StatusNotFound)
				return
			}
			http.Error(w, errQueryRoles, http.StatusInternalServerError)
			return
		}
	}

	if err := h.roleService.UpdateUserRoles(ctx, req.UserID, roleIDsToAssign); err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, errUserNotFound, http.StatusNotFound)
			return
		}
		http.Error(w, errUpdateRoles, http.StatusInternalServerError)
		return
	}

	w.Header().Set(contentTypeHeader, contentTypeJSON)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Roles updated successfully"})
}

func parsePagination(r *http.Request) (int, int) {
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
	return limit, offset
}

func buildUserRoleItems(users []db.UsuarioModel) []userRoleItem {
	items := make([]userRoleItem, 0, len(users))
	for _, user := range users {
		rolesList := make([]string, 0, len(user.RelationsUsuario.UsuarioRoles))
		for _, userRole := range user.RelationsUsuario.UsuarioRoles {
			if userRole.RelationsUsuarioRoles.Rol != nil {
				rolesList = append(rolesList, userRole.RelationsUsuarioRoles.Rol.NombreRol)
			}
		}
		items = append(items, userRoleItem{
			ID:    user.IDUsuario,
			Name:  user.Nombre,
			Email: user.Email,
			Roles: rolesList,
		})
	}
	return items
}

func parseRoleHeader(roleHeader string) []string {
	roleNames := []string{}
	for _, name := range strings.Split(roleHeader, ",") {
		trimmed := strings.TrimSpace(name)
		if trimmed != "" {
			roleNames = append(roleNames, trimmed)
		}
	}
	return roleNames
}

func (h *Handler) authorizeRolesManage(ctx context.Context, roleNames []string) (bool, error) {
	for _, roleName := range roleNames {
		if isAdminRoleName(roleName) {
			return true, nil
		}
	}

	roleIDs := []int{}
	for _, roleName := range roleNames {
		id, err := h.roleService.GetRoleIDByName(ctx, roleName)
		if err != nil {
			if db.IsErrNotFound(err) {
				continue
			}
			return false, err
		}
		roleIDs = append(roleIDs, id)
	}
	if len(roleIDs) == 0 {
		return false, nil
	}

	for _, id := range roleIDs {
		hasPermission, err := h.roleService.HasRoleResourcePermission(ctx, id, "roles.manage")
		if err != nil {
			return false, err
		}
		if hasPermission {
			return true, nil
		}
	}
	return false, nil
}

func isAdminRoleName(name string) bool {
	return strings.EqualFold(strings.TrimSpace(name), "ADMIN")
}
