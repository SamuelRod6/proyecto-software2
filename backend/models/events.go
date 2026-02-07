package models

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

// EventoResponse represents the event data returned in responses.
type EventoResponse struct {
	ID                     int    `json:"id_evento"`
	Nombre                 string `json:"nombre"`
	FechaInicio            string `json:"fecha_inicio"`
	FechaFin               string `json:"fecha_fin"`
	FechaCierreInscripcion string `json:"fecha_cierre_inscripcion"`
	InscripcionesAbiertas  bool   `json:"inscripciones_abiertas"`
	Ubicacion              string `json:"ubicacion"`
}
