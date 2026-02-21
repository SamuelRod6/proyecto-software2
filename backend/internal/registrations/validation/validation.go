package validation

import (
	"errors"
	"strings"
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
