package validation

import (
	"errors"
	"strings"
	"time"

	authvalidation "project/backend/internal/auth/validation"
)

func ValidateNombre(nombre string) error {
	trimmed := strings.TrimSpace(nombre)
	if len(trimmed) < 3 || len(trimmed) > 100 {
		return errors.New("El nombre del participante debe tener entre 3 y 100 caracteres")
	}
	return nil
}

func ValidateAfiliacion(afiliacion string) error {
	trimmed := strings.TrimSpace(afiliacion)
	if len(trimmed) < 2 || len(trimmed) > 150 {
		return errors.New("La afiliación debe tener entre 2 y 150 caracteres")
	}
	return nil
}

func ValidateEmail(email string) error {
	if !authvalidation.ValidateEmail(strings.TrimSpace(email)) {
		return errors.New("El correo electrónico no es válido")
	}
	return nil
}

func ParseDate(value string, loc *time.Location) (time.Time, error) {
	if strings.TrimSpace(value) == "" {
		return time.Time{}, errors.New("fecha inválida")
	}
	return time.ParseInLocation("02/01/2006", strings.TrimSpace(value), loc)
}

func NormalizeStatus(value string) string {
	return strings.Title(strings.ToLower(strings.TrimSpace(value)))
}

func IsAllowedStatus(value string) bool {
	switch NormalizeStatus(value) {
	case "Pendiente", "Pagado", "Aprobado", "Rechazado":
		return true
	default:
		return false
	}
}
