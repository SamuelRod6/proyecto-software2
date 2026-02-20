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
)

func ValidarTituloUnico(sesiones []db.SesionModel, titulo string) error {
	for _, s := range sesiones {
		if s.Titulo == titulo {
			return ErrTituloNoUnico
		}
	}
	return nil
}

func ValidarSolapamiento(sesiones []db.SesionModel, fechaInicio, fechaFin time.Time) error {
	for _, s := range sesiones {
		if (fechaInicio.Before(s.FechaFin) && fechaFin.After(s.FechaInicio)) || fechaInicio.Equal(s.FechaInicio) {
			return ErrSolapamiento
		}
	}
	return nil
}

func ValidarDuracion(fechaInicio, fechaFin time.Time) error {
	duracion := fechaFin.Sub(fechaInicio)
	if duracion < 30*time.Minute || duracion > 4*time.Hour {
		return ErrDuracion
	}
	return nil
}

func ValidarEventoNoIniciado(evento *db.EventoModel) error {
	if evento == nil {
		return errors.New("Evento no encontrado")
	}
	if time.Now().After(evento.FechaInicio) {
		return ErrEventoIniciado
	}
	return nil
}

func ValidarSesionNoCancelada(sesion *db.SesionModel) error {
	if sesion != nil && sesion.Cancelado {
		return ErrSesionCancelada
	}
	return nil
}

func ValidarRolPonente(usuarios []db.UsuarioModel) error {
	for _, u := range usuarios {
		if u.Rol() == nil || u.Rol().NombreRol != "PONENTE" {
			return ErrPonenteRol
		}
	}
	return nil
}

var (
	ErrSesionFueraDeRango = errors.New("La sesión debe estar dentro del rango de fechas del evento")
)

func ValidarSesionDentroDeRangoEvento(fechaInicio, fechaFin, eventoInicio, eventoFin time.Time) error {
	if fechaInicio.Before(eventoInicio) || fechaFin.After(eventoFin) {
		return ErrSesionFueraDeRango
	}
	return nil
}
