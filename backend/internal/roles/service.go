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
    return prismaUserRoleService{client: client}
}

func (s prismaUserRoleService) GetRoleIDByName(ctx context.Context, name string) (int, error) {
    role, err := s.client.Roles.FindUnique(db.Roles.NombreRol.Equals(name)).Exec(ctx)
    if err != nil {
        return 0, err
    }
    return role.IDRol, nil
}

func (s prismaUserRoleService) UpdateUserRole(ctx context.Context, userID int, roleID int) error {
    _, err := s.client.Usuario.
        FindUnique(db.Usuario.IDUsuario.Equals(userID)).
        Update(db.Usuario.Rol.Link(db.Roles.IDRol.Equals(roleID))).
        Exec(ctx)
    return err
}
