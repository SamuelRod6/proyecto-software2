package service

import (
	"context"
	"errors"

	"project/backend/internal/pais/repo"
	"project/backend/prisma/db"
)

var ErrDB = errors.New("db error")

type Service struct {
	repo *repo.Repository
}

func New(r *repo.Repository) *Service {
	return &Service{repo: r}
}

func (s *Service) ListPaises(ctx context.Context) ([]db.PaisModel, error) {
	items, err := s.repo.ListPaises(ctx)
	if err != nil {
		return nil, ErrDB
	}
	return items, nil
}

func (s *Service) ListCiudadesByPais(ctx context.Context, paisID int) ([]db.CiudadModel, error) {
	items, err := s.repo.ListCiudadesByPais(ctx, paisID)
	if err != nil {
		return nil, ErrDB
	}
	return items, nil
}
