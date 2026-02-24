package dto

type InscripcionResponse struct {
	IDInscripcion      int     `json:"id_inscripcion"`
	IDEvento           int     `json:"id_evento"`
	EventoNombre       string  `json:"evento_nombre"`
	IDUsuario          int     `json:"id_usuario"`
	NombreParticipante string  `json:"nombre_participante"`
	Email              string  `json:"email"`
	Afiliacion         string  `json:"afiliacion"`
	ComprobantePago    *string `json:"comprobante_pago"`
	FechaInscripcion   string  `json:"fecha_inscripcion"`
	FechaLimitePago    string  `json:"fecha_limite_pago"`
	Estado             string  `json:"estado"`
}

type HistorialResponse struct {
	IDHistorial    int    `json:"id_historial"`
	IDInscripcion  int    `json:"id_inscripcion"`
	EstadoAnterior string `json:"estado_anterior"`
	EstadoNuevo    string `json:"estado_nuevo"`
	Nota           string `json:"nota"`
	Actor          string `json:"actor"`
	FechaCambio    string `json:"fecha_cambio"`
}

type PreferenciasResponse struct {
	IDUsuario  int    `json:"id_usuario"`
	Frecuencia string `json:"frecuencia"`
	Tipos      string `json:"tipos"`
	Habilitado bool   `json:"habilitado"`
}

type ReporteResponse struct {
	Total      int                      `json:"total"`
	PorEstado  map[string]int           `json:"por_estado"`
	Registros  []InscripcionResponse    `json:"registros"`
}

type ReporteProgramadoResponse struct {
	IDReporte  int     `json:"id_reporte"`
	IDEvento   *int    `json:"id_evento"`
	Estado     *string `json:"estado"`
	Frecuencia string  `json:"frecuencia"`
	Formato    string  `json:"formato"`
	CreadoPor  *string `json:"creado_por"`
	CreadoEn   string  `json:"creado_en"`
}

type NotificacionResponse struct {
	IDNotificacion int    `json:"id_notificacion"`
	IDUsuario      int    `json:"id_usuario"`
	IDInscripcion  *int   `json:"id_inscripcion"`
	Canal          string `json:"canal"`
	Asunto         string `json:"asunto"`
	Mensaje        string `json:"mensaje"`
	FechaEnvio     string `json:"fecha_envio"`
	Estado         string `json:"estado"`
}
