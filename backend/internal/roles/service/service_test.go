package roles

import "testing"

func TestIsAdminRoleName(t *testing.T) {
	if !isAdminRoleName(" ADMIN ") {
		t.Fatal("expected admin role name to match")
	}
	if isAdminRoleName("REVISOR") {
		t.Fatal("expected non-admin role name to not match")
	}
}

func TestPermissionMatchesResource(t *testing.T) {
	if !permissionMatchesResource("scientific.works", "scientific.works") {
		t.Fatal("expected direct resource permission match")
	}
	if !permissionMatchesResource("read::scientific.works", "scientific.works") {
		t.Fatal("expected scoped resource permission match")
	}
	if permissionMatchesResource("read::events", "scientific.works") {
		t.Fatal("expected non matching resource")
	}
	if permissionMatchesResource("invalid-format", "scientific.works") {
		t.Fatal("expected invalid permission format to not match")
	}
}
