/*
File: handler.go

Contains:
HTTP handler implementation for the Evento module.
It centralizes request routing, input validation, service calls,
response shaping, and error mapping for event endpoints.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"project/backend/internal/events/dto"
	"project/backend/internal/events/service"
	"project/backend/internal/events/validation"
	"project/backend/internal/shared/httperror"
	"project/backend/prisma/db"
)

// Internal constants used by this HTTP handler.
const (
	dateLayout      = "02/01/2006"
	contentTypeKey  = "Content-Type"
	contentTypeJSON = "application/json"
	dbErrorMessage  = "db error"
)

// venezuelaLocation defines the fixed UTC-4 timezone used for event date display.
var venezuelaLocation = time.FixedZone("VET", -4*60*60)

// formatDateVE formats a time value as dd/mm/yyyy in Venezuela local time.
func formatDateVE(t time.Time) string {
	return t.In(venezuelaLocation).Format(dateLayout)
}

// formatDateTimeVE formats a time value as dd/mm/yyyy HH:MM in Venezuela local time.
func formatDateTimeVE(t time.Time) string {
	return t.In(venezuelaLocation).Format("02/01/2006 15:04")
}

// Handler serves HTTP requests for the Evento module.
type Handler struct {
	svc EventService
}

// EventService defines the business operations required by the HTTP handler.
type EventService interface {
	EnsureNombreUnico(ctx context.Context, nombre string) error
	EnsureNoSolapamiento(ctx context.Context, start, end time.Time) error
	CreateEvento(ctx context.Context, req dto.CreateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error)
	ListEventos(ctx context.Context) ([]db.EventoModel, error)
	GetEventoByID(ctx context.Context, id int) (*db.EventoModel, error)
	UpdateEvento(ctx context.Context, req dto.UpdateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error)
	DeleteEvento(ctx context.Context, id int) error
	CerrarInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error)
	AbrirInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error)
	GetFechasOcupadas(ctx context.Context) ([]dto.RangoFechas, error)
}

// New creates an HTTP handler wired with the concrete events service.
func New(client *db.PrismaClient) http.Handler {
	return &Handler{svc: service.New(client)}
}

// NewWithService creates a handler with a custom service implementation.
// This constructor is mainly useful for tests and dependency injection.
func NewWithService(svc EventService) *Handler {
	return &Handler{svc: svc}
}

// ServeHTTP routes incoming requests by HTTP method.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.createEvento(w, r)
	case http.MethodGet:
		h.listEventos(w, r)
	case http.MethodPut:
		h.updateEvento(w, r)
	case http.MethodPatch:
		h.patchEvento(w, r)
	case http.MethodDelete:
		h.deleteEvento(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

/*
Endpoint: POST /api/eventos
Creates a new event using the request JSON payload.

Usage:
	- Body: CreateEventoRequest
	- Response: EventoResponse
*/
func (h *Handler) createEvento(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateEventoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	if err := validation.ValidateEventoNombre(req.Nombre); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	startDate, endDate, cierreDate, err := validation.ValidateEventoFechas(req.FechaInicio, req.FechaFin, req.FechaCierreInscripcion, time.Now())
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := validation.ValidateEventoUbicacion(req.Ubicacion); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	if err := h.svc.EnsureNombreUnico(ctx, req.Nombre); err != nil {
		if errors.Is(err, service.ErrNameExists) {
			httperror.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}

	if err := h.svc.EnsureNoSolapamiento(ctx, startDate, endDate); err != nil {
		if errors.Is(err, service.ErrOverlap) {
			httperror.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}

	created, err := h.svc.CreateEvento(ctx, req, startDate, endDate, cierreDate)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     created.IDEvento,
		Nombre:                 created.Nombre,
		FechaInicio:            created.FechaInicio.Format(dateLayout),
		FechaFin:               created.FechaFin.Format(dateLayout),
		FechaCierreInscripcion: created.FechaCierreInscripcion.Format(dateLayout),
		InscripcionesAbiertas:  isInscripcionesAbiertas(created, now),
		Ubicacion:              created.Ubicacion,
	}

	w.Header().Set(contentTypeKey, contentTypeJSON)
	_ = json.NewEncoder(w).Encode(res)
}

/*
Endpoint: GET /api/eventos
Returns either the event list or one detailed event.

Usage:
  - GET /api/eventos
	  Returns a list of events.
  - GET /api/eventos?evento_id=<id>
	  Returns one event with sessions and speakers.
*/
func (h *Handler) listEventos(w http.ResponseWriter, r *http.Request) {
	// If evento_id is present, return detailed event data with sessions and speakers.
	eventoIDStr := r.URL.Query().Get("evento_id")
	if eventoIDStr != "" {
		eventoID, err := strconv.Atoi(eventoIDStr)
		if err != nil {
			httperror.WriteJSON(w, http.StatusBadRequest, "evento_id inválido")
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		evento, err := h.svc.GetEventoByID(ctx, eventoID)
		if err != nil {
			httperror.WriteJSON(w, http.StatusNotFound, "Evento no encontrado")
			return
		}
		// Retrieve sessions through the concrete service type.
		svc, ok := h.svc.(*service.Service)
		if !ok {
			httperror.WriteJSON(w, http.StatusInternalServerError, "Error interno de servicio")
			return
		}
		sesiones, _ := svc.GetSesionesRepo().ListSesiones(ctx, eventoID)
		var sesionesResp []dto.SesionResponse
		for _, s := range sesiones {
			ponentes, _ := svc.GetSesionesRepo().ListPonentes(ctx, s.IDSesion)
			var ponentesResp []dto.PonenteResponse
			for _, p := range ponentes {
				ponentesResp = append(ponentesResp, dto.PonenteResponse{
					IDUsuario: p.IDUsuario,
					Nombre:    p.Nombre,
					Email:     p.Email,
				})
			}
			sesionesResp = append(sesionesResp, dto.SesionResponse{
				IDSesion:    s.IDSesion,
				Titulo:      s.Titulo,
				Descripcion: s.Descripcion,
				FechaInicio: formatDateTimeVE(s.FechaInicio),
				FechaFin:    formatDateTimeVE(s.FechaFin),
				Ubicacion:   s.Ubicacion,
				Ponentes:    ponentesResp,
			})
		}
		now := time.Now()
		res := dto.EventoResponse{
			ID:                     evento.IDEvento,
			Nombre:                 evento.Nombre,
			FechaInicio:            formatDateVE(evento.FechaInicio),
			FechaFin:               formatDateVE(evento.FechaFin),
			FechaCierreInscripcion: formatDateVE(evento.FechaCierreInscripcion),
			InscripcionesAbiertas:  isInscripcionesAbiertas(evento, now),
			Ubicacion:              evento.Ubicacion,
			Sesiones:               sesionesResp,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(res)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	eventos, err := h.svc.ListEventos(ctx)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}

	now := time.Now()
	res := make([]dto.EventoResponse, 0, len(eventos))
	for _, ev := range eventos {
		res = append(res, dto.EventoResponse{
			ID:                     ev.IDEvento,
			Nombre:                 ev.Nombre,
			FechaInicio:            formatDateVE(ev.FechaInicio),
			FechaFin:               formatDateVE(ev.FechaFin),
			FechaCierreInscripcion: formatDateVE(ev.FechaCierreInscripcion),
			InscripcionesAbiertas:  isInscripcionesAbiertas(&ev, now),
			Ubicacion:              ev.Ubicacion,
		})
	}

	w.Header().Set(contentTypeKey, contentTypeJSON)
	_ = json.NewEncoder(w).Encode(res)
}

/*
Endpoint: PUT /api/eventos
Updates an existing event using request JSON.

Usage:
	- Body: UpdateEventoRequest (id_evento is required)
	- Response: EventoResponse
*/
func (h *Handler) updateEvento(w http.ResponseWriter, r *http.Request) {
	var req dto.UpdateEventoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	if req.ID == 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id_evento es requerido para actualizar")
		return
	}

	if err := validation.ValidateEventoNombre(req.Nombre); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := validation.ValidateEventoUbicacion(req.Ubicacion); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	existing, err := h.svc.GetEventoByID(ctx, req.ID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}

	startDate, endDate, cierreDate, err := validation.ValidateEventoFechasUpdate(
		req.FechaInicio,
		req.FechaFin,
		req.FechaCierreInscripcion,
		time.Now(),
		existing.FechaCierreInscripcion,
	)
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, err := h.svc.UpdateEvento(ctx, req, startDate, endDate, cierreDate)
	if handleUpdateEventoError(w, err) {
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            formatDateVE(updated.FechaInicio),
		FechaFin:               formatDateVE(updated.FechaFin),
		FechaCierreInscripcion: formatDateVE(updated.FechaCierreInscripcion),
		InscripcionesAbiertas:  isInscripcionesAbiertas(updated, now),
		Ubicacion:              updated.Ubicacion,
	}

	w.Header().Set(contentTypeKey, contentTypeJSON)
	_ = json.NewEncoder(w).Encode(res)
}

/*
Endpoint: PATCH /api/eventos
Dispatches registration state changes for an event.

Usage:
  - PATCH /api/eventos?action=cerrar&id=<id>
	  Closes registrations for the event.
  - PATCH /api/eventos?action=abrir&id=<id>
	  Opens registrations for the event.
*/
func (h *Handler) patchEvento(w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	idStr := r.URL.Query().Get("id")

	if idStr == "" {
		httperror.WriteJSON(w, http.StatusBadRequest, "id es requerido")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "id inválido")
		return
	}

	switch action {
	case "cerrar":
		h.cerrarInscripciones(w, r, id)
	case "abrir":
		h.abrirInscripciones(w, r, id)
	default:
		httperror.WriteJSON(w, http.StatusBadRequest, "action debe ser 'cerrar' o 'abrir'")
	}
}

/*
Endpoint: DELETE /api/eventos
Performs logical deletion (cancellation) for an event.

Usage:
	- DELETE /api/eventos?id=<id>
*/
func (h *Handler) deleteEvento(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		httperror.WriteJSON(w, http.StatusBadRequest, "id es requerido")
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "id inválido")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	err = h.svc.DeleteEvento(ctx, id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// cerrarInscripciones closes event registrations and returns the updated event.
func (h *Handler) cerrarInscripciones(w http.ResponseWriter, r *http.Request, eventoID int) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.svc.CerrarInscripciones(ctx, eventoID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, service.ErrCannotCloseAfterStart) {
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            formatDateVE(updated.FechaInicio),
		FechaFin:               formatDateVE(updated.FechaFin),
		FechaCierreInscripcion: formatDateVE(updated.FechaCierreInscripcion),
		InscripcionesAbiertas:  isInscripcionesAbiertas(updated, now),
		Ubicacion:              updated.Ubicacion,
	}
	w.Header().Set(contentTypeKey, contentTypeJSON)
	_ = json.NewEncoder(w).Encode(res)
}

// abrirInscripciones opens event registrations and returns the updated event.
func (h *Handler) abrirInscripciones(w http.ResponseWriter, r *http.Request, eventoID int) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.svc.AbrirInscripciones(ctx, eventoID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, service.ErrCannotOpenAfterStart) {
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrCannotOpenAfterClose) {
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            formatDateVE(updated.FechaInicio),
		FechaFin:               formatDateVE(updated.FechaFin),
		FechaCierreInscripcion: formatDateVE(updated.FechaCierreInscripcion),
		InscripcionesAbiertas:  isInscripcionesAbiertas(updated, now),
		Ubicacion:              updated.Ubicacion,
	}

	w.Header().Set(contentTypeKey, contentTypeJSON)
	_ = json.NewEncoder(w).Encode(res)
}

