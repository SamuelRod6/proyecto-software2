/*
File: handler.go

Contains:
HTTP endpoint layer for the notifications module.
It handles notification creation, listing, and read-state updates.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"project/backend/internal/notifications/dto"
	"project/backend/internal/notifications/repo"
	"project/backend/internal/notifications/service"
	"project/backend/internal/shared/httperror"
	"project/backend/prisma/db"
)

type Handler struct {
	svc service.NotificationService
}

// New creates a notifications handler with repository and service dependencies.
func New(client *db.PrismaClient) *Handler {
	repository := repo.NewNotificationRepository(client)
	svc := service.NewNotificationService(repository)
	return &Handler{svc: svc}
}

// ServeHTTP routes requests by method and path.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodPost && r.URL.Path == "/api/notifications":
		h.createNotification(w, r)
	case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/api/notifications/user/"):
		h.listNotificationsByUser(w, r)
	case r.Method == http.MethodPatch && strings.HasPrefix(r.URL.Path, "/api/notifications/"):
		h.markNotificationAsRead(w, r)
	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

/*
Endpoint: POST /api/notifications
Creates a notification and returns the stored record.
*/
func (h *Handler) createNotification(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}
	notification, err := h.svc.CreateNotification(r.Context(), req)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(notification)
}

/*
Endpoint: GET /api/notifications/user/{idUsuario}
Lists notifications for one user.
*/
func (h *Handler) listNotificationsByUser(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		httperror.WriteJSON(w, http.StatusBadRequest, "idUsuario requerido")
		return
	}
	idUsuario, err := strconv.Atoi(parts[4])
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "idUsuario inválido")
		return
	}
	notifications, err := h.svc.ListNotificationsByUser(r.Context(), idUsuario)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	var responses []dto.NotificationResponse
	for _, n := range notifications {
		tipo := ""
		if val, ok := n.Tipo(); ok {
			tipo = val
		}
		responses = append(responses, dto.NotificationResponse{
			ID:     n.IDNotificacion,
			UserID: n.IDUsuario,
			EventID: func() *int {
				if val, ok := n.IDEvento(); ok {
					v := int(val)
					return &v
				}
				return nil
			}(),
			Type:      tipo,
			Title:     dto.GetNotificationTitle(tipo),
			Message:   n.Mensaje,
			Read:      n.Leida,
			CreatedAt: n.CreatedAt,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(responses)
}

/*
Endpoint: PATCH /api/notifications/{idNotificacion}
Marks one notification as read or unread.
*/
func (h *Handler) markNotificationAsRead(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		httperror.WriteJSON(w, http.StatusBadRequest, "idNotificacion requerido")
		return
	}
	idNotificacion, err := strconv.Atoi(parts[3])
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "idNotificacion inválido")
		return
	}
	var req struct {
		Leida bool `json:"leida"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}
	err = h.svc.MarkNotificationAsRead(r.Context(), idNotificacion, req.Leida)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
