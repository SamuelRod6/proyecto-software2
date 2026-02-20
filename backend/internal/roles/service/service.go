package roles

import (
	"context"

	"project/backend/prisma/db"
)

type UserRoleService interface {
    GetRoleIDByName(ctx context.Context, name string) (int, error)
    UpdateUserRole(ctx context.Context, userID int, roleID int) error
}

type prismaUserRoleService struct {
    client *db.PrismaClient
}

func NewUserRoleService(client *db.PrismaClient) UserRoleService {
    return &prismaUserRoleService{client: client}
}

func (s prismaUserRoleService) GetRoleIDByName(ctx context.Context, name string) (int, error) {
    role, err := s.client.Roles.FindUnique(db.Roles.NombreRol.Equals(name)).Exec(ctx)
    if err != nil {
        return 0, err
    }
    return role.IDRol, nil
}

func (s prismaUserRoleService) UpdateUserRole(ctx context.Context, userID int, roleID int) error {
    _, err := s.client.UsuarioRoles.
        FindMany(db.UsuarioRoles.IDUsuario.Equals(userID)).
        Delete().
        Exec(ctx)
    if err != nil {
        return err
    }

    _, err = s.client.UsuarioRoles.CreateOne(
        db.UsuarioRoles.IDUsuario.Set(userID),
        db.UsuarioRoles.IDRol.Set(roleID),
    ).Exec(ctx)
    return err
}
