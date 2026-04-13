package dto

import "project/backend/internal/auth/domain"

type RegisterRequest struct {
	Name         string `json:"name"`
	Email        string `json:"email"`
	Password     string `json:"password"`
	TemporaryKey string `json:"temporaryKey"`
	RoleID       int    `json:"roleId"`
}

type RegistrationKeyRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type RegistrationKeyVerifyRequest struct {
	Email        string `json:"email"`
	TemporaryKey string `json:"temporaryKey"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Message string          `json:"message"`
	User    domain.AuthUser `json:"user"`
	Token   string          `json:"token"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email"`
	NewPassword string `json:"newPassword"`
}

type PasswordRecoveryRequest struct {
	Email string `json:"email"`
}

type PasswordRecoveryVerifyRequest struct {
	Email        string `json:"email"`
	TemporaryKey string `json:"temporaryKey"`
}

type PasswordRecoveryResetRequest struct {
	Email        string `json:"email"`
	TemporaryKey string `json:"temporaryKey"`
	NewPassword  string `json:"newPassword"`
}

type UpdateRoleRequest struct {
	UserID int    `json:"user_id"`
	Rol    string `json:"rol"`
}
