package validation

import (
	"testing"
	"time"
)

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
		err := ValidateEventoNombre(c.name)
		if c.wantErr && err == nil {
			t.Fatalf("expected error for %q", c.name)
		}
		if !c.wantErr && err != nil {
			t.Fatalf("unexpected error for %q: %v", c.name, err)
		}
	}
}

func TestValidateEventoFechas(t *testing.T) {
	now := time.Date(2026, 2, 4, 10, 0, 0, 0, time.Local)

	_, _, _, err := ValidateEventoFechas("07/02/2026", "10/02/2026", "06/02/2026", now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, _, _, err = ValidateEventoFechas("04/01/2026", "25/02/2026", "9/02/2020", now)
	if err == nil {
		t.Fatalf("expected error for start not after today")
	}

	_, _, _, err = ValidateEventoFechas("10/02/2026", "12/02/2026", "01/01/2020", now)
	if err == nil {
		t.Fatalf("expected error for close date in past")
	}

	_, _, _, err = ValidateEventoFechas("15/02/2026", "15/02/2026", "14/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for end not after start")
	}

	_, _, _, err = ValidateEventoFechas("10/02/2026", "12/02/2026", "11/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for close date after start date")
	}

	_, _, _, err = ValidateEventoFechas("2026-02-05", "06/02/2026", "04/02/2026", now)
	if err == nil {
		t.Fatalf("expected error for invalid format")
	}
}

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
		err := ValidateEventoUbicacion(c.loc)
		if c.wantErr && err == nil {
			t.Fatalf("expected error for %q", c.loc)
		}
		if !c.wantErr && err != nil {
			t.Fatalf("unexpected error for %q: %v", c.loc, err)
		}
	}
}
