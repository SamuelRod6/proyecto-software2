import { fetchNotificationsApi } from '../../services/notificationsServices';

export const REFRESH_NOTIFICATIONS = 'REFRESH_NOTIFICATIONS';
export const MARK_AS_READ = 'MARK_AS_READ';
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS';

export const refreshNotifications = (notifications: any) => ({
    type: REFRESH_NOTIFICATIONS,
    payload: notifications,
});

export const markAsRead = (id: number) => ({
    type: MARK_AS_READ,
    payload: id,
});

export const removeNotification = (id: number | string) => ({
    type: REMOVE_NOTIFICATION,
    payload: id,
});

export const clearNotifications = () => ({
    type: CLEAR_NOTIFICATIONS,
});

const getNotificationTitle = (type?: string): string => {
  switch (type) {
    case "inscripcion":
      return "Inscripcion Exitosa";
    case "cambio_evento":
      return "Actualizacion de evento";
    case "cierre_inscripciones":
      return "Cierre de inscripciones";
    case "recordatorio_evento":
      return "Recordatorio de evento";
    case "recordatorio_pago":
      return "Recordatorio de pago";
    case "apertura_inscripciones":
      return "Apertura de inscripciones";
    case "cancelacion_evento":
      return "Cancelacion de evento";
    case "ROLE_UPDATE":
      return "Roles actualizados";
    default:
      return "Notificacion";
  }
};

export const fetchNotifications = async (userId: number) => {
    const apiNotifications = await fetchNotificationsApi(userId);
    if (apiNotifications.status === 200 && Array.isArray(apiNotifications.data)) {
        return apiNotifications.data.map((n: any) => {
          const rawTitle = typeof n.title === "string" ? n.title.trim() : "";
          return {
            id: n.id,
            type: n.type,
            title: rawTitle || getNotificationTitle(n.type),
            read: n.read,
            eventId: n.event_id,
            content: n.message,
            createdAt: n.created_at,
          };
        });
    } else {
        return [];
    }
};
