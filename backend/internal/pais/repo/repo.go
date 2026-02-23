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

func (r *Repository) ListPaises(ctx context.Context) ([]db.PaisModel, error) {
	return r.client.Pais.FindMany().Exec(ctx)
}

func (r *Repository) ListCiudadesByPais(ctx context.Context, paisID int) ([]db.CiudadModel, error) {
	return r.client.Ciudad.FindMany(
		db.Ciudad.IDPais.Equals(paisID),
	).Exec(ctx)
}
