package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	eventdto "project/backend/internal/events/dto"
	"project/backend/internal/registrations/dto"
	"project/backend/internal/registrations/repo"
	"project/backend/internal/registrations/service"
	"project/backend/internal/registrations/validation"
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
	case http.MethodPost:
		h.createInscripcion(w, r)
	case http.MethodGet:
		h.listInscripciones(w, r)
	case http.MethodPatch:
		h.updatePago(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) createInscripcion(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateInscripcionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json invalido")
		return
	}

	if err := validation.ValidateInscripcionIDs(req.EventoID, req.UsuarioID); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validation.ValidateComprobante(req.EstadoPago, req.Comprobante); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	created, err := h.svc.CreateInscripcion(ctx, req, time.Now())
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEventoNotFound), errors.Is(err, service.ErrUsuarioNotFound):
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
		case errors.Is(err, service.ErrInscripcionesCerradas):
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, service.ErrYaInscrito):
			httperror.WriteJSON(w, http.StatusConflict, err.Error())
		default:
			httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		}
		return
	}

	res := dto.InscripcionResponse{
		ID:          created.IDInscripcion,
		EventoID:    created.IDEvento,
		UsuarioID:   created.IDUsuario,
		Fecha:       created.Fecha.Format("02/01/2006 15:04"),
		EstadoPago:  created.EstadoPago,
		Comprobante: created.Comprobante,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) listInscripciones(w http.ResponseWriter, r *http.Request) {
	usuarioID, err := parseOptionalID(r.URL.Query().Get("usuario_id"))
	if err != nil || usuarioID == 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "usuario_id invalido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	inscripciones, err := h.svc.ListInscripciones(ctx, 0, usuarioID)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	eventos, err := h.svc.GetAllEventos(ctx)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error eventos")
		return
	}

	now := time.Now()
	inscritosMap := make(map[int]struct{})
	for _, ins := range inscripciones {
		inscritosMap[ins.IDEvento] = struct{}{}
	}

	eventosInscritos := make([]eventdto.EventoResponse, 0)
	eventosDisponibles := make([]eventdto.EventoResponse, 0)
	for _, ev := range eventos {
		_, inscrito := inscritosMap[ev.IDEvento]
		abierto := ev.InscripcionesAbiertasManual && now.Before(ev.FechaCierreInscripcion) && now.Before(ev.FechaInicio)
		er := eventdto.EventoResponse{
			ID:                     ev.IDEvento,
			Nombre:                 ev.Nombre,
			FechaInicio:            ev.FechaInicio.Format("02/01/2006"),
			FechaFin:               ev.FechaFin.Format("02/01/2006"),
			FechaCierreInscripcion: ev.FechaCierreInscripcion.Format("02/01/2006"),
			InscripcionesAbiertas:  abierto,
			Ubicacion:              ev.Ubicacion,
		}
		if inscrito {
			eventosInscritos = append(eventosInscritos, er)
		} else if abierto {
			eventosDisponibles = append(eventosDisponibles, er)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"eventos_inscritos":   eventosInscritos,
		"eventos_disponibles": eventosDisponibles,
	})
}

func (h *Handler) updatePago(w http.ResponseWriter, r *http.Request) {
	var req dto.UpdatePagoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json invalido")
		return
	}

	if err := validation.ValidateInscripcionID(req.InscripcionID); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validation.ValidateComprobante(req.EstadoPago, req.Comprobante); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	updated, err := h.svc.UpdatePago(ctx, req.InscripcionID, req.EstadoPago, req.Comprobante)
	if err != nil {
		if errors.Is(err, service.ErrInscripcionNotFound) {
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := dto.InscripcionResponse{
		ID:          updated.IDInscripcion,
		EventoID:    updated.IDEvento,
		UsuarioID:   updated.IDUsuario,
		Fecha:       updated.Fecha.Format("02/01/2006 15:04"),
		EstadoPago:  updated.EstadoPago,
		Comprobante: updated.Comprobante,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func parseOptionalID(raw string) (int, error) {
	if raw == "" {
		return 0, nil
	}
	id, err := strconv.Atoi(raw)
	if err != nil {
		return 0, err
	}
	if id <= 0 {
		return 0, errors.New("id invalido")
	}
	return id, nil
}
