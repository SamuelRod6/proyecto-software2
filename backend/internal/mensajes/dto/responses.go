package dto

import "time"

type ParticipanteResponse struct {
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
}

type MensajeResponse struct {
	IDMensaje       int       `json:"id_mensaje"`
	IDConversacion  int       `json:"id_conversacion"`
	IDRemitente     int       `json:"id_remitente"`
	NombreRemitente string    `json:"nombre_remitente"`
	Cuerpo          string    `json:"cuerpo"`
	AdjuntoURL      *string   `json:"adjunto_url,omitempty"`
	AdjuntoNombre   *string   `json:"adjunto_nombre,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type ConversacionResponse struct {
	IDConversacion int                    `json:"id_conversacion"`
	Asunto         string                 `json:"asunto"`
	Participantes  []ParticipanteResponse `json:"participantes"`
	UltimoMensaje  *MensajeResponse       `json:"ultimo_mensaje,omitempty"`
	UpdatedAt      time.Time              `json:"updated_at"`
}
