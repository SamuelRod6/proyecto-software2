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
// Agregados casos de prueba para fecha de cierre de inscripcion
// Se debe cambiar las fechas dependiendo de cuando se ejecute el test
func TestValidateEventoFechas(t *testing.T) {
	now := time.Date(2026, 2, 4, 10, 0, 0, 0, time.Local)

	// Caso valido: el evento es del 7 al 10, y el cierre de inscripcion es despues de hoy
	_, _, _, err := validateEventoFechas("07/02/2026", "10/02/2026", "06/02/2026", now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Caso invalido: fecha de inicio antes de hoy
	_, _, _, err = validateEventoFechas("04/01/2026", "25/02/2026", "9/02/2020", now)
	if err == nil {
		t.Fatalf("expected error for start not after today")
	}

	// Caso invalido: fecha de cierre de inscripcion antes de hoy
	_, _, _, err = validateEventoFechas("10/02/2026", "12/02/2026", "01/01/2020", now)
	if err == nil {
		t.Fatalf("expected error for close date in past")
	}

	// Caso invalido: fecha de de inicio no antes de la fecha de fin
	_, _, _, err = validateEventoFechas("15/02/2026", "15/02/2026", "14/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for end not after start")
	}

	// Caso invalido: fecha de cierre de inscripcion antes de fecha de inicio
	_, _, _, err = validateEventoFechas("10/02/2026", "12/02/2026", "11/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for close date after start date")
	}

	// Caso invalido: formato de fecha invalido
	_, _, _, err = validateEventoFechas("2026-02-05", "06/02/2026", "04/02/2026", now)
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
