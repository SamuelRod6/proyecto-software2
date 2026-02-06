// File: backend/events/service.go
// Purpose: Business logic and persistence operations for events.
// Notes: Isolates DB access from HTTP handlers.

package events

import (
	"context"
	"errors"
	"strings"
	"time"

	"project/backend/events/dto"
	"project/backend/prisma/db"
)

// Define custom errors for service operations.
var (
	errNameExists = errors.New("el nombre del evento ya existe")
	errOverlap    = errors.New("las fechas se superponen con otro evento")
	errDB         = errors.New("db error")
)

// service encapsulates business logic for event management.
type service struct {
	client *db.PrismaClient
}

// newService creates a new service instance with the given Prisma client.
func newService(client *db.PrismaClient) *service {
	return &service{client: client}
}

// EnsureNombreUnico checks if an event name is unique.
func (s *service) EnsureNombreUnico(ctx context.Context, nombre string) error {
	existing, err := s.client.Evento.FindUnique(
		db.Evento.Nombre.Equals(strings.TrimSpace(nombre)),
	).Exec(ctx)
	if err == nil && existing != nil {
		return errNameExists
	}
	if err != nil && !errors.Is(err, db.ErrNotFound) {
		return errDB
	}
	return nil
}

// EnsureNoSolapamiento checks for date overlaps with existing events.
func (s *service) EnsureNoSolapamiento(ctx context.Context, start, end time.Time) error {
	eventos, err := s.client.Evento.FindMany().Exec(ctx)
	if err != nil {
		return errDB
	}
	for _, ev := range eventos {
		if !start.After(ev.FechaFin) && !end.Before(ev.FechaInicio) {
			return errOverlap
		}
	}
	return nil
}

// CreateEvento creates a new event in the database.
func (s *service) CreateEvento(ctx context.Context, req dto.CreateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error) {
	created, err := s.client.Evento.CreateOne(
		db.Evento.Nombre.Set(strings.TrimSpace(req.Nombre)),
		db.Evento.FechaInicio.Set(start),
		db.Evento.FechaFin.Set(end),
		db.Evento.FechaCierreInscripcion.Set(cierre),
		db.Evento.Ubicacion.Set(strings.TrimSpace(req.Ubicacion)),
	).Exec(ctx)
	if err != nil {
		return nil, errDB
	}
	return created, nil
}

// ListEventos retrieves all events from the database.
func (s *service) ListEventos(ctx context.Context) ([]db.EventoModel, error) {
	eventos, err := s.client.Evento.FindMany().Exec(ctx)
	if err != nil {
		return nil, errDB
	}
	return eventos, nil
}

// UpdateEvento updates an existing event in the database.
func (s *service) UpdateEvento(ctx context.Context, req dto.UpdateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error) {

	// Check if event exists
	_, err := s.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(req.ID),
	).Exec(ctx)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, errors.New("Evento no encontrado")
		}
		return nil, errDB
	}

	// Ensure Name Unique (Exclude self)
	existingName, err := s.client.Evento.FindUnique(
		db.Evento.Nombre.Equals(strings.TrimSpace(req.Nombre)),
	).Exec(ctx)
	if err == nil && existingName != nil && existingName.IDEvento != req.ID {
		return nil, errNameExists
	}

	// Ensure No Overlap (Exclude self)
	eventos, err := s.client.Evento.FindMany().Exec(ctx)
	if err != nil {
		return nil, errDB
	}
	for _, ev := range eventos {
		if ev.IDEvento == req.ID {
			continue // Skip self
		}
		if !start.After(ev.FechaFin) && !end.Before(ev.FechaInicio) {
			return nil, errOverlap
		}
	}

	// Update
	updated, err := s.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(req.ID),
	).Update(
		db.Evento.Nombre.Set(strings.TrimSpace(req.Nombre)),
		db.Evento.FechaInicio.Set(start),
		db.Evento.FechaFin.Set(end),
		db.Evento.FechaCierreInscripcion.Set(cierre),
		db.Evento.Ubicacion.Set(strings.TrimSpace(req.Ubicacion)),
	).Exec(ctx)

	if err != nil {
		return nil, errDB
	}
	return updated, nil
}

// CerrarInscripciones closes registrations manually for an event.
func (s *service) CerrarInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error) {
	// Verify event exists and hasn't started
	evento, err := s.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(eventoID),
	).Exec(ctx)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, errors.New("Evento no encontrado")
		}
		return nil, errDB
	}

	if time.Now().After(evento.FechaInicio) {
		return nil, errors.New("No se pueden cerrar inscripciones después de que el evento haya iniciado")
	}

	// Close registrations
	updated, err := s.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(eventoID),
	).Update(
		db.Evento.InscripcionesAbiertasManual.Set(false),
	).Exec(ctx)

	if err != nil {
		return nil, errDB
	}
	return updated, nil
}

// AbrirInscripciones reopens registrations manually for an event.
func (s *service) AbrirInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error) {
	// Verify event exists and hasn't started
	evento, err := s.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(eventoID),
	).Exec(ctx)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, errors.New("Evento no encontrado")
		}
		return nil, errDB
	}

	if time.Now().After(evento.FechaInicio) {
		return nil, errors.New("No se pueden reabrir inscripciones después de que el evento haya iniciado")
	}

	// Reopen registrations
	updated, err := s.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(eventoID),
	).Update(
		db.Evento.InscripcionesAbiertasManual.Set(true),
	).Exec(ctx)

	if err != nil {
		return nil, errDB
	}
	return updated, nil
}
