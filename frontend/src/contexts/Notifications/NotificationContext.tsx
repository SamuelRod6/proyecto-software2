import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { notificationReducer, initialState, NotificationState, Notification } from './reducer';
import { fetchNotifications, refreshNotifications as refreshNotificationsAction, markAsRead as markAsReadAction } from './actions';

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	markAsRead: (id: number) => void;
	refreshNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType>({
	notifications: [],
	unreadCount: 0,
	markAsRead: () => {},
	refreshNotifications: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(notificationReducer, initialState);

	// Function to fetch notifications and update state
	const refreshNotifications = useCallback(async () => {
		const data = await fetchNotifications();
		dispatch(refreshNotificationsAction(data));
	}, []);

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
				refreshNotifications
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
};