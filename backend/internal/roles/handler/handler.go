package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project/backend/internal/shared/response"
	"project/backend/prisma/db"
)

type Handler struct {
	client *db.PrismaClient
}

type rolePayload struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type rolePermissionsPayload struct {
	PermissionIDs []int `json:"permission_ids"`
}

func New(client *db.PrismaClient) http.Handler {
	return &Handler{client: client}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	segments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(segments) < 2 || segments[0] != "api" || segments[1] != "roles" {
		http.NotFound(w, r)
		return
	}

	if len(segments) == 2 {
		switch r.Method {
		case http.MethodGet:
			h.listRoles(w, r)
		case http.MethodPost:
			h.createRole(w, r)
		default:
			response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		}
		return
	}

	if len(segments) == 3 {
		roleID, ok := parseID(segments[2])
		if !ok {
			response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
			return
		}

		switch r.Method {
		case http.MethodPut:
			h.updateRole(w, r, roleID)
		case http.MethodDelete:
			h.deleteRole(w, r, roleID)
		default:
			response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		}
		return
	}

	if len(segments) == 4 && segments[3] == "permissions" {
		roleID, ok := parseID(segments[2])
		if !ok {
			response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
			return
		}

		switch r.Method {
		case http.MethodGet:
			h.getRolePermissions(w, r, roleID)
		case http.MethodPut:
			h.updateRolePermissions(w, r, roleID)
		default:
			response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		}
		return
	}

	http.NotFound(w, r)
}

func (h *Handler) listRoles(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	roles, err := h.client.Roles.FindMany().Select(
		db.Roles.IDRol.Field(),
		db.Roles.NombreRol.Field(),
		db.Roles.Descripcion.Field(),
	).Exec(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	type roleItem struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	items := make([]roleItem, 0, len(roles))
	for _, role := range roles {
		items = append(items, roleItem{
			ID:          role.IDRol,
			Name:        role.NombreRol,
			Description: role.Descripcion,
		})
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"roles": items,
	})
}

func (h *Handler) createRole(w http.ResponseWriter, r *http.Request) {
	var payload rolePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	description := strings.TrimSpace(payload.Description)

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	created, err := h.client.Roles.CreateOne(
		db.Roles.NombreRol.Set(name),
		db.Roles.Descripcion.Set(description),
	).Exec(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	response.WriteSuccess(w, http.StatusCreated, response.SuccessGeneral, map[string]any{
		"role": map[string]any{
			"id":          created.IDRol,
			"name":        created.NombreRol,
			"description": created.Descripcion,
		},
	})
}

func (h *Handler) updateRole(w http.ResponseWriter, r *http.Request, roleID int) {
	var payload rolePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	description := strings.TrimSpace(payload.Description)

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.client.Roles.FindUnique(
		db.Roles.IDRol.Equals(roleID),
	).Update(
		db.Roles.NombreRol.Set(name),
		db.Roles.Descripcion.Set(description),
	).Exec(ctx)
	if err != nil {
		if db.IsErrNotFound(err) {
			response.WriteError(w, http.StatusNotFound, response.ErrRoleInvalid)
			return
		}
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"role": map[string]any{
			"id":          updated.IDRol,
			"name":        updated.NombreRol,
			"description": updated.Descripcion,
		},
	})
}

func (h *Handler) deleteRole(w http.ResponseWriter, r *http.Request, roleID int) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	_, err := h.client.Roles.FindUnique(
		db.Roles.IDRol.Equals(roleID),
	).Delete().Exec(ctx)
	if err != nil {
		if db.IsErrNotFound(err) {
			response.WriteError(w, http.StatusNotFound, response.ErrRoleInvalid)
			return
		}
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"deleted": roleID,
	})
}

func (h *Handler) getRolePermissions(w http.ResponseWriter, r *http.Request, roleID int) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	permissions, err := h.client.RolePermisos.
		FindMany(db.RolePermisos.IDRol.Equals(roleID)).
		With(db.RolePermisos.Permiso.Fetch()).
		Exec(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	type permissionItem struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		Resource string `json:"resource,omitempty"`
	}

	items := make([]permissionItem, 0, len(permissions))
	for _, item := range permissions {
		perm := item.RelationsRolePermisos.Permiso
		if perm == nil {
			continue
		}
		name, resource := splitPermissionName(perm.NombrePermiso)
		items = append(items, permissionItem{
			ID:       perm.IDPermiso,
			Name:     name,
			Resource: resource,
		})
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"permissions": items,
	})
}

func (h *Handler) updateRolePermissions(w http.ResponseWriter, r *http.Request, roleID int) {
	var payload rolePermissionsPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	_, err := h.client.Roles.FindUnique(db.Roles.IDRol.Equals(roleID)).Exec(ctx)
	if err != nil {
		if db.IsErrNotFound(err) {
			response.WriteError(w, http.StatusNotFound, response.ErrRoleInvalid)
			return
		}
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	uniqueIDs := uniqueInts(payload.PermissionIDs)
	if len(uniqueIDs) > 0 {
		permissions, err := h.client.Permisos.FindMany(
			db.Permisos.IDPermiso.In(uniqueIDs),
		).Exec(ctx)
		if err != nil {
			response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
			return
		}
		if len(permissions) != len(uniqueIDs) {
			response.WriteError(w, http.StatusNotFound, response.ErrRoleInvalid)
			return
		}
	}

	_, err = h.client.RolePermisos.FindMany(
		db.RolePermisos.IDRol.Equals(roleID),
	).Delete().Exec(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	for _, permissionID := range uniqueIDs {
		_, err = h.client.RolePermisos.CreateOne(
			db.RolePermisos.IDRol.Set(roleID),
			db.RolePermisos.IDPermiso.Set(permissionID),
		).Exec(ctx)
		if err != nil {
			response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
			return
		}
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"role_id":         roleID,
		"permission_ids": uniqueIDs,
	})
}

func parseID(raw string) (int, bool) {
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}

func splitPermissionName(value string) (string, string) {
	parts := strings.SplitN(value, "::", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return value, ""
}

func uniqueInts(values []int) []int {
	seen := make(map[int]struct{})
	result := make([]int, 0, len(values))
	for _, value := range values {
		if value <= 0 {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
