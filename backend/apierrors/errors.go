// File: backend/apierrors/errors.go
// Purpose: Helpers to send JSON error responses for the API.
// Output format: {"error":"<message>"}
// Usage: apierrors.WriteJSON(w, http.StatusBadRequest, "mensaje")

package apierrors

import (
	"encoding/json"
	"net/http"
)

type apiError struct {
	Message string `json:"error"`
}

func WriteJSON(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(apiError{Message: message})
}
