/*
File: repo.go

Contains:
Persistence repository implementation for the Evento entity.
It centralizes query, create, update, logical cancellation,
and time-window based search operations.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package repo

import (
	"context"
	"project/backend/internal/events/dto"
	"project/backend/prisma/db"
	"strings"
	"time"
)

// Repository encapsulates persistence operations for events.
type Repository struct {
	client *db.PrismaClient
}

// New creates a new events repository instance using the provided Prisma
// client.
func New(client *db.PrismaClient) *Repository {
	return &Repository{client: client}
}

// FindByName searches for an active event by exact name.
//
// The input name is normalized with TrimSpace before querying.
func (r *Repository) FindByName(ctx context.Context, nombre string) (*db.EventoModel, error) {
	return r.client.Evento.FindFirst(
		db.Evento.Nombre.Equals(strings.TrimSpace(nombre)),
		db.Evento.Cancelado.Equals(false),
	).Exec(ctx)
}

// FindByID retrieves an event by its unique identifier.
func (r *Repository) FindByID(ctx context.Context, id int) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Exec(ctx)
}

// FindAll lists all non-cancelled events.
func (r *Repository) FindAll(ctx context.Context) ([]db.EventoModel, error) {
	return r.client.Evento.FindMany(
		db.Evento.Cancelado.Equals(false),
	).Exec(ctx)
}

// Create registers a new event with name, location, and main dates.
//
// Text fields are normalized with TrimSpace before persistence.
func (r *Repository) Create(ctx context.Context, reqNombre, reqUbicacion string, start, end, cierre time.Time) (*db.EventoModel, error) {
	return r.client.Evento.CreateOne(
		db.Evento.Nombre.Set(strings.TrimSpace(reqNombre)),
		db.Evento.FechaInicio.Set(start),
		db.Evento.FechaFin.Set(end),
		db.Evento.FechaCierreInscripcion.Set(cierre),
		db.Evento.Ubicacion.Set(strings.TrimSpace(reqUbicacion)),
	).Exec(ctx)
}

// Update modifies name, location, and dates of an existing event.
func (r *Repository) Update(ctx context.Context, id int, reqNombre, reqUbicacion string, start, end, cierre time.Time) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Update(
		db.Evento.Nombre.Set(strings.TrimSpace(reqNombre)),
		db.Evento.FechaInicio.Set(start),
		db.Evento.FechaFin.Set(end),
		db.Evento.FechaCierreInscripcion.Set(cierre),
		db.Evento.Ubicacion.Set(strings.TrimSpace(reqUbicacion)),
	).Exec(ctx)
}

// DeleteByID performs a logical delete by marking the event as cancelled.
//
// This method does not physically remove the database record.
func (r *Repository) DeleteByID(ctx context.Context, id int) error {
	_, err := r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Update(
		db.Evento.Cancelado.Set(true),
	).Exec(ctx)
	return err
}

// SetInscripciones manually enables or disables event registrations through
// the InscripcionesAbiertasManual field.
func (r *Repository) SetInscripciones(ctx context.Context, id int, abiertas bool) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Update(
		db.Evento.InscripcionesAbiertasManual.Set(abiertas),
	).Exec(ctx)
}

// GetFechasOcupadas returns occupied date ranges for non-cancelled events.
//
// Output dates are formatted as dd/mm/yyyy.
func (r *Repository) GetFechasOcupadas(ctx context.Context) ([]dto.RangoFechas, error) {
	eventos, err := r.client.Evento.FindMany(
		db.Evento.Cancelado.Equals(false),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}

	rangos := make([]dto.RangoFechas, 0, len(eventos))
	for _, ev := range eventos {
		rangos = append(rangos, dto.RangoFechas{
			FechaInicio: ev.FechaInicio.Format("02/01/2006"),
			FechaFin:    ev.FechaFin.Format("02/01/2006"),
		})
	}
	return rangos, nil
}

// FindEventosCierreManana lists events whose registration closing date occurs
// tomorrow, using the server local time zone.
//
// Applied time window is [start, end):
// start = tomorrow at 00:00:00 local time
// end = start + 24 hours
func (r *Repository) FindEventosCierreManana(ctx context.Context) ([]db.EventoModel, error) {
	manana := time.Now().AddDate(0, 0, 1)
	inicio := time.Date(manana.Year(), manana.Month(), manana.Day(), 0, 0, 0, 0, manana.Location())
	fin := inicio.Add(24 * time.Hour)

	return r.client.Evento.FindMany(
		db.Evento.FechaCierreInscripcion.Gte(inicio),
		db.Evento.FechaCierreInscripcion.Lt(fin),
	).Exec(ctx)
}

// FindEventosInicioManana lists events whose start date occurs tomorrow in UTC.
//
// Applied time window is [start, end):
// start = tomorrow at 00:00:00 UTC
// end = start + 24 hours
func (r *Repository) FindEventosInicioManana(ctx context.Context) ([]db.EventoModel, error) {
	manana := time.Now().UTC().AddDate(0, 0, 1)
	inicio := time.Date(manana.Year(), manana.Month(), manana.Day(), 0, 0, 0, 0, time.UTC)
	fin := inicio.Add(24 * time.Hour)

	return r.client.Evento.FindMany(
		db.Evento.FechaInicio.Gte(inicio),
		db.Evento.FechaInicio.Lt(fin),
	).Exec(ctx)
}
