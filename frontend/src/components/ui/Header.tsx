import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
// components
import NotificationButton from '../notifications/NotificationButton';
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { ROUTES } from "../../navigation/routes";
import { NotificationContext } from '../../contexts/Notifications/NotificationContext';

export default function Header() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.login, { replace: true });
    };

    // Obtener unreadCount real del contexto
    const { unreadCount } = React.useContext(NotificationContext);

    const handleNotifications = () => {
        if (location.pathname === '/notifications') {
            navigate('/', { replace: true });
        } else {
            navigate('/notifications');
        }
    };
    return (
        <header className="border-b border-slate-800 bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#F5E427] text-slate-900 flex items-center justify-center font-semibold">
                        {user?.name ? user.name.slice(0,2).toUpperCase() : 'CL'}
                    </div>
                    <div>
                        <p className="text-base font-semibold text-white">
                            Bienvenido{user?.name && `, ${user.name.split(' ')[0]}`}
                        </p>
                        <p className="text-sm text-slate-400">
                            {user?.role ? `Has iniciado sesión como: ${user.role}` : 'Usuario sin rol'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-end gap-3">
                    <NotificationButton 
                        unreadCount={unreadCount} 
                        onClick={handleNotifications} 
                    />
                    <button
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
                    >
                        <FiLogOut size={22} className="text-white" />
                        <span className="text-slate-200 hidden md:inline">
                            Cerrar sesión
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}
