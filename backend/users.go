package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"project/backend/events/dto"
	"project/backend/prisma/db"
)

func UsersCountHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	users, err := prismaClient.Usuario.FindMany().Exec(ctx)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	count := len(users)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]int{"count": count})
}

func UpdateUserRoleHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dto.UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.UserID <= 0 || strings.TrimSpace(req.Rol) == "" {
		http.Error(w, "user_id and rol are required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	role, err := prismaClient.Roles.FindUnique(db.Roles.NombreRol.Equals(req.Rol)).Exec(ctx)
	if err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, "Role not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Error querying roles", http.StatusInternalServerError)
		return
	}
	if _, err := prismaClient.Usuario.
		FindUnique(db.Usuario.IDUsuario.Equals(req.UserID)).
		Update(db.Usuario.Rol.Link(db.Roles.IDRol.Equals(role.IDRol))).
		Exec(ctx); err != nil {
		if db.IsErrNotFound(err) {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Error updating role", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Role updated successfully"})
}
