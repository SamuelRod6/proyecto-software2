/*
File: repo.go

Contains:
Persistence repository implementation for the Pais module.
It provides data access operations for countries and cities.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package repo

import (
	"context"
	"project/backend/prisma/db"
)

// Repository encapsulates persistence operations for countries and cities.
type Repository struct {
	client *db.PrismaClient
}

// New creates a new Pais repository with the provided Prisma client.
func New(client *db.PrismaClient) *Repository {
	return &Repository{client: client}
}

// ListPaises returns all countries.
func (r *Repository) ListPaises(ctx context.Context) ([]db.PaisModel, error) {
	return r.client.Pais.FindMany().Exec(ctx)
}

// ListCiudadesByPais returns all cities for a given country ID.
func (r *Repository) ListCiudadesByPais(ctx context.Context, paisID int) ([]db.CiudadModel, error) {
	return r.client.Ciudad.FindMany(
		db.Ciudad.IDPais.Equals(paisID),
	).Exec(ctx)
}
