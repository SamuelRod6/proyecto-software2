package domain

import "time"

type PasswordRecoveryToken struct {
	ID        int       `json:"id"`
	IDUsuario int       `json:"id_usuario"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type RegistrationTemporaryKey struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expiresAt"`
}
