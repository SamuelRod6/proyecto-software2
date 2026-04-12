/*
File: responses.go

Contains:
Response DTO definitions for the Sesiones module.
It centralizes payload structures returned for sessions,
assigned speakers, and assignable speakers.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

// SesionResponse represents the response payload for a session.
type SesionResponse struct {
	IDSesion    int               `json:"id_sesion"`
	Titulo      string            `json:"titulo"`
	Descripcion string            `json:"descripcion"`
	FechaInicio string            `json:"fecha_inicio"`
	FechaFin    string            `json:"fecha_fin"`
	Ubicacion   string            `json:"ubicacion"`
	EventoID    int               `json:"id_evento"`
	Ponentes    []PonenteResponse `json:"ponentes"`
}

// PonenteResponse represents the response payload for a speaker assigned to a session.
type PonenteResponse struct {
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
}

// PonenteAsignableResponse represents the response payload for a speaker that can be assigned to a session.
type PonenteAsignableResponse struct {
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
}
