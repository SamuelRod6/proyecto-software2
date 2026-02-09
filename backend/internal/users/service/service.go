package service

import (
	"context"

	"project/backend/internal/users/repo"
)

type Service struct {
	repo *repo.UserRepository
}

func New(repository *repo.UserRepository) *Service {
	return &Service{repo: repository}
}

func (s *Service) CountUsers(ctx context.Context) (int, error) {
	return s.repo.CountUsers(ctx)
}
