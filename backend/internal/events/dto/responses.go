package dto

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
