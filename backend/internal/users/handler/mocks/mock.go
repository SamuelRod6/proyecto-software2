package mocks

import "context"

type MockUserRoleService struct {
	RoleID     int
	GetRoleErr error
	UpdateErr  error
}

// GetRoleIDsByNames implements [roles.UserRoleService].
func (m MockUserRoleService) GetRoleIDsByNames(ctx context.Context, names []string) ([]int, error) {
	panic("unimplemented")
}

// UpdateUserRoles implements [roles.UserRoleService].
func (m MockUserRoleService) UpdateUserRoles(ctx context.Context, userID int, roleIDs []int) error {
	panic("unimplemented")
}

func (m MockUserRoleService) GetRoleIDByName(_ context.Context, _ string) (int, error) {
	return m.RoleID, m.GetRoleErr
}

func (m MockUserRoleService) UpdateUserRole(_ context.Context, _ int, _ int) error {
	return m.UpdateErr
}
