/*
File: validation.go

Contains:
Validation rules for the Sesiones module.
It validates title uniqueness, schedule overlap, duration,
event/session state constraints, and speaker role requirements.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package sesiones

import (
	"errors"
	"project/backend/prisma/db"
	"time"
)

var (
	ErrTituloNoUnico   = errors.New("El título de la sesión ya existe para este evento")
	ErrSolapamiento    = errors.New("Las fechas y horas de la sesión se solapan con otra sesión del evento")
	ErrDuracion        = errors.New("La duración de la sesión debe ser entre 30 minutos y 4 horas")
	ErrEventoIniciado  = errors.New("No se puede modificar la sesión porque el evento ya comenzó")
	ErrSesionCancelada = errors.New("No se puede modificar una sesión cancelada")
	ErrPonenteRol      = errors.New("El usuario no tiene el rol de Ponente")
	ErrSesionFueraDeRango = errors.New("La sesión debe estar dentro del rango de fechas del evento")
)

// ValidarTituloUnico verifies that no session in the collection shares title.
func ValidarTituloUnico(sesiones []db.SesionModel, titulo string) error {
	for _, s := range sesiones {
		if s.Titulo == titulo {
			return ErrTituloNoUnico
		}
	}
	return nil
}

// ValidarSolapamiento verifies that proposed time range does not overlap
// existing sessions.
func ValidarSolapamiento(sesiones []db.SesionModel, fechaInicio, fechaFin time.Time) error {
	for _, s := range sesiones {
		if (fechaInicio.Before(s.FechaFin) && fechaFin.After(s.FechaInicio)) || fechaInicio.Equal(s.FechaInicio) {
			return ErrSolapamiento
		}
	}
	return nil
}

// ValidarDuracion enforces duration between 30 minutes and 4 hours.
func ValidarDuracion(fechaInicio, fechaFin time.Time) error {
	duracion := fechaFin.Sub(fechaInicio)
	if duracion < 30*time.Minute || duracion > 4*time.Hour {
		return ErrDuracion
	}
	return nil
}

// ValidarEventoNoIniciado checks whether the related event has not started.
func ValidarEventoNoIniciado(evento *db.EventoModel) error {
	if evento == nil {
		return errors.New("Evento no encontrado")
	}
	if time.Now().After(evento.FechaInicio) {
		return ErrEventoIniciado
	}
	return nil
}

// ValidarSesionNoCancelada checks whether session is active.
func ValidarSesionNoCancelada(sesion *db.SesionModel) error {
	if sesion != nil && sesion.Cancelado {
		return ErrSesionCancelada
	}
	return nil
}

// ValidarRolPonente validates that every user has the PONENTE role.
func ValidarRolPonente(usuarios []db.UsuarioModel) error {
	for _, u := range usuarios {
		roles := u.RelationsUsuario.UsuarioRoles
		if roles == nil {
			return ErrPonenteRol
		}

		tieneRol := false
		for _, userRole := range roles {
			role := userRole.RelationsUsuarioRoles.Rol
			if role != nil && role.NombreRol == "PONENTE" {
				tieneRol = true
				break
			}
		}

		if !tieneRol {
			return ErrPonenteRol
		}
	}
	return nil
}

// ValidarSesionDentroDeRangoEvento verifies that session range is contained
// within event range.
func ValidarSesionDentroDeRangoEvento(fechaInicio, fechaFin, eventoInicio, eventoFin time.Time) error {
	if fechaInicio.Before(eventoInicio) || fechaFin.After(eventoFin) {
		return ErrSesionFueraDeRango
	}
	return nil
}
