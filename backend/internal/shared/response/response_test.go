package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteJSONSuccess(t *testing.T) {
	rr := httptest.NewRecorder()
	WriteJSON(rr, http.StatusOK, SuccessGeneral, map[string]string{"ok": "1"})

	if rr.Code != http.StatusOK {
		t.Fatalf("unexpected status code: %d", rr.Code)
	}
	if got := rr.Header().Get("Content-Type"); got != "application/json" {
		t.Fatalf("unexpected content-type: %s", got)
	}

	var body APIResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid json body: %v", err)
	}
	if body.Status != "success" {
		t.Fatalf("expected success status, got: %s", body.Status)
	}
}

func TestWriteError(t *testing.T) {
	rr := httptest.NewRecorder()
	WriteError(rr, http.StatusBadRequest, ErrMissingFields)

	var body APIResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid json body: %v", err)
	}
	if body.Status != "error" {
		t.Fatalf("expected error status, got: %s", body.Status)
	}
}
