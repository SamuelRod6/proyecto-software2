// File: backend/handlers/events_handler.go
// Purpose: HTTP handler for event-related endpoints.

package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"project/backend/apierrors"
	"project/backend/models"
	"project/backend/prisma/db"
	"project/backend/services"
)

// EventsHandler implements http.Handler for event-related operations.
type EventsHandler struct {
	svc *services.EventService
}

// NewEventsHandler creates a new event handler with the given Prisma client.
func NewEventsHandler(client *db.PrismaClient) http.Handler {
	return &EventsHandler{svc: services.NewEventService(client)}
}

// ServeHTTP routes requests to the appropriate method based on HTTP verb.
func (h *EventsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.createEvento(w, r)
	case http.MethodGet:
		h.listEventos(w, r)
	case http.MethodPut:
		h.updateEvento(w, r)
	case http.MethodPatch:
		h.patchEvento(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// createEvento handles the creation of a new event.
func (h *EventsHandler) createEvento(w http.ResponseWriter, r *http.Request) {
	var req models.CreateEventoRequest

	// Decode the JSON request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	// Validate request fields
	if err := services.ValidateEventoNombre(req.Nombre); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate dates
	startDate, endDate, cierreDate, err := services.ValidateEventoFechas(req.FechaInicio, req.FechaFin, req.FechaCierreInscripcion, time.Now())
	if err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate location
	if err := services.ValidateEventoUbicacion(req.Ubicacion); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	// Ensure unique event name
	if err := h.svc.EnsureNombreUnico(ctx, req.Nombre); err != nil {
		if errors.Is(err, services.ErrEventNameExists) {
			apierrors.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Ensure no date overlap with existing events
	if err := h.svc.EnsureNoSolapamiento(ctx, startDate, endDate); err != nil {
		if errors.Is(err, services.ErrEventOverlap) {
			apierrors.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Create the event
	created, err := h.svc.CreateEvento(ctx, req, startDate, endDate, cierreDate)
	if err != nil {
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Prepare and send the response
	res := models.EventoResponse{
		ID:                     created.IDEvento,
		Nombre:                 created.Nombre,
		FechaInicio:            created.FechaInicio.Format("02/01/2006"),
		FechaFin:               created.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: created.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  created.InscripcionesAbiertasManual && time.Now().Before(created.FechaInicio),
		Ubicacion:              created.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

// listEventos handles listing all events.
func (h *EventsHandler) listEventos(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	// Retrieve events from the service
	eventos, err := h.svc.ListEventos(ctx)
	if err != nil {
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	// Prepare and send the response
	res := make([]models.EventoResponse, 0, len(eventos))
	for _, ev := range eventos {
		res = append(res, models.EventoResponse{
			ID:                     ev.IDEvento,
			Nombre:                 ev.Nombre,
			FechaInicio:            ev.FechaInicio.Format("02/01/2006"),
			FechaFin:               ev.FechaFin.Format("02/01/2006"),
			FechaCierreInscripcion: ev.FechaCierreInscripcion.Format("02/01/2006"),
			InscripcionesAbiertas:  ev.InscripcionesAbiertasManual && time.Now().Before(ev.FechaInicio),
			Ubicacion:              ev.Ubicacion,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

// updateEvento handles the update of an existing event.
func (h *EventsHandler) updateEvento(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateEventoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	if req.ID == 0 {
		apierrors.WriteJSON(w, http.StatusBadRequest, "id_evento es requerido para actualizar")
		return
	}

	if err := services.ValidateEventoNombre(req.Nombre); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	startDate, endDate, cierreDate, err := services.ValidateEventoFechas(req.FechaInicio, req.FechaFin, req.FechaCierreInscripcion, time.Now())
	if err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := services.ValidateEventoUbicacion(req.Ubicacion); err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.svc.UpdateEvento(ctx, req, startDate, endDate, cierreDate)
	if err != nil {
		if errors.Is(err, services.ErrEventNameExists) || errors.Is(err, services.ErrEventOverlap) {
			apierrors.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		if err.Error() == "Evento no encontrado" {
			apierrors.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := models.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            updated.FechaInicio.Format("02/01/2006"),
		FechaFin:               updated.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: updated.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  updated.InscripcionesAbiertasManual && time.Now().Before(updated.FechaInicio),
		Ubicacion:              updated.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

// patchEvento routes PATCH requests based on query parameters (para cerrar y reabrir
// inscripciones manualmente)
func (h *EventsHandler) patchEvento(w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	idStr := r.URL.Query().Get("id")

	if idStr == "" {
		apierrors.WriteJSON(w, http.StatusBadRequest, "id es requerido")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		apierrors.WriteJSON(w, http.StatusBadRequest, "id inválido")
		return
	}

	switch action {
	case "cerrar":
		h.cerrarInscripciones(w, r, id)
	case "abrir":
		h.abrirInscripciones(w, r, id)
	default:
		apierrors.WriteJSON(w, http.StatusBadRequest, "action debe ser 'cerrar' o 'abrir'")
	}
}

// cerrarInscripciones handles closing registrations for an event.
func (h *EventsHandler) cerrarInscripciones(w http.ResponseWriter, r *http.Request, eventoID int) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.svc.CerrarInscripciones(ctx, eventoID)
	if err != nil {
		if err.Error() == "Evento no encontrado" {
			apierrors.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		if err.Error() == "No se pueden cerrar inscripciones después de que el evento haya iniciado" {
			apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := models.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            updated.FechaInicio.Format("02/01/2006"),
		FechaFin:               updated.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: updated.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  updated.InscripcionesAbiertasManual && time.Now().Before(updated.FechaInicio),
		Ubicacion:              updated.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

// abrirInscripciones handles reopening registrations for an event.
func (h *EventsHandler) abrirInscripciones(w http.ResponseWriter, r *http.Request, eventoID int) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.svc.AbrirInscripciones(ctx, eventoID)
	if err != nil {
		if err.Error() == "Evento no encontrado" {
			apierrors.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		if err.Error() == "No se pueden reabrir inscripciones después de que el evento haya iniciado" {
			apierrors.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		apierrors.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := models.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            updated.FechaInicio.Format("02/01/2006"),
		FechaFin:               updated.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: updated.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  updated.InscripcionesAbiertasManual && time.Now().Before(updated.FechaInicio),
		Ubicacion:              updated.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}