// isInscripcionesAbiertas computes whether registrations are open at the
// current time based on the manual flag and event date constraints.
func isInscripcionesAbiertas(evento *db.EventoModel, now time.Time) bool {
	if !evento.InscripcionesAbiertasManual {
		return false
	}
	if !now.Before(evento.FechaInicio) {
		return false
	}
	return now.Before(evento.FechaCierreInscripcion)
}

// Svc exposes the underlying service used by the handler.
func (h *Handler) Svc() EventService {
	return h.svc
}

/*
Endpoint: GET <configured-route-for-fechas-ocupadas>
Returns occupied date ranges for existing events.

Usage:
	- Route is configured by the application router using
		GetFechasOcupadasHandler(svc).
	- Response: []RangoFechas
*/
func GetFechasOcupadasHandler(svc EventService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		fechas, err := svc.GetFechasOcupadas(ctx)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error obteniendo fechas ocupadas por los eventos existentes"})
			return
		}
		w.Header().Set(contentTypeKey, contentTypeJSON)
		json.NewEncoder(w).Encode(fechas)
	}
}

// handleUpdateEventoError maps update errors to HTTP responses.
// It returns true when an error was handled and a response was written.
func handleUpdateEventoError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, service.ErrNameExists), errors.Is(err, service.ErrOverlap):
		httperror.WriteJSON(w, http.StatusConflict, err.Error())
	case errors.Is(err, service.ErrCloseDateLocked):
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, service.ErrNotFound):
		httperror.WriteJSON(w, http.StatusNotFound, err.Error())
	default:
		httperror.WriteJSON(w, http.StatusInternalServerError, dbErrorMessage)
	}
	return true
}
