/*
File: requests.go

Contains:
Request DTO definitions for the Evento module.
It centralizes HTTP payload structures used to create and
update events.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

// CreateEventoRequest represents the payload used to create a new event.
type CreateEventoRequest struct {
	Nombre                 string `json:"nombre"`
	FechaInicio            string `json:"fecha_inicio"`
	FechaFin               string `json:"fecha_fin"`
	FechaCierreInscripcion string `json:"fecha_cierre_inscripcion"`
	Ubicacion              string `json:"ubicacion"`
}

// UpdateEventoRequest represents the payload to update an existing event.
type UpdateEventoRequest struct {
	ID                     int    `json:"id_evento"`
	Nombre                 string `json:"nombre"`
	FechaInicio            string `json:"fecha_inicio"`
	FechaFin               string `json:"fecha_fin"`
	FechaCierreInscripcion string `json:"fecha_cierre_inscripcion"`
	Ubicacion              string `json:"ubicacion"`
}
