package repo

import (
	"context"

	"project/backend/prisma/db"
)

type Repository struct {
	client *db.PrismaClient
}

func New(client *db.PrismaClient) *Repository {
	return &Repository{client: client}
}

func (r *Repository) FindEventoByID(ctx context.Context, id int) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(
		db.Evento.IDEvento.Equals(id),
	).Exec(ctx)
}

func (r *Repository) FindUsuarioByID(ctx context.Context, id int) (*db.UsuarioModel, error) {
	return r.client.Usuario.FindUnique(
		db.Usuario.IDUsuario.Equals(id),
	).Exec(ctx)
}

func (r *Repository) FindByID(ctx context.Context, id int) (*db.InscripcionModel, error) {
	return r.client.Inscripcion.FindUnique(
		db.Inscripcion.IDInscripcion.Equals(id),
	).Exec(ctx)
}

func (r *Repository) FindByEventoAndUsuario(ctx context.Context, eventoID, usuarioID int) ([]db.InscripcionModel, error) {
	return r.client.Inscripcion.FindMany(
		db.Inscripcion.IDEvento.Equals(eventoID),
		db.Inscripcion.IDUsuario.Equals(usuarioID),
	).Exec(ctx)
}

func (r *Repository) FindByEventoID(ctx context.Context, eventoID int) ([]db.InscripcionModel, error) {
	return r.client.Inscripcion.FindMany(
		db.Inscripcion.IDEvento.Equals(eventoID),
	).Exec(ctx)
}

func (r *Repository) FindByUsuarioID(ctx context.Context, usuarioID int) ([]db.InscripcionModel, error) {
	return r.client.Inscripcion.FindMany(
		db.Inscripcion.IDUsuario.Equals(usuarioID),
	).Exec(ctx)
}

func (r *Repository) FindAll(ctx context.Context) ([]db.InscripcionModel, error) {
	return r.client.Inscripcion.FindMany().Exec(ctx)
}

func (r *Repository) Create(ctx context.Context, eventoID, usuarioID int, estadoPago bool, comprobante string) (*db.InscripcionModel, error) {
	return r.client.Inscripcion.CreateOne(
		db.Inscripcion.Evento.Link(
			db.Evento.IDEvento.Equals(eventoID),
		),
		db.Inscripcion.Usuario.Link(
			db.Usuario.IDUsuario.Equals(usuarioID),
		),
		db.Inscripcion.EstadoPago.Set(estadoPago),
		db.Inscripcion.Comprobante.Set(comprobante),
	).Exec(ctx)
}

func (r *Repository) UpdatePago(ctx context.Context, inscripcionID int, estadoPago bool, comprobante string) (*db.InscripcionModel, error) {
	return r.client.Inscripcion.FindUnique(
		db.Inscripcion.IDInscripcion.Equals(inscripcionID),
	).Update(
		db.Inscripcion.EstadoPago.Set(estadoPago),
		db.Inscripcion.Comprobante.Set(comprobante),
	).Exec(ctx)
}

func (r *Repository) GetAllEventos(ctx context.Context) ([]db.EventoModel, error) {
	return r.client.Evento.FindMany().Exec(ctx)
}
