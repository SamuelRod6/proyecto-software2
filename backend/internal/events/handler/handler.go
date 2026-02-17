package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"project/backend/internal/events/dto"
	"project/backend/internal/events/repo"
	"project/backend/internal/events/service"
	"project/backend/internal/events/validation"
	"project/backend/internal/shared/httperror"
	"project/backend/prisma/db"
)

type Handler struct {
	svc EventService
}

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

func New(client *db.PrismaClient) http.Handler {
	repository := repo.New(client)
	return &Handler{svc: service.New(repository)}
}

func NewWithService(svc EventService) *Handler {
	return &Handler{svc: svc}
}

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
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	if err := h.svc.EnsureNoSolapamiento(ctx, startDate, endDate); err != nil {
		if errors.Is(err, service.ErrOverlap) {
			httperror.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	created, err := h.svc.CreateEvento(ctx, req, startDate, endDate, cierreDate)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     created.IDEvento,
		Nombre:                 created.Nombre,
		FechaInicio:            created.FechaInicio.Format("02/01/2006"),
		FechaFin:               created.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: created.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  isInscripcionesAbiertas(created, now),
		Ubicacion:              created.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) listEventos(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	eventos, err := h.svc.ListEventos(ctx)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	now := time.Now()
	res := make([]dto.EventoResponse, 0, len(eventos))
	for _, ev := range eventos {
		res = append(res, dto.EventoResponse{
			ID:                     ev.IDEvento,
			Nombre:                 ev.Nombre,
			FechaInicio:            ev.FechaInicio.Format("02/01/2006"),
			FechaFin:               ev.FechaFin.Format("02/01/2006"),
			FechaCierreInscripcion: ev.FechaCierreInscripcion.Format("02/01/2006"),
			InscripcionesAbiertas:  isInscripcionesAbiertas(&ev, now),
			Ubicacion:              ev.Ubicacion,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

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
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
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
	if err != nil {
		if errors.Is(err, service.ErrNameExists) || errors.Is(err, service.ErrOverlap) {
			httperror.WriteJSON(w, http.StatusConflict, err.Error())
			return
		}
		if errors.Is(err, service.ErrCloseDateLocked) {
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, service.ErrNotFound) {
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            updated.FechaInicio.Format("02/01/2006"),
		FechaFin:               updated.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: updated.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  isInscripcionesAbiertas(updated, now),
		Ubicacion:              updated.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

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
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

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
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            updated.FechaInicio.Format("02/01/2006"),
		FechaFin:               updated.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: updated.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  isInscripcionesAbiertas(updated, now),
		Ubicacion:              updated.Ubicacion,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

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
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	now := time.Now()
	res := dto.EventoResponse{
		ID:                     updated.IDEvento,
		Nombre:                 updated.Nombre,
		FechaInicio:            updated.FechaInicio.Format("02/01/2006"),
		FechaFin:               updated.FechaFin.Format("02/01/2006"),
		FechaCierreInscripcion: updated.FechaCierreInscripcion.Format("02/01/2006"),
		InscripcionesAbiertas:  isInscripcionesAbiertas(updated, now),
		Ubicacion:              updated.Ubicacion,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func isInscripcionesAbiertas(evento *db.EventoModel, now time.Time) bool {
	if !evento.InscripcionesAbiertasManual {
		return false
	}
	if !now.Before(evento.FechaInicio) {
		return false
	}
	return now.Before(evento.FechaCierreInscripcion)
}

func (h *Handler) Svc() EventService {
	return h.svc
}

func GetFechasOcupadasHandler(svc EventService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		fechas, err := svc.GetFechasOcupadas(ctx)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error obteniendo fechas ocupadas por los eventos existentes"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(fechas)
	}
}
