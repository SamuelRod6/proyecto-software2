// File: backend/events/validation_test.go
// Purpose: Unit tests for event-related validation functions.
// Usage: Run `go test` in the backend/events directory.

package events

import (
	"testing"
	"time"
)

// Test functions for event validation
func TestValidateEventoNombre(t *testing.T) {
	cases := []struct {
		name    string
		wantErr bool
	}{
		{"Congreso Nacional", false},
		{"AB", true},
		{"Evento 2024", true},
		{"Evento@", true},
	}

	for _, c := range cases {
		err := validateEventoNombre(c.name)
		if c.wantErr && err == nil {
			t.Fatalf("expected error for %q", c.name)
		}
		if !c.wantErr && err != nil {
			t.Fatalf("unexpected error for %q: %v", c.name, err)
		}
	}
}

// TestValidateEventoFechas tests the date validation function.
func TestValidateEventoFechas(t *testing.T) {
	now := time.Date(2026, 2, 4, 10, 0, 0, 0, time.Local)

	_, _, err := validateEventoFechas("05/02/2026", "06/02/2026", now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, _, err = validateEventoFechas("04/02/2026", "05/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for start not after today")
	}

	_, _, err = validateEventoFechas("05/02/2026", "05/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for end not after start")
	}

	_, _, err = validateEventoFechas("2026-02-05", "06/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for invalid format")
	}
}

// TestValidateEventoUbicacion tests the location validation function.
func TestValidateEventoUbicacion(t *testing.T) {
	cases := []struct {
		loc     string
		wantErr bool
	}{
		{"Quito, Ecuador", false},
		{"Caracas. Venezuela", false},
		{"Quito Ecuador", true},
		{"@@@", true},
		{"A, B", true},
	}

	for _, c := range cases {
		err := validateEventoUbicacion(c.loc)
		if c.wantErr && err == nil {
			t.Fatalf("expected error for %q", c.loc)
		}
		if !c.wantErr && err != nil {
			t.Fatalf("unexpected error for %q: %v", c.loc, err)
		}
	}
}
