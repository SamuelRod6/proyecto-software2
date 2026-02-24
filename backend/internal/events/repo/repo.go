package repo

import (
	"context"
	"project/backend/internal/events/dto"
	"project/backend/prisma/db"
	"strings"
	"time"
)

type Repository struct {
	client *db.PrismaClient
}

func New(client *db.PrismaClient) *Repository {
	return &Repository{client: client}
}

func (r *Repository) FindByName(ctx context.Context, nombre string) (*db.EventoModel, error) {
	return r.client.Evento.FindFirst(
		db.Evento.Nombre.Equals(strings.TrimSpace(nombre)),
		db.Evento.Cancelado.Equals(false),
	).Exec(ctx)
}

func (r *Repository) FindByID(ctx context.Context, id int) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Exec(ctx)
}

func (r *Repository) FindAll(ctx context.Context) ([]db.EventoModel, error) {
	return r.client.Evento.FindMany(
		db.Evento.Cancelado.Equals(false),
	).Exec(ctx)
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

func (r *Repository) DeleteByID(ctx context.Context, id int) error {
	_, err := r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Update(
		db.Evento.Cancelado.Set(true),
	).Exec(ctx)
	return err
}

func (r *Repository) SetInscripciones(ctx context.Context, id int, abiertas bool) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Update(
		db.Evento.InscripcionesAbiertasManual.Set(abiertas),
	).Exec(ctx)
}

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

func (r *Repository) FindEventosCierreManana(ctx context.Context) ([]db.EventoModel, error) {
	manana := time.Now().AddDate(0, 0, 1)
	inicio := time.Date(manana.Year(), manana.Month(), manana.Day(), 0, 0, 0, 0, manana.Location())
	fin := inicio.Add(24 * time.Hour)

	return r.client.Evento.FindMany(
		db.Evento.FechaCierreInscripcion.Gte(inicio),
		db.Evento.FechaCierreInscripcion.Lt(fin),
	).Exec(ctx)
}

func (r *Repository) FindEventosInicioManana(ctx context.Context) ([]db.EventoModel, error) {
	manana := time.Now().UTC().AddDate(0, 0, 1)
	inicio := time.Date(manana.Year(), manana.Month(), manana.Day(), 0, 0, 0, 0, time.UTC)
	fin := inicio.Add(24 * time.Hour)

	return r.client.Evento.FindMany(
		db.Evento.FechaInicio.Gte(inicio),
		db.Evento.FechaInicio.Lt(fin),
	).Exec(ctx)
}
