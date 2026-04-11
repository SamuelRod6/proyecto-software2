/*
File: responses.go

Contains:
Response DTO definitions for the Evento module.
It centralizes API payload structures returned for events,
sessions, speakers, and date ranges.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

// EventoResponse represents the response payload for an event.
type EventoResponse struct {
	ID                     int              `json:"id_evento"`
	Nombre                 string           `json:"nombre"`
	FechaInicio            string           `json:"fecha_inicio"`
	FechaFin               string           `json:"fecha_fin"`
	FechaCierreInscripcion string           `json:"fecha_cierre_inscripcion"`
	InscripcionesAbiertas  bool             `json:"inscripciones_abiertas"`
	Ubicacion              string           `json:"ubicacion"`
	Sesiones               []SesionResponse `json:"sesiones"`
}

// SesionResponse represents the response payload for a session.
type SesionResponse struct {
	IDSesion    int               `json:"id_sesion"`
	Titulo      string            `json:"titulo"`
	Descripcion string            `json:"descripcion"`
	FechaInicio string            `json:"fecha_inicio"`
	FechaFin    string            `json:"fecha_fin"`
	Ubicacion   string            `json:"ubicacion"`
	Ponentes    []PonenteResponse `json:"ponentes"`
}

// PonenteResponse represents the response payload for a session speaker.
type PonenteResponse struct {
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
}

// RangoFechas represents a date range with a start and end date.
type RangoFechas struct {
	FechaInicio string `json:"fecha_inicio"`
	FechaFin    string `json:"fecha_fin"`
}
