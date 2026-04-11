/*
File: NotificationButton.tsx

Contains:
Compact notification trigger button with unread indicator dot.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import React from 'react';
import { FaBell } from 'react-icons/fa';

// NotificationButtonProps defines unread state and click behavior.
interface NotificationButtonProps {
    unreadCount: number;
    onClick: () => void;
}

// NotificationButton renders the bell icon and a visual unread badge.
const NotificationButton: React.FC<NotificationButtonProps> = ({ 
	unreadCount, 
	onClick 
}) => {
	return (
		<button
			className="relative flex items-center justify-center p-2 rounded hover:bg-gray-100 transition"
			onClick={onClick}
			aria-label="Notificaciones"
		>
			<FaBell className="text-xl text-gray-700" />
			{unreadCount > 0 && (
				<span
					className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"
					style={{ boxShadow: '0 0 2px #fff' }}
				/>
			)}
		</button>
	);
};

export default NotificationButton;
