package roles

import (
	"context"
	"strings"

	"project/backend/prisma/db"
)

type UserRoleService interface {
	GetRoleIDByName(ctx context.Context, name string) (int, error)
	GetRoleIDsByNames(ctx context.Context, names []string) ([]int, error)
	HasRoleResourcePermission(ctx context.Context, roleID int, resourceKey string) (bool, error)
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
		db.UsuarioRoles.Usuario.Link(
			db.Usuario.IDUsuario.Equals(userID),
		),
		db.UsuarioRoles.Rol.Link(
			db.Roles.IDRol.Equals(roleID),
		),
	).Exec(ctx)
	return err
}

func (s prismaUserRoleService) HasRoleResourcePermission(ctx context.Context, roleID int, resourceKey string) (bool, error) {
	if roleID <= 0 || strings.TrimSpace(resourceKey) == "" {
		return false, nil
	}

	role, err := s.client.Roles.FindUnique(
		db.Roles.IDRol.Equals(roleID),
	).Select(
		db.Roles.NombreRol.Field(),
	).Exec(ctx)
	if err != nil {
		if db.IsErrNotFound(err) {
			return false, nil
		}
		return false, err
	}
	if isAdminRoleName(role.NombreRol) {
		return true, nil
	}

	permissions, err := s.client.RolePermisos.
		FindMany(db.RolePermisos.IDRol.Equals(roleID)).
		With(db.RolePermisos.Permiso.Fetch()).
		Exec(ctx)
	if err != nil {
		return false, err
	}

	for _, item := range permissions {
		perm := item.RelationsRolePermisos.Permiso
		if perm == nil {
			continue
		}
		if permissionMatchesResource(perm.NombrePermiso, resourceKey) {
			return true, nil
		}
	}

	return false, nil
}

func isAdminRoleName(name string) bool {
	return strings.EqualFold(strings.TrimSpace(name), "ADMIN")
}

func permissionMatchesResource(permissionName, resourceKey string) bool {
	if permissionName == resourceKey {
		return true
	}
	parts := strings.SplitN(permissionName, "::", 2)
	if len(parts) != 2 {
		return false
	}
	return parts[1] == resourceKey
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
			db.UsuarioRoles.Usuario.Link(
				db.Usuario.IDUsuario.Equals(userID),
			),
			db.UsuarioRoles.Rol.Link(
				db.Roles.IDRol.Equals(roleID),
			),
		).Exec(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}
