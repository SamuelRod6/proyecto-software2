package validation

import (
	"testing"
	"time"
)

func TestValidateNombre(t *testing.T) {
	if err := ValidateNombre("Laura Perez"); err != nil {
		t.Fatalf("expected valid nombre, got: %v", err)
	}
	if err := ValidateNombre("Li"); err == nil {
		t.Fatal("expected invalid short nombre")
	}
}

func TestValidateAfiliacion(t *testing.T) {
	if err := ValidateAfiliacion("UCV"); err != nil {
		t.Fatalf("expected valid afiliacion, got: %v", err)
	}
	if err := ValidateAfiliacion("A"); err == nil {
		t.Fatal("expected invalid afiliacion")
	}
}

func TestValidateEmail(t *testing.T) {
	if err := ValidateEmail("user@mail.com"); err != nil {
		t.Fatalf("expected valid email, got: %v", err)
	}
	if err := ValidateEmail("user@mail"); err == nil {
		t.Fatal("expected invalid email")
	}
}

func TestParseDate(t *testing.T) {
	loc := time.Local
	parsed, err := ParseDate("12/04/2026", loc)
	if err != nil {
		t.Fatalf("expected valid parse, got: %v", err)
	}
	if parsed.Day() != 12 || parsed.Month() != time.April || parsed.Year() != 2026 {
		t.Fatalf("unexpected parsed date: %v", parsed)
	}
	if _, err := ParseDate("", loc); err == nil {
		t.Fatal("expected parse error for empty value")
	}
}

func TestStatusHelpers(t *testing.T) {
	if NormalizeStatus("  PAGADO ") != "Pagado" {
		t.Fatal("expected normalized status")
	}
	if !IsAllowedStatus(" pagado ") {
		t.Fatal("expected allowed status")
	}
	if IsAllowedStatus("desconocido") {
		t.Fatal("expected disallowed status")
	}
}
