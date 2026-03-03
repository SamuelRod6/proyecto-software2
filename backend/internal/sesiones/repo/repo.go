package repo

import (
	"context"
	"project/backend/prisma/db"
	"time"
)

type Repository struct {
	prisma *db.PrismaClient
}

func NewRepository(prismaClient *db.PrismaClient) *Repository {
	return &Repository{prisma: prismaClient}
}

func (r *Repository) CreateSesion(ctx context.Context, eventoID int, titulo, descripcion, fechaInicio, fechaFin, ubicacion string) (int, error) {
	fechaInicioTime, err := time.Parse(time.RFC3339, fechaInicio)
	if err != nil {
		return 0, err
	}
	fechaFinTime, err := time.Parse(time.RFC3339, fechaFin)
	if err != nil {
		return 0, err
	}
	s, err := r.prisma.Sesion.CreateOne(
		db.Sesion.Titulo.Set(titulo),
		db.Sesion.Descripcion.Set(descripcion),
		db.Sesion.FechaInicio.Set(fechaInicioTime),
		db.Sesion.FechaFin.Set(fechaFinTime),
		db.Sesion.Ubicacion.Set(ubicacion),
		db.Sesion.Evento.Link(db.Evento.IDEvento.Equals(eventoID)),
	).Exec(ctx)
	if err != nil {
		return 0, err
	}
	return s.IDSesion, nil
}

func (r *Repository) ListSesiones(ctx context.Context, eventoID int) ([]db.SesionModel, error) {
	return r.prisma.Sesion.FindMany(
		db.Sesion.IDEvento.Equals(eventoID),
		db.Sesion.Cancelado.Equals(false),
	).Exec(ctx)
}

func (r *Repository) GetSesionByID(ctx context.Context, sesionID int) (*db.SesionModel, error) {
	return r.prisma.Sesion.FindFirst(
		db.Sesion.IDSesion.Equals(sesionID),
		db.Sesion.Cancelado.Equals(false),
	).Exec(ctx)
}

func (r *Repository) UpdateSesion(ctx context.Context, sesionID int, titulo, descripcion, fechaInicio, fechaFin, ubicacion string) error {
	fechaInicioTime, err := time.Parse(time.RFC3339, fechaInicio)
	if err != nil {
		return err
	}
	fechaFinTime, err := time.Parse(time.RFC3339, fechaFin)
	if err != nil {
		return err
	}
	_, err = r.prisma.Sesion.FindUnique(
		db.Sesion.IDSesion.Equals(sesionID),
	).Update(
		db.Sesion.Titulo.Set(titulo),
		db.Sesion.Descripcion.Set(descripcion),
		db.Sesion.FechaInicio.Set(fechaInicioTime),
		db.Sesion.FechaFin.Set(fechaFinTime),
		db.Sesion.Ubicacion.Set(ubicacion),
	).Exec(ctx)
	return err
}

func (r *Repository) DeleteSesion(ctx context.Context, sesionID int) error {
	_, err := r.prisma.Sesion.FindUnique(
		db.Sesion.IDSesion.Equals(sesionID),
	).Update(
		db.Sesion.Cancelado.Set(true),
	).Exec(ctx)
	return err
}

func (r *Repository) AsignarPonentes(ctx context.Context, sesionID int, usuarios []int) error {
	for _, userID := range usuarios {
		_, err := r.prisma.SesionPonente.CreateOne(
			db.SesionPonente.Sesion.Link(db.Sesion.IDSesion.Equals(sesionID)),
			db.SesionPonente.Usuario.Link(db.Usuario.IDUsuario.Equals(userID)),
		).Exec(ctx)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) QuitarPonente(ctx context.Context, sesionID int, usuarioID int) error {
	sp, err := r.prisma.SesionPonente.FindFirst(
		db.SesionPonente.IDSesion.Equals(sesionID),
		db.SesionPonente.IDUsuario.Equals(usuarioID),
	).Exec(ctx)
	if err != nil {
		return err
	}
	if sp == nil {
		return nil
	}
	_, err = r.prisma.SesionPonente.FindUnique(
		db.SesionPonente.IDSesionPonente.Equals(sp.IDSesionPonente),
	).Delete().Exec(ctx)
	return err
}

func (r *Repository) ListPonentes(ctx context.Context, sesionID int) ([]db.UsuarioModel, error) {
	ponentes, err := r.prisma.SesionPonente.FindMany(
		db.SesionPonente.IDSesion.Equals(sesionID),
	).With(
		db.SesionPonente.Usuario.Fetch(),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}
	var usuarios []db.UsuarioModel
	for _, p := range ponentes {
		usuario := p.Usuario()
		if usuario != nil {
			usuarios = append(usuarios, *usuario)
		}
	}
	return usuarios, nil
}

func (r *Repository) ListPonentesAsignables(ctx context.Context, sesionID int) ([]db.UsuarioModel, error) {
	asignados, err := r.prisma.SesionPonente.FindMany(
		db.SesionPonente.IDSesion.Equals(sesionID),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}
	var ids []int
	for _, p := range asignados {
		ids = append(ids, p.IDUsuario)
	}
	var usuarios []db.UsuarioModel
	if len(ids) > 0 {
		usuarios, err = r.prisma.Usuario.FindMany(
			db.Usuario.IDUsuario.NotIn(ids),
		).Exec(ctx)
	} else {
		usuarios, err = r.prisma.Usuario.FindMany().Exec(ctx)
	}
	if err != nil {
		return nil, err
	}
	return usuarios, nil
}

func (r *Repository) Prisma() *db.PrismaClient {
	return r.prisma
}
