/*
File: handler.go

Contains:
HTTP endpoint layer for the Pais module.
It handles request routing, service calls, response shaping,
and error mapping for countries and cities endpoints.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

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

// Handler serves HTTP requests for the Pais module.
type Handler struct {
	svc *service.Service
}

// New creates a Pais handler with its repository and service dependencies.
func New(client *db.PrismaClient) http.Handler {
	repository := repo.New(client)
	return &Handler{svc: service.New(repository)}
}

// ServeHTTP routes incoming requests by HTTP method.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listPaises(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

/*
Endpoint: GET /api/paises
Returns the list of countries.

Usage:
  - GET /api/paises
*/
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

/*
Endpoint: GET /api/ciudades?pais_id=<id>
Returns the list of cities that belong to a country.

Usage:
  - GET /api/ciudades?pais_id=<id>
*/
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
