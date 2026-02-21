package validation

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"project/backend/internal/registrations/dto"
)

// Checks that both IDs exists and are positive integers
func ValidateInscripcionIDs(eventoID, usuarioID int) error {
	if eventoID <= 0 {
		return errors.New("id_evento es requerido")
	}
	if usuarioID <= 0 {
		return errors.New("id_usuario es requerido")
	}
	return nil
}

// Checks that the ID is a positive integer
func ValidateInscripcionID(inscripcionID int) error {
	if inscripcionID <= 0 {
		return errors.New("id_inscripcion es requerido")
	}
	return nil
}

// Checks that the comprobante is not too long and is provided if the payment is confirmed
func ValidateComprobante(estadoPago bool, comprobante string) error {
	trimmed := strings.TrimSpace(comprobante)
	if len(trimmed) > 200 {
		return errors.New("El comprobante no puede exceder 200 caracteres.")
	}
	if estadoPago && trimmed == "" {
		return errors.New("El comprobante es requerido cuando el pago esta confirmado.")
	}
	return nil
}

func ParseEventFilters(r *http.Request) (dto.EventFilters, error) {
	searchTerm := strings.TrimSpace(r.URL.Query().Get("searchTerm"))
	countryTerm := strings.TrimSpace(r.URL.Query().Get("countryTerm"))
	cityTerm := strings.TrimSpace(r.URL.Query().Get("cityTerm"))

	var fromDate *time.Time
	if rawFrom := strings.TrimSpace(r.URL.Query().Get("fromDate")); rawFrom != "" {
		parsedFrom, err := time.ParseInLocation("2006-01-02", rawFrom, time.Local)
		if err != nil {
			return dto.EventFilters{}, errors.New("fromDate invalido (formato esperado: YYYY-MM-DD)")
		}
		from := time.Date(parsedFrom.Year(), parsedFrom.Month(), parsedFrom.Day(), 0, 0, 0, 0, time.Local)
		fromDate = &from
	}

	var toDate *time.Time
	if rawTo := strings.TrimSpace(r.URL.Query().Get("toDate")); rawTo != "" {
		parsedTo, err := time.ParseInLocation("2006-01-02", rawTo, time.Local)
		if err != nil {
			return dto.EventFilters{}, errors.New("toDate invalido (formato esperado: YYYY-MM-DD)")
		}
		to := time.Date(parsedTo.Year(), parsedTo.Month(), parsedTo.Day(), 23, 59, 59, int(time.Second-time.Nanosecond), time.Local)
		toDate = &to
	}

	if fromDate != nil && toDate != nil && fromDate.After(*toDate) {
		return dto.EventFilters{}, errors.New("rango de fechas invalido: fromDate no puede ser mayor que toDate")
	}

	return dto.EventFilters{
		SearchTerm:  searchTerm,
		CountryTerm: countryTerm,
		CityTerm:    cityTerm,
		FromDate:    fromDate,
		ToDate:      toDate,
	}, nil
}
