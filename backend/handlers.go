package main

import (
	"encoding/json"
	"net/http"
)

type HelloResponse struct {
	Message string `json:"message"`
}

func HelloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	res := HelloResponse{Message: "Hola, mundo"}
	json.NewEncoder(w).Encode(res)
}
