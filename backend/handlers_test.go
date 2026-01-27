package main

import (
	"net/http/httptest"
	"testing"
)

func TestHelloHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/hello", nil)
	rr := httptest.NewRecorder()
	HelloHandler(rr, req)
	if rr.Code != 200 {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	got := rr.Body.String()
	want := "{\"message\":\"Hola, mundo\"}\n"
	if got != want {
		t.Fatalf("expected %s got %s", want, got)
	}
}
