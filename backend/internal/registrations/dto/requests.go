package dto

type CreateInscripcionRequest struct {
	EventoID    int    `json:"id_evento"`
	UsuarioID   int    `json:"id_usuario"`
	EstadoPago  bool   `json:"estado_pago"`
	Comprobante string `json:"comprobante"`
}

type UpdatePagoRequest struct {
	InscripcionID int    `json:"id_inscripcion"`
	EstadoPago    bool   `json:"estado_pago"`
	Comprobante   string `json:"comprobante"`
}
