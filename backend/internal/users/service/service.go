package service

import (
	"context"

	"project/backend/internal/users/repo"
	"project/backend/prisma/db"
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

func (s *Service) ListUsersWithRoles(ctx context.Context, limit, offset int) ([]db.UsuarioModel, error) {
	return s.repo.ListUsersWithRoles(ctx, limit, offset)
}

func (s *Service) ListRoles(ctx context.Context) ([]db.RolesModel, error) {
	return s.repo.ListRoles(ctx)
}
