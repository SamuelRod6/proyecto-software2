package dto

type CreateInscripcionRequest struct {
	IDEvento          int    `json:"id_evento"`
	IDUsuario         int    `json:"id_usuario"`
	NombreParticipante string `json:"nombre_participante"`
	Email             string `json:"email"`
	Afiliacion        string `json:"afiliacion"`
	ComprobantePago   string `json:"comprobante_pago"`
}

type UpdateEstadoRequest struct {
	IDInscripcion int    `json:"id_inscripcion"`
	Estado        string `json:"estado"`
	Nota          string `json:"nota"`
	Actor         string `json:"actor"`
}

type PreferenciasRequest struct {
	IDUsuario  int    `json:"id_usuario"`
	Frecuencia string `json:"frecuencia"`
	Tipos      string `json:"tipos"`
	Habilitado *bool  `json:"habilitado"`
}

type ReporteProgramadoRequest struct {
	IDEvento   *int   `json:"id_evento"`
	Estado     string `json:"estado"`
	Frecuencia string `json:"frecuencia"`
	Formato    string `json:"formato"`
	CreadoPor  string `json:"creado_por"`
}
