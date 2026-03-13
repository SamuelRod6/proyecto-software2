package dto

type CreateConversacionRequest struct {
	Asunto          string `json:"asunto"`
	ParticipanteIDs []int  `json:"participante_ids"`
}

type SendMensajeRequest struct {
	IDConversacion int    `json:"id_conversacion"`
	IDRemitente    int    `json:"id_remitente"`
	Cuerpo         string `json:"cuerpo"`
	AdjuntoURL     string `json:"adjunto_url,omitempty"`
	AdjuntoNombre  string `json:"adjunto_nombre,omitempty"`
}
