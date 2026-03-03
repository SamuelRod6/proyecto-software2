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

type SesionResponse struct {
	IDSesion    int               `json:"id_sesion"`
	Titulo      string            `json:"titulo"`
	Descripcion string            `json:"descripcion"`
	FechaInicio string            `json:"fecha_inicio"`
	FechaFin    string            `json:"fecha_fin"`
	Ubicacion   string            `json:"ubicacion"`
	Ponentes    []PonenteResponse `json:"ponentes"`
}

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
