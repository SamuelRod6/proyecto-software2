// File: backend/events/dto/requests.go
// Purpose: Defines all request DTOs for event-related operations.
// Usage: Import and use the DTOs in event handlers and services.

package dto

// CreateEventoRequest represents the payload to create a new event.
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
