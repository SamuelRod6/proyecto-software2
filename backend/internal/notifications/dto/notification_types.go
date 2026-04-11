/*
File: notification_types.go

Contains:
Notification type identifiers used across the notifications module.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

// Notification type identifiers used by the application.
const (
	NotificationTypeInscripcion           = "inscripcion"
	NotificationTypeCambioEvento          = "cambio_evento"
	NotificationTypeCierreInscripciones   = "cierre_inscripciones"
	NotificationTypeRecordatorioEvento    = "recordatorio_evento"
	NotificationTypeRecordatorioPago      = "recordatorio_pago"
	NotificationTypeAperturaInscripciones = "apertura_inscripciones"
	NotificationTypeCancelacionEvento     = "cancelacion_evento"
	NotificationTypeCambioSesion          = "cambio_sesion"
	NotificationTypeTrabajoRecibido       = "trabajo_recibido"
	NotificationTypeTrabajoNuevo          = "trabajo_nuevo"
	NotificationTypeTrabajoActualizado    = "trabajo_actualizado"
	NotificationTypeTrabajoAsignado       = "trabajo_asignado"
	NotificationTypeEvaluacionRecibida    = "evaluacion_recibida"
	NotificationTypeEstadoTrabajo         = "estado_trabajo_cientifico"
	NotificationTypeNuevoMensaje          = "nuevo_mensaje"
)
