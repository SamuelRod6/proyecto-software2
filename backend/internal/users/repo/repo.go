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
	user, err := r.Client.Usuario.CreateOne(
		db.Usuario.Nombre.Set(name),
		db.Usuario.Email.Set(email),
		db.Usuario.PasswordHash.Set(passwordHash),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}

	if roleID > 0 {
		_, err = r.Client.UsuarioRoles.CreateOne(
			db.UsuarioRoles.IDUsuario.Set(user.IDUsuario),
			db.UsuarioRoles.IDRol.Set(roleID),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}
	}

	return user, nil
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

func (r *UserRepository) FindPrimaryRoleByUserID(ctx context.Context, userID int) (*db.RolesModel, error) {
	roles, err := r.Client.UsuarioRoles.
		FindMany(db.UsuarioRoles.IDUsuario.Equals(userID)).
		With(db.UsuarioRoles.Rol.Fetch()).
		Exec(ctx)
	if err != nil {
		return nil, err
	}
	if len(roles) == 0 || roles[0].RelationsUsuarioRoles.Rol == nil {
		return nil, db.ErrNotFound
	}
	return roles[0].RelationsUsuarioRoles.Rol, nil
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
			db.Usuario.Email.Field(),
		).
		With(db.Usuario.UsuarioRoles.Fetch().With(db.UsuarioRoles.Rol.Fetch())).
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
