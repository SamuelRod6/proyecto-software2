package response

// AppCode is a custom application status code.
type AppCode int

const (
	// Success Codes (1xxx)
	SuccessGeneral  AppCode = 1000
	SuccessRegister AppCode = 1001
	SuccessLogin    AppCode = 1002

	// Client Errors (4xxx)
	ErrInvalidJSON        AppCode = 4000
	ErrMethodNotAllowed   AppCode = 4001
	ErrInvalidCredentials AppCode = 4002
	ErrInvalidEmail       AppCode = 4003
	ErrInvalidPassword    AppCode = 4004
	ErrInvalidUsername    AppCode = 4005
	ErrUserExists         AppCode = 4006
	ErrRoleInvalid        AppCode = 4007
	ErrMissingFields      AppCode = 4008

	// Server Errors (5xxx)
	ErrInternalServer AppCode = 5000
	ErrDatabase       AppCode = 5001
	ErrTokenCreation  AppCode = 5002
	ErrHashPassword   AppCode = 5003
)

// AppMessages maps codes to user-friendly messages.
var AppMessages = map[AppCode]string{
	SuccessGeneral:  "Operation successful",
	SuccessRegister: "User registered successfully",
	SuccessLogin:    "Login successful",

	ErrInvalidJSON:        "Invalid JSON format",
	ErrMethodNotAllowed:   "Method not allowed",
	ErrInvalidCredentials: "Invalid email or password",
	ErrInvalidEmail:       "Invalid email format",
	ErrInvalidPassword:    "Invalid password format (must be 8-20 chars, 1 upper, 1 lower, 1 number)",
	ErrInvalidUsername:    "Invalid username (must be 3-50 chars, letters only)",
	ErrUserExists:         "User already exists or database error",
	ErrRoleInvalid:        "Invalid role specified",
	ErrMissingFields:      "Missing required fields",

	ErrInternalServer: "Internal server error",
	ErrDatabase:       "Database operation failed",
	ErrTokenCreation:  "Failed to create authentication token",
	ErrHashPassword:   "Failed to process password",
}

// GetMessage returns the message for a given code, or a default string.
func (c AppCode) GetMessage() string {
	if msg, ok := AppMessages[c]; ok {
		return msg
	}
	return "Unknown Code"
}
