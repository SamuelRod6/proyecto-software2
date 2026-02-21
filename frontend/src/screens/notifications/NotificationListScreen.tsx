import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// components
import BackArrow from '../../components/ui/BackArrow';
// contexts
import { NotificationContext } from '../../contexts/Notifications/NotificationContext';

const NotificationListScreen: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { notifications, markAsRead } = useContext(NotificationContext);
	// states
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [prevPath, setPrevPath] = useState<string | null>(null);

	// Effect to save previous path from location.state when component mounts
	useEffect(() => {
		if (location.state && (location.state as any).from) {
			setPrevPath((location.state as any).from);
		}
	}, [location.state]);

	// Order notifications by createdAt descending 
	const orderedNotifications = [...notifications].sort((a, b) => {
	  if (!a.createdAt || !b.createdAt) return 0;
	  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});

	const selectedNotif = notifications.find(n => n.id === selectedId);

	return (
		<div className="mx-auto mt-8 flex rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden w-full max-w-5xl min-h-[400px]">
			<div className="w-1/3 min-w-[220px] max-w-[340px] flex flex-col border-r border-slate-700 bg-slate-900" style={{ maxHeight: '600px' }}>
				<div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700 bg-slate-800/80">
					<div className="flex items-center gap-2">
						<BackArrow 
							className="text-xl text-[#F5E427]"
							onClick={() => {
								setSelectedId(null);
								if (prevPath) {
									navigate(prevPath, { replace: true });
								} else {
									navigate(-1);
								}
							}}
						/>
						<h2 className="text-lg font-bold text-[#F5E427] tracking-wide">
							Notificaciones
						</h2>
					</div>
				</div>
				<div className="flex-1 overflow-y-auto" style={{ maxHeight: '540px' }}>
					<div className="divide-y divide-slate-700">
						{orderedNotifications.map((notif) => (
							<button
								key={notif.id}
								className={`w-full text-left px-5 py-3 flex items-center gap-2 transition-colors focus:outline-none ${selectedId === notif.id ? 'bg-slate-800/80' : 'bg-slate-900'}`}
								onClick={() => {
									if (selectedId === notif.id) {
										setSelectedId(null);
									} else {
										setSelectedId(notif.id);
										if (!notif.read) {
											markAsRead(notif.id);
										}
									}
								}}
							>
								{!notif.read && 
									<span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
								}
								<span className={`font-semibold truncate ${notif.read ? 'text-slate-400' : 'text-white'}`} title={notif.title || notif.type}>
									{notif.title || notif.type}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col justify-start items-stretch p-6 md:p-10 bg-slate-800 relative min-h-[400px]">
				{selectedNotif ? (
					<div className="w-full max-w-2xl mx-auto flex flex-col h-full">
						<div className="text-2xl font-bold mb-4 text-white break-words">
							{selectedNotif.title || selectedNotif.type}
						</div>
						<div className="flex-1 text-lg text-slate-200 mb-6 whitespace-pre-line break-words">
							{selectedNotif.content}
						</div>
						<div className="mt-auto">
							{selectedNotif.read ? (
								<span className="text-xs text-slate-400">Leído</span>
							) : (
								<span className="text-xs text-red-500 font-semibold">No leído</span>
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-full w-full">
						<div className="text-2xl font-bold text-slate-200 mb-2">
							No hay notificación seleccionada
						</div>
						<div className="text-slate-400">
							Selecciona una notificación del listado para ver el detalle.
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default NotificationListScreen;
