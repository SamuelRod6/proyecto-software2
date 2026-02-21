package dto

const (
	MsgInscripcionExitosa    = "Te has inscrito exitosamente al evento '%s', que inicia el %s y finaliza el %s."
	MsgCambioEvento          = "El evento '%s' ha sufrido cambios: %s."
	MsgCierreInscripciones   = "¡Última oportunidad! Las inscripciones para el evento '%s' cierran el %s. ¡No te quedes fuera!"
	MsgRecordatorioEvento    = "Recuerda que el evento '%s' al que te inscribiste inicia el %s."
	MsgRecordatorioPago      = "Tienes un pago pendiente para el evento '%s', que inicia el %s. Por favor, regulariza tu situación para asegurar tu participación."
	MsgAperturaInscripciones = "¡Ya puedes inscribirte al evento '%s'! Las inscripciones están abiertas hasta el %s."
	MsgCancelacionEvento     = "Lamentamos informarte que el evento '%s' ha sido cancelado. Si ya te habías inscrito, recibirás un reembolso completo. Disculpa las molestias."
)

var NotificationTitles = map[string]string{
	NotificationTypeInscripcion:           "Inscripción exitosa",
	NotificationTypeCambioEvento:          "Cambio en evento",
	NotificationTypeCierreInscripciones:   "Cierre de inscripciones",
	NotificationTypeRecordatorioEvento:    "Recordatorio de evento",
	NotificationTypeRecordatorioPago:      "Recordatorio de pago",
	NotificationTypeAperturaInscripciones: "Apertura de inscripciones",
	NotificationTypeCancelacionEvento:     "Cancelación de evento",
}

func GetNotificationTitle(tipo string) string {
	if t, ok := NotificationTitles[tipo]; ok {
		return t
	}
	return tipo
}
