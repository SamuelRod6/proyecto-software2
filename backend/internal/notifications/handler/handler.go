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

func New(client *db.PrismaClient) *Handler {
	repository := repo.NewNotificationRepository(client)
	svc := service.NewNotificationService(repository)
	return &Handler{svc: svc}
}

// ServeHTTP enruta según el método y la URL
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
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(notifications)
}

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
