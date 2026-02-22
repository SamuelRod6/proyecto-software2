package domain

type AuthUser struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Roles []RoleInfo `json:"roles"`
}

type RoleInfo struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}
