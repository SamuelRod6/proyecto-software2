package handler

import "testing"

func TestParseID(t *testing.T) {
	cases := []struct {
		name   string
		input  string
		ok     bool
		output int
	}{
		{"valid", "7", true, 7},
		{"zero", "0", false, 0},
		{"negative", "-1", false, 0},
		{"invalid", "nope", false, 0},
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

func TestSplitPermissionName(t *testing.T) {
	cases := []struct {
		name     string
		input    string
		expected string
		resource string
	}{
		{"no resource", "permiso", "permiso", ""},
		{"with resource", "permiso::events.create", "permiso", "events.create"},
		{"extra delimiter", "perm::res::x", "perm", "res::x"},
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

func TestUniqueInts(t *testing.T) {
	input := []int{1, 2, 2, 0, -3, 4, 4, 5}
	got := uniqueInts(input)
	if len(got) != 4 {
		t.Fatalf("expected 4 values, got %d", len(got))
	}

	want := map[int]struct{}{1: {}, 2: {}, 4: {}, 5: {}}
	for _, value := range got {
		if _, ok := want[value]; !ok {
			t.Fatalf("unexpected value %d", value)
		}
	}
}
