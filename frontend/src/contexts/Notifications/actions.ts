import { fetchNotificationsApi } from '../../services/notificationsServices';

export const REFRESH_NOTIFICATIONS = 'REFRESH_NOTIFICATIONS';
export const MARK_AS_READ = 'MARK_AS_READ';

export const refreshNotifications = (notifications: any) => ({
    type: REFRESH_NOTIFICATIONS,
    payload: notifications,
});

export const markAsRead = (id: number) => ({
    type: MARK_AS_READ,
    payload: id,
});

export const fetchNotifications = async (userId: number) => {
    const apiNotifications = await fetchNotificationsApi(userId);
    if (apiNotifications.status === 200 && Array.isArray(apiNotifications.data)) {
        return apiNotifications.data.map((n: any) => ({
            id: n.id_notificacion,
            type: n.tipo,
            title: n.tipo,
            read: n.leida,
            eventId: n.id_evento,
            content: n.mensaje,
            createdAt: n.createdAt,
        }));
    } else {
        // Aquí podrías lanzar un error o retornar [] según lo que prefieras
        return [];
    }
};
