/*
File: service.go

Contains:
Business service implementation for the Pais module.
It orchestrates repository calls and maps persistence failures to
service-level errors.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package service

import (
	"context"
	"errors"

	"project/backend/internal/pais/repo"
	"project/backend/prisma/db"
)

// ErrDB represents a generic persistence failure in this service.
var ErrDB = errors.New("db error")

// Service implements business operations for countries and cities.
type Service struct {
	repo *repo.Repository
}

// New creates a new Pais service with the provided repository.
func New(r *repo.Repository) *Service {
	return &Service{repo: r}
}

// ListPaises retrieves all countries.
func (s *Service) ListPaises(ctx context.Context) ([]db.PaisModel, error) {
	items, err := s.repo.ListPaises(ctx)
	if err != nil {
		return nil, ErrDB
	}
	return items, nil
}

// ListCiudadesByPais retrieves all cities belonging to a country.
func (s *Service) ListCiudadesByPais(ctx context.Context, paisID int) ([]db.CiudadModel, error) {
	items, err := s.repo.ListCiudadesByPais(ctx, paisID)
	if err != nil {
		return nil, ErrDB
	}
	return items, nil
}
