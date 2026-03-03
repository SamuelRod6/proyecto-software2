package validation

import (
	"regexp"
	"unicode"
)

// ValidateUsername: 3-50 chars, only letters and spaces (no numbers/special chars).
func ValidateUsername(name string) bool {
	if len(name) < 3 || len(name) > 50 {
		return false
	}
	match, _ := regexp.MatchString(`^[a-zA-Z\s]+$`, name)
	return match
}

// ValidateEmail: Basic email format check.
func ValidateEmail(email string) bool {
	const emailRegex = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	match, _ := regexp.MatchString(emailRegex, email)
	return match
}

// ValidatePassword: 8-20 chars, 1 uppercase, 1 lowercase, 1 number.
func ValidatePassword(pass string) bool {
	if len(pass) < 8 || len(pass) > 20 {
		return false
	}
	var hasUpper, hasLower, hasNumber bool
	for _, char := range pass {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		}
	}
	return hasUpper && hasLower && hasNumber
}
