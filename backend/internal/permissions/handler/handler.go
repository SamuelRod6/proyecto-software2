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

type permissionPayload struct {
	Name     string `json:"name"`
	Resource string `json:"resource"`
}

func New(client *db.PrismaClient) http.Handler {
	return &Handler{client: client}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	segments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(segments) < 2 || segments[0] != "api" {
		http.NotFound(w, r)
		return
	}

	if len(segments) == 2 && segments[1] == "resources" {
		if r.Method != http.MethodGet {
			response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
			return
		}
		h.listResources(w, r)
		return
	}

	if segments[1] != "permissions" {
		http.NotFound(w, r)
		return
	}

	if len(segments) == 2 {
		switch r.Method {
		case http.MethodGet:
			h.listPermissions(w, r)
		case http.MethodPost:
			h.createPermission(w, r)
		default:
			response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		}
		return
	}

	if len(segments) == 3 {
		permissionID, ok := parseID(segments[2])
		if !ok {
			response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
			return
		}

		switch r.Method {
		case http.MethodPut:
			h.updatePermission(w, r, permissionID)
		case http.MethodDelete:
			h.deletePermission(w, r, permissionID)
		default:
			response.WriteError(w, http.StatusMethodNotAllowed, response.ErrMethodNotAllowed)
		}
		return
	}

	http.NotFound(w, r)
}

func (h *Handler) listPermissions(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	permissions, err := h.client.Permisos.FindMany().Select(
		db.Permisos.IDPermiso.Field(),
		db.Permisos.NombrePermiso.Field(),
	).Exec(ctx)
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
	for _, permission := range permissions {
		name, resource := splitPermissionName(permission.NombrePermiso)
		items = append(items, permissionItem{
			ID:       permission.IDPermiso,
			Name:     name,
			Resource: resource,
		})
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"permissions": items,
	})
}

func (h *Handler) createPermission(w http.ResponseWriter, r *http.Request) {
	var payload permissionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	resource := strings.TrimSpace(payload.Resource)
	storedName := buildPermissionName(name, resource)

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	created, err := h.client.Permisos.CreateOne(
		db.Permisos.NombrePermiso.Set(storedName),
	).Exec(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	response.WriteSuccess(w, http.StatusCreated, response.SuccessGeneral, map[string]any{
		"permission": map[string]any{
			"id":       created.IDPermiso,
			"name":     name,
			"resource": resource,
		},
	})
}

func (h *Handler) updatePermission(w http.ResponseWriter, r *http.Request, permissionID int) {
	var payload permissionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.WriteError(w, http.StatusBadRequest, response.ErrInvalidJSON)
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		response.WriteError(w, http.StatusBadRequest, response.ErrMissingFields)
		return
	}

	resource := strings.TrimSpace(payload.Resource)
	storedName := buildPermissionName(name, resource)

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.client.Permisos.FindUnique(
		db.Permisos.IDPermiso.Equals(permissionID),
	).Update(
		db.Permisos.NombrePermiso.Set(storedName),
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
		"permission": map[string]any{
			"id":       updated.IDPermiso,
			"name":     name,
			"resource": resource,
		},
	})
}

func (h *Handler) deletePermission(w http.ResponseWriter, r *http.Request, permissionID int) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	_, err := h.client.Permisos.FindUnique(
		db.Permisos.IDPermiso.Equals(permissionID),
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
		"deleted": permissionID,
	})
}

func (h *Handler) listResources(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	permissions, err := h.client.Permisos.FindMany().Select(
		db.Permisos.NombrePermiso.Field(),
	).Exec(ctx)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, response.ErrDatabase)
		return
	}

	resourceSet := make(map[string]struct{})
	resources := make([]map[string]string, 0)
	for _, permission := range permissions {
		_, resource := splitPermissionName(permission.NombrePermiso)
		if resource == "" {
			continue
		}
		if _, ok := resourceSet[resource]; ok {
			continue
		}
		resourceSet[resource] = struct{}{}
		resources = append(resources, map[string]string{"name": resource})
	}

	response.WriteSuccess(w, http.StatusOK, response.SuccessGeneral, map[string]any{
		"resources": resources,
	})
}

func parseID(raw string) (int, bool) {
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}

func buildPermissionName(name, resource string) string {
	if resource == "" {
		return name
	}
	return name + "::" + resource
}

func splitPermissionName(value string) (string, string) {
	parts := strings.SplitN(value, "::", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return value, ""
}
