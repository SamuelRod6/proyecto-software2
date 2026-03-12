package domain

import "time"

type PasswordRecoveryToken struct {
	ID        int       `json:"id"`
	IDUsuario int       `json:"id_usuario"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expiresAt"`
}
