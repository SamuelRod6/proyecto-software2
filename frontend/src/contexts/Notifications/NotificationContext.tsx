import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from '../Auth/Authcontext';
import { useToast } from '../Toast/ToastContext';
import { notificationReducer, initialState, NotificationState, Notification } from './reducer';
import { fetchNotifications, refreshNotifications as refreshNotificationsAction, markAsRead as markAsReadAction } from './actions';

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	markAsRead: (id: number) => void;
	refreshNotifications: () => void;
	loading: boolean;
	error: string | null;
}

interface NotificationProviderProps {
	children: React.ReactNode;
}

export const NotificationContext = createContext<NotificationContextType>({
	notifications: [],
	unreadCount: 0,
	markAsRead: () => {},
	refreshNotifications: () => {},
	loading: false,
	error: null,
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(notificationReducer, initialState);
	const { user } = useAuth();
	const { showToast } = useToast();
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	// Function to fetch notifications and update state
	const refreshNotifications = useCallback(async () => {
		if (!user || !user.id) {
			dispatch(refreshNotificationsAction([]));
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const data = await fetchNotifications(user.id);
			dispatch(refreshNotificationsAction(data));
			console.log('Notificaciones actualizadas:', data);
		} catch (err: any) {
			setError('Error al cargar notificaciones');
			showToast({
				title: "Error al cargar notificaciones",
				message: err?.message || "No se pudieron cargar las notificaciones.",
				status: "error",
			});
		} finally {
			setLoading(false);
		}
	}, [user, showToast]);

	// Fetch notifications on mount and set up polling every 10 seconds
	useEffect(() => {
		refreshNotifications();
		const interval = setInterval(refreshNotifications, 10000); // 10s
		return () => clearInterval(interval);
	}, [refreshNotifications]);

	// Function to mark a notification as read
	const markAsRead = (id: number) => {
		dispatch(markAsReadAction(id));
	};

	const unreadCount = state.notifications.filter((n) => !n.read).length;

	return (
		<NotificationContext.Provider 
			value={{
				notifications: state.notifications,
				unreadCount,
				markAsRead,
				refreshNotifications,
				loading,
				error
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
};