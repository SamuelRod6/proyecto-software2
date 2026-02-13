package repo

import (
	"context"

	"project/backend/prisma/db"
)

type UserRepository struct {
	Client *db.PrismaClient
}

func NewUserRepository(client *db.PrismaClient) *UserRepository {
	return &UserRepository{Client: client}
}

func (r *UserRepository) CreateUser(ctx context.Context, name, email, passwordHash string, roleID int) (*db.UsuarioModel, error) {
	return r.Client.Usuario.CreateOne(
		db.Usuario.Nombre.Set(name),
		db.Usuario.Email.Set(email),
		db.Usuario.PasswordHash.Set(passwordHash),
		db.Usuario.Rol.Link(db.Roles.IDRol.Equals(roleID)),
	).Exec(ctx)
}

func (r *UserRepository) FindUserByEmail(ctx context.Context, email string) (*db.UsuarioModel, error) {
	return r.Client.Usuario.FindUnique(
		db.Usuario.Email.Equals(email),
	).Exec(ctx)
}

func (r *UserRepository) FindRoleByID(ctx context.Context, roleID int) (*db.RolesModel, error) {
	return r.Client.Roles.FindUnique(
		db.Roles.IDRol.Equals(roleID),
	).Exec(ctx)
}

func (r *UserRepository) UpdatePassword(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error) {
	return r.Client.Usuario.FindUnique(
		db.Usuario.Email.Equals(email),
	).Update(
		db.Usuario.PasswordHash.Set(passwordHash),
	).Exec(ctx)
}

func (r *UserRepository) CountUsers(ctx context.Context) (int, error) {
	users, err := r.Client.Usuario.FindMany().Exec(ctx)
	if err != nil {
		return 0, err
	}
	return len(users), nil
}

func (r *UserRepository) ListUsersWithRoles(ctx context.Context, limit, offset int) ([]db.UsuarioModel, error) {
	return r.Client.Usuario.
		FindMany().
		Skip(offset).
		Take(limit).
		Select(
			db.Usuario.IDUsuario.Field(),
			db.Usuario.Nombre.Field(),
		).
		With(db.Usuario.Rol.Fetch()).
		Exec(ctx)
}

func (r *UserRepository) ListRoles(ctx context.Context) ([]db.RolesModel, error) {
	return r.Client.Roles.
		FindMany().
		Select(
			db.Roles.IDRol.Field(),
			db.Roles.NombreRol.Field(),
		).
		Exec(ctx)
}
