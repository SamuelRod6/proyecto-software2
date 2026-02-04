// File: backend/events/handler.go
// Purpose: HTTP handler for event-related endpoints.
// Usage: Import and use in main.go to handle /api/eventos routes.

package events

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"project/backend/apierrors"
	"project/backend/events/dto"
	"project/backend/prisma/db"
)

// handler implements http.Handler for event-related operations.
type handler struct {
	svc *service
}

// NewHandler creates a new event handler with the given Prisma client.
func NewHandler(client *db.PrismaClient) http.Handler {
	return &handler{svc: newService(client)}
}

// ServeHTTP routes requests to the appropriate method based on HTTP verb.
func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.createEvento(w, r)
	case http.MethodGet:
		h.listEventos(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// createEvento handles the creation of a new event.
func (h *handler) createEvento(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateEventoRequest

	// Decode the JSON request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	// Validate request fields
	if err := validateEventoNombre(req.Nombre); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate dates
	startDate, endDate, err := validateEventoFechas(req.FechaInicio, req.FechaFin, time.Now())
	if err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate location
	if err := validateEventoUbicacion(req.Ubicacion); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	// Ensure unique event name
	if err := h.svc.EnsureNombreUnico(ctx, req.Nombre); err != nil {
		if errors.Is(err, errNameExists) {
			apierrors.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Ensure no date overlap with existing events
	if err := h.svc.EnsureNoSolapamiento(ctx, startDate, endDate); err != nil {
		if errors.Is(err, errOverlap) {
			apierrors.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Create the event
	created, err := h.svc.CreateEvento(ctx, req, startDate, endDate)
	if err != nil {
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Prepare and send the response
	res := dto.EventoResponse{
		ID:          created.IDEvento,
		Nombre:      created.Nombre,
		FechaInicio: created.FechaInicio.Format("02/01/2006"),
		FechaFin:    created.FechaFin.Format("02/01/2006"),
		Ubicacion:   created.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

// listEventos handles listing all events.
func (h *handler) listEventos(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	// Retrieve events from the service
	eventos, err := h.svc.ListEventos(ctx)
	if err != nil {
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Prepare and send the response
	res := make([]dto.EventoResponse, 0, len(eventos))
	for _, ev := range eventos {
		res = append(res, dto.EventoResponse{
			ID:          ev.IDEvento,
			Nombre:      ev.Nombre,
			FechaInicio: ev.FechaInicio.Format("02/01/2006"),
			FechaFin:    ev.FechaFin.Format("02/01/2006"),
			Ubicacion:   ev.Ubicacion,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}
