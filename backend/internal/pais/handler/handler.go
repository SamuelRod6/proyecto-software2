package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"project/backend/internal/pais/dto"
	"project/backend/internal/pais/repo"
	"project/backend/internal/pais/service"
	"project/backend/internal/shared/httperror"
	"project/backend/prisma/db"
)

type Handler struct {
	svc *service.Service
}

func New(client *db.PrismaClient) http.Handler {
	repository := repo.New(client)
	return &Handler{svc: service.New(repository)}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listPaises(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) listPaises(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	items, err := h.svc.ListPaises(ctx)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := make([]dto.PaisResponse, 0, len(items))
	for _, it := range items {
		res = append(res, dto.PaisResponse{
			ID:     it.IDPais,
			Nombre: it.Nombre,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) ListCiudadesByPaisHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("pais_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "pais_id invalido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	items, err := h.svc.ListCiudadesByPais(ctx, id)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := make([]dto.CiudadResponse, 0, len(items))
	for _, it := range items {
		res = append(res, dto.CiudadResponse{
			ID:     it.IDCiudad,
			Nombre: it.Nombre,
			PaisID: it.IDPais,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}
