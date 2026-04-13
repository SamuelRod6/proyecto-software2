package httperror

import (
	"encoding/json"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, httpStatus int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)

	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": message,
	})
}
