package models

// User DTO and related structs

type AuthUser struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	RoleID   int    `json:"roleId"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Message string   `json:"message"`
	User    AuthUser `json:"user"`
	Token   string   `json:"token"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email"`
	NewPassword string `json:"newPassword"`
}
