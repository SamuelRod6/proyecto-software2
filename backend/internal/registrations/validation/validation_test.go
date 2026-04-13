package validation

import (
	"net/http/httptest"
	"testing"
)

func TestValidateInscripcionIDs(t *testing.T) {
	if err := ValidateInscripcionIDs(1, 2); err != nil {
		t.Fatalf("expected valid ids, got: %v", err)
	}
	if err := ValidateInscripcionIDs(0, 2); err == nil {
		t.Fatal("expected error for invalid evento id")
	}
}

func TestValidateInscripcionID(t *testing.T) {
	if err := ValidateInscripcionID(10); err != nil {
		t.Fatalf("expected valid id, got: %v", err)
	}
	if err := ValidateInscripcionID(0); err == nil {
		t.Fatal("expected invalid id error")
	}
}

func TestValidateComprobante(t *testing.T) {
	if err := ValidateComprobante(false, ""); err != nil {
		t.Fatalf("expected optional comprobante when unpaid, got: %v", err)
	}
	if err := ValidateComprobante(true, ""); err == nil {
		t.Fatal("expected required comprobante error")
	}
}

func TestParseEventFilters(t *testing.T) {
	req := httptest.NewRequest("GET", "/?searchTerm=ia&countryTerm=VE&cityTerm=CCS&fromDate=2026-04-01&toDate=2026-04-10", nil)
	filters, err := ParseEventFilters(req)
	if err != nil {
		t.Fatalf("expected valid filters, got: %v", err)
	}

	if filters.SearchTerm != "ia" || filters.CountryTerm != "VE" || filters.CityTerm != "CCS" {
		t.Fatalf("unexpected filters text values: %+v", filters)
	}
	if filters.FromDate == nil || filters.ToDate == nil {
		t.Fatal("expected parsed date range")
	}
}

func TestParseEventFiltersInvalidDateRange(t *testing.T) {
	req := httptest.NewRequest("GET", "/?fromDate=2026-04-20&toDate=2026-04-10", nil)
	_, err := ParseEventFilters(req)
	if err == nil {
		t.Fatal("expected invalid date range error")
	}
}
