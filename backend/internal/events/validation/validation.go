package validation

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

var (
	nameRegex     = regexp.MustCompile(`^[\p{L} ]+$`)
	locationRegex = regexp.MustCompile(`^[\p{L}0-9\s,\.\-]+$`)
)

func ValidateEventoNombre(nombre string) error {
	trimmed := strings.TrimSpace(nombre)
	if len(trimmed) < 5 || len(trimmed) > 100 {
		return errors.New("El nombre del evento debe tener entre 5 y 100 caracteres.")
	}
	if !nameRegex.MatchString(trimmed) {
		return errors.New("El nombre del evento solo puede contener letras y espacios")
	}
	return nil
}

func ValidateEventoFechas(fechaInicio, fechaFin, fechaCierre string, now time.Time) (time.Time, time.Time, time.Time, error) {
	loc := now.Location()
	start, err := time.ParseInLocation("02/01/2006", strings.TrimSpace(fechaInicio), loc)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de inicio inválida (formato DD/MM/AAAA).")
	}
	end, err := time.ParseInLocation("02/01/2006", strings.TrimSpace(fechaFin), loc)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de fin inválida (formato DD/MM/AAAA).")
	}
	cierre, err := time.ParseInLocation("02/01/2006", strings.TrimSpace(fechaCierre), loc)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de cierre de inscripción inválida (formato DD/MM/AAAA).")
	}

	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	if !start.After(today) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de inicio debe ser posterior a la fecha actual.")
	}
	if !cierre.After(today) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de cierre de inscripción debe ser posterior a la fecha actual.")
	}

	if !end.After(start) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de fin debe ser posterior a la fecha de inicio.")
	}
	if !cierre.Before(start) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de cierre de inscripción debe ser anterior a la fecha de inicio del evento.")
	}

	return start, end, cierre, nil
}

func ValidateEventoUbicacion(ubicacion string) error {
	trimmed := strings.TrimSpace(ubicacion)
	if len(trimmed) < 5 || len(trimmed) > 200 {
		return errors.New("La ubicación debe tener entre 5 y 200 caracteres.")
	}
	if !locationRegex.MatchString(trimmed) {
		return errors.New("La ubicación contiene caracteres no permitidos.")
	}
	parts := strings.FieldsFunc(trimmed, func(r rune) bool {
		return r == ',' || r == '.'
	})
	if len(parts) < 2 || strings.TrimSpace(parts[0]) == "" || strings.TrimSpace(parts[1]) == "" {
		return errors.New("La ubicación debe incluir ciudad y país separados por coma (,) o punto (.).")
	}
	return nil
}
