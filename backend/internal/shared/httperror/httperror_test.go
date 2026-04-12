package httperror

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteJSON(t *testing.T) {
	rr := httptest.NewRecorder()
	WriteJSON(rr, http.StatusForbidden, "acceso denegado")

	if rr.Code != http.StatusForbidden {
		t.Fatalf("unexpected status code: %d", rr.Code)
	}
	if rr.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("unexpected content type: %s", rr.Header().Get("Content-Type"))
	}

	var payload map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("invalid json body: %v", err)
	}
	if payload["message"] != "acceso denegado" {
		t.Fatalf("unexpected message: %s", payload["message"])
	}
}
