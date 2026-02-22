import { useEffect, useState } from "react";
import { FiBell, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { ROUTES } from "../../navigation/routes";
import Button from "./Button";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  notificationsUpdatedEvent,
  NotificationItem,
} from "../../utils/notifications";

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const storedUser = (() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("auth-user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as {
        id?: number;
        name?: string;
        email?: string;
        roles?: string[];
        role?: string;
      };
    } catch {
      return null;
    }
  })();

  const initials = (() => {
    const name = storedUser?.name?.trim() || "";
    if (!name) return "US";
    const parts = name.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
    const combined = letters.join("");
    return combined || "US";
  })();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login, { replace: true });
  };

  useEffect(() => {
    const userId = storedUser?.id;
    if (!userId) return;
    setNotifications(getNotificationsForUser(userId));
    const handler = () => setNotifications(getNotificationsForUser(userId));
    window.addEventListener(notificationsUpdatedEvent(), handler);
    return () => {
      window.removeEventListener(notificationsUpdatedEvent(), handler);
    };
  }, [storedUser?.id]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const toggleNotifications = () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);
    if (nextOpen && storedUser?.id) {
      markAllNotificationsRead(storedUser.id);
    }
  };
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F5E427] text-slate-900 flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-white">
              {storedUser?.name || "Usuario"}
            </p>
            <p className="text-sm text-slate-400">
              {storedUser?.email || "Sin correo"}
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3 relative">
          <button
            onClick={toggleNotifications}
            title="Notificaciones"
            className="relative flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
          >
            <FiBell size={22} className="text-white" />
            <span className="text-slate-200 hidden md:inline">
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-[#F5E427] text-slate-900 text-xs font-semibold px-1.5">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
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
      {isNotificationsOpen && (
        <div className="absolute right-6 top-[72px] z-50 w-80 rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <span className="text-sm font-semibold text-slate-100">
              Notificaciones
            </span>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="text-slate-400 hover:text-[#F5E427]"
              aria-label="Cerrar notificaciones"
            >
              ×
            </button>
          </div>
          <div className="max-h-72 overflow-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-400">
                No hay notificaciones.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-slate-700 px-4 py-3 text-sm text-slate-200 last:border-b-0"
                >
                  <div>{item.message}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <Modal
        open={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Cerrar sesión"
        className="max-w-md w-full"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">¿Deseas cerrar sesión?</p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsLogoutConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleLogout}>Cerrar sesión</Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
