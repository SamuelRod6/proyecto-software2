package mocks

import "context"

type MockUserRoleService struct {
	RoleID     int
	GetRoleErr error
	UpdateErr  error
}

func (m MockUserRoleService) GetRoleIDByName(_ context.Context, _ string) (int, error) {
	return m.RoleID, m.GetRoleErr
}

func (m MockUserRoleService) UpdateUserRole(_ context.Context, _ int, _ int) error {
	return m.UpdateErr
}
