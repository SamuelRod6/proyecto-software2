package handler

import "testing"

func TestParseID(t *testing.T) {
	cases := []struct {
		name   string
		input  string
		ok     bool
		output int
	}{
		{"valid", "12", true, 12},
		{"zero", "0", false, 0},
		{"negative", "-3", false, 0},
		{"invalid", "abc", false, 0},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := parseID(tc.input)
			if ok != tc.ok {
				t.Fatalf("expected ok %v, got %v", tc.ok, ok)
			}
			if got != tc.output {
				t.Fatalf("expected %d, got %d", tc.output, got)
			}
		})
	}
}

func TestBuildPermissionName(t *testing.T) {
	cases := []struct {
		name     string
		permName string
		resource string
		expected string
	}{
		{"no resource", "crear_evento", "", "crear_evento"},
		{"with resource", "crear_evento", "events.create", "crear_evento::events.create"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := buildPermissionName(tc.permName, tc.resource)
			if got != tc.expected {
				t.Fatalf("expected %q, got %q", tc.expected, got)
			}
		})
	}
}

func TestSplitPermissionName(t *testing.T) {
	cases := []struct {
		name     string
		input    string
		expected string
		resource string
	}{
		{"no resource", "crear_evento", "crear_evento", ""},
		{"with resource", "crear_evento::events.create", "crear_evento", "events.create"},
		{"extra delimiter", "perm::res::extra", "perm", "res::extra"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			name, resource := splitPermissionName(tc.input)
			if name != tc.expected {
				t.Fatalf("expected name %q, got %q", tc.expected, name)
			}
			if resource != tc.resource {
				t.Fatalf("expected resource %q, got %q", tc.resource, resource)
			}
		})
	}
}
