package repo

import (
	"context"
	"strings"
	"time"

	"project/backend/prisma/db"
)

type Repository struct {
	client *db.PrismaClient
}

func New(client *db.PrismaClient) *Repository {
	return &Repository{client: client}
}

func (r *Repository) FindByName(ctx context.Context, nombre string) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.Nombre.Equals(strings.TrimSpace(nombre)),
	).Exec(ctx)
}

func (r *Repository) FindByID(ctx context.Context, id int) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Exec(ctx)
}

func (r *Repository) FindAll(ctx context.Context) ([]db.EventoModel, error) {
	return r.client.Evento.FindMany().Exec(ctx)
}

func (r *Repository) Create(ctx context.Context, reqNombre, reqUbicacion string, start, end, cierre time.Time) (*db.EventoModel, error) {
	return r.client.Evento.CreateOne(
		db.Evento.Nombre.Set(strings.TrimSpace(reqNombre)),
		db.Evento.FechaInicio.Set(start),
		db.Evento.FechaFin.Set(end),
		db.Evento.FechaCierreInscripcion.Set(cierre),
		db.Evento.Ubicacion.Set(strings.TrimSpace(reqUbicacion)),
	).Exec(ctx)
}

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

func (r *Repository) SetInscripciones(ctx context.Context, id int, abiertas bool) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Update(
		db.Evento.InscripcionesAbiertasManual.Set(abiertas),
	).Exec(ctx)
}
