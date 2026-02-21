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
	parseDate := func(dateStr string) (time.Time, error) {
		dateStr = strings.TrimSpace(dateStr)
		// Intentar formato con hora
		t, err := time.ParseInLocation("02/01/2006 15:04:05", dateStr, loc)
		if err == nil {
			return t, nil
		}
		// Intentar formato sin hora
		t, err = time.ParseInLocation("02/01/2006", dateStr, loc)
		if err == nil {
			return t, nil
		}
		return time.Time{}, errors.New("Formato de fecha inválido (DD/MM/AAAA o DD/MM/AAAA HH:mm:ss)")
	}
	start, err := parseDate(fechaInicio)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de inicio inválida (formato DD/MM/AAAA o DD/MM/AAAA HH:mm:ss).")
	}
	end, err := parseDate(fechaFin)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de fin inválida (formato DD/MM/AAAA o DD/MM/AAAA HH:mm:ss).")
	}
	cierre, err := parseDate(fechaCierre)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de cierre de inscripción inválida (formato DD/MM/AAAA o DD/MM/AAAA HH:mm:ss).")
	}

	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	if !start.After(today) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de inicio debe ser posterior a la fecha actual.")
	}
	if !cierre.After(today) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de cierre de inscripción debe ser posterior a la fecha actual.")
	}

	if end.Before(start) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de fin no puede ser anterior a la fecha de inicio.")
	}
	if !cierre.Before(start) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de cierre de inscripción debe ser anterior a la fecha de inicio del evento.")
	}

	return start, end, cierre, nil
}

func ValidateEventoFechasUpdate(fechaInicio, fechaFin, fechaCierre string, now, currentCierre time.Time) (time.Time, time.Time, time.Time, error) {
	loc := now.Location()
	parseDate := func(dateStr string) (time.Time, error) {
		dateStr = strings.TrimSpace(dateStr)
		t, err := time.ParseInLocation("02/01/2006 15:04:05", dateStr, loc)
		if err == nil {
			return t, nil
		}
		t, err = time.ParseInLocation("02/01/2006", dateStr, loc)
		if err == nil {
			return t, nil
		}
		return time.Time{}, errors.New("Formato de fecha inválido (DD/MM/AAAA o DD/MM/AAAA HH:mm:ss)")
	}
	start, err := parseDate(fechaInicio)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de inicio inválida (formato DD/MM/AAAA o DD/MM/AAAA HH:mm:ss).")
	}
	end, err := parseDate(fechaFin)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de fin inválida (formato DD/MM/AAAA o DD/MM/AAAA HH:mm:ss).")
	}
	cierre, err := parseDate(fechaCierre)
	if err != nil {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("Fecha de cierre de inscripción inválida (formato DD/MM/AAAA o DD/MM/AAAA HH:mm:ss).")
	}

	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	currentCierreDay := time.Date(currentCierre.Year(), currentCierre.Month(), currentCierre.Day(), 0, 0, 0, 0, loc)
	requestedCierreDay := time.Date(cierre.Year(), cierre.Month(), cierre.Day(), 0, 0, 0, 0, loc)

	if !start.After(today) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de inicio debe ser posterior a la fecha actual.")
	}
	if now.After(currentCierreDay) && !requestedCierreDay.Equal(currentCierreDay) {
		return time.Time{}, time.Time{}, time.Time{}, errors.New("La fecha de cierre de inscripción no puede modificarse una vez alcanzada.")
	}
	if !requestedCierreDay.After(today) && !requestedCierreDay.Equal(currentCierreDay) {
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
