package models

// UpdateRoleRequest represents the payload for updating a user's role.
type UpdateRoleRequest struct {
	UserID int    `json:"user_id"`
	Rol    string `json:"rol"`
}
