package dto

// CreateSesionRequest represents the payload to create a new session.
type CreateSesionRequest struct {
	Titulo      string `json:"titulo"`
	Descripcion string `json:"descripcion"`
	FechaInicio string `json:"fecha_inicio"`
	FechaFin    string `json:"fecha_fin"`
	Ubicacion   string `json:"ubicacion"`
}

// UpdateSesionRequest represents the payload to update an existing session.
type UpdateSesionRequest struct {
	IDSesion    int    `json:"id_sesion"`
	Titulo      string `json:"titulo"`
	Descripcion string `json:"descripcion"`
	FechaInicio string `json:"fecha_inicio"`
	FechaFin    string `json:"fecha_fin"`
	Ubicacion   string `json:"ubicacion"`
}

// AsignarPonentesRequest represents the payload to assign speakers to a session.
type AsignarPonentesRequest struct {
	Usuarios []int `json:"usuarios"`
}
