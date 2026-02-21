package roles

import (
	"context"

	"project/backend/prisma/db"
)

type UserRoleService interface {
    GetRoleIDByName(ctx context.Context, name string) (int, error)
    GetRoleIDsByNames(ctx context.Context, names []string) ([]int, error)
    UpdateUserRole(ctx context.Context, userID int, roleID int) error
    UpdateUserRoles(ctx context.Context, userID int, roleIDs []int) error
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

func (s prismaUserRoleService) GetRoleIDsByNames(ctx context.Context, names []string) ([]int, error) {
    if len(names) == 0 {
        return []int{}, nil
    }

    roles, err := s.client.Roles.
        FindMany(db.Roles.NombreRol.In(names)).
        Exec(ctx)
    if err != nil {
        return nil, err
    }

    if len(roles) != len(names) {
        return nil, db.ErrNotFound
    }

    ids := make([]int, 0, len(roles))
    for _, role := range roles {
        ids = append(ids, role.IDRol)
    }

    return ids, nil
}

func (s prismaUserRoleService) UpdateUserRoles(ctx context.Context, userID int, roleIDs []int) error {
    _, err := s.client.UsuarioRoles.
        FindMany(db.UsuarioRoles.IDUsuario.Equals(userID)).
        Delete().
        Exec(ctx)
    if err != nil {
        return err
    }

    for _, roleID := range roleIDs {
        _, err = s.client.UsuarioRoles.CreateOne(
            db.UsuarioRoles.IDUsuario.Set(userID),
            db.UsuarioRoles.IDRol.Set(roleID),
        ).Exec(ctx)
        if err != nil {
            return err
        }
    }

    return nil
}
