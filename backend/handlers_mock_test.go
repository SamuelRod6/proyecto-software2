package main

import "context"

type mockUserRoleService struct {
	roleID     int
	getRoleErr error
	updateErr  error
}

func (m mockUserRoleService) GetRoleIDByName(_ context.Context, _ string) (int, error) {
	return m.roleID, m.getRoleErr
}

func (m mockUserRoleService) UpdateUserRole(_ context.Context, _ int, _ int) error {
	return m.updateErr
}
