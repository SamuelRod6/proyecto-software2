// actions.ts
export const REFRESH_NOTIFICATIONS = 'REFRESH_NOTIFICATIONS';
export const MARK_AS_READ = 'MARK_AS_READ';

export const refreshNotifications = (notifications) => ({
    type: REFRESH_NOTIFICATIONS,
    payload: notifications,
});

export const markAsRead = (id) => ({
    type: MARK_AS_READ,
    payload: id,
});

// Simulation of fetching notifications from an API
export const fetchNotifications = async () => {
    return [
        {
            id: 1,
            type: 'event-date-update',
            title: 'Fechas de evento actualizadas',
            read: false,
            eventName: 'Congreso Internacional de Ciencia',
            description: 'Las fechas del evento han cambiado.',
            newDates: [
                { date: '2026-03-10', label: 'Inicio' },
                { date: '2026-03-12', label: 'Fin' },
            ],
            eventId: 101,
        },
        {
            id: 2,
            type: 'speaker-added',
            title: 'Evento confirmado',
            read: true,
            content: 'Tu evento ha sido confirmado por el administrador.',
        },
    ];
};
