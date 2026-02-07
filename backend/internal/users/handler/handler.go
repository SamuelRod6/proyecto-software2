package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"project/backend/internal/shared/response"
	"project/backend/internal/users/repo"
	"project/backend/internal/users/service"
)

type Handler struct {
	svc *service.Service
}

func New(repository *repo.UserRepository) *Handler {
	return &Handler{svc: service.New(repository)}
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
