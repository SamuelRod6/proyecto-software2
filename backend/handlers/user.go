package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"project/backend/repository"
	"project/backend/utils"
)

type UserHandler struct {
	Repo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{Repo: repo}
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
