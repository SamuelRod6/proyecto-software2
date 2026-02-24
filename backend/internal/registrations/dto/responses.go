package dto

type InscripcionResponse struct {
	ID          int    `json:"id_inscripcion"`
	EventoID    int    `json:"id_evento"`
	UsuarioID   int    `json:"id_usuario"`
	Fecha       string `json:"fecha"`
	EstadoPago  bool   `json:"estado_pago"`
	Comprobante string `json:"comprobante"`
}
