package dto

const (
	MsgInscripcionExitosa    = "Te has inscrito exitosamente al evento '%s', que inicia el %s y finaliza el %s."
	MsgCambioEvento          = "El evento '%s' ha sufrido cambios: %s."
	MsgCierreInscripciones   = "¡Última oportunidad! Las inscripciones para el evento '%s' cierran el %s. ¡No te quedes fuera!"
	MsgRecordatorioEvento    = "Recuerda que el evento '%s' al que te inscribiste inicia el %s."
	MsgRecordatorioPago      = "Tienes un pago pendiente para el evento '%s', que inicia el %s. Por favor, regulariza tu situación para asegurar tu participación."
	MsgAperturaInscripciones = "¡Ya puedes inscribirte al evento '%s'! Las inscripciones están abiertas hasta el %s."
	MsgCancelacionEvento     = "Lamentamos informarte que el evento '%s' ha sido cancelado. Si ya te habías inscrito, recibirás un reembolso completo. Disculpa las molestias."
	msgCambioSesion          = "La sesión '%s' del evento '%s' fue actualizada. Nuevo horario: %s - %s."
	MsgTrabajoRecibido       = "Tu trabajo científico '%s' fue recibido correctamente."
	MsgTrabajoNuevo          = "Se recibió un nuevo trabajo científico: '%s'."
	MsgTrabajoActualizado    = "El trabajo '%s' fue actualizado a la versión %d."
	MsgTrabajoAsignado       = "Se te asignó el trabajo científico '%s' para evaluación."
	MsgEvaluacionRecibida    = "El revisor %s envió una evaluación del trabajo '%s'."
	MsgEstadoTrabajo         = "El estado de tu trabajo científico '%s' fue actualizado a: %s."
	MsgEstadoTrabajoConComentario = "El estado de tu trabajo científico '%s' fue actualizado a: %s. Comentario del comité: %s"
)

var NotificationTitles = map[string]string{
	NotificationTypeInscripcion:           "Inscripción exitosa",
	NotificationTypeCambioEvento:          "Cambio en evento",
	NotificationTypeCierreInscripciones:   "Cierre de inscripciones",
	NotificationTypeRecordatorioEvento:    "Recordatorio de evento",
	NotificationTypeRecordatorioPago:      "Recordatorio de pago",
	NotificationTypeAperturaInscripciones: "Apertura de inscripciones",
	NotificationTypeCancelacionEvento:     "Cancelación de evento",
	NotificationTypeCambioSesion:          "Cambio en sesión",
	NotificationTypeTrabajoRecibido:       "Trabajo recibido",
	NotificationTypeTrabajoNuevo:          "Trabajo nuevo",
	NotificationTypeTrabajoActualizado:    "Trabajo actualizado",
	NotificationTypeTrabajoAsignado:       "Trabajo asignado",
	NotificationTypeEvaluacionRecibida:    "Evaluación recibida",
	NotificationTypeEstadoTrabajo:         "Estado trabajo científico",
}

func GetNotificationTitle(tipo string) string {
	if t, ok := NotificationTitles[tipo]; ok {
		return t
	}
	return tipo
}
