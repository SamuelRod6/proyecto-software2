package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

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
	eventoID, err := parseOptionalID(r.URL.Query().Get("evento_id"))
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "evento_id invalido")
		return
	}
	usuarioID, err := parseOptionalID(r.URL.Query().Get("usuario_id"))
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "usuario_id invalido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	inscripciones, err := h.svc.ListInscripciones(ctx, eventoID, usuarioID)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := make([]dto.InscripcionResponse, 0, len(inscripciones))
	for _, ins := range inscripciones {
		res = append(res, dto.InscripcionResponse{
			ID:          ins.IDInscripcion,
			EventoID:    ins.IDEvento,
			UsuarioID:   ins.IDUsuario,
			Fecha:       ins.Fecha.Format("02/01/2006 15:04"),
			EstadoPago:  ins.EstadoPago,
			Comprobante: ins.Comprobante,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
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
