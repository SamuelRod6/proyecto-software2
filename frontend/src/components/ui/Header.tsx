import React, { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
// components
import NotificationButton from "../notifications/NotificationButton";
import NotificationsModal from "../notifications/NotificationsModal";
import ConfirmModal from "./ConfirmModal";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { NotificationContext } from "../../contexts/Notifications/NotificationContext";
import { ROUTES } from "../../navigation/routes";

export default function Header(): JSX.Element {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = React.useContext(NotificationContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotifications = () => {
    setShowNotifications(true);
  };

  const roleLabel = (() => {
    if (user?.roles && user.roles.length > 0) {
      return user.roles
        .map((role) => (typeof role === "string" ? role : role.name))
        .join(", ");
    }
    return user?.role || "Usuario sin rol";
  })();

  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F5E427] text-slate-900 flex items-center justify-center font-semibold">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "CL"}
          </div>
          <div>
            <p className="text-base font-semibold text-white">
              {user?.name || "Usuario"}
            </p>
            <p className="text-sm text-slate-400">
              {user?.email || "email no disponible"}
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <NotificationButton
            unreadCount={unreadCount}
            onClick={handleNotifications}
          />
          <button
            onClick={() => setShowLogoutConfirm(true)}
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
      <NotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <ConfirmModal
        open={showLogoutConfirm}
        title="Cerrar sesion"
        message="Estas seguro de cerrar la sesion?"
        confirmText="Cerrar sesion"
        cancelText="Cancelar"
        onConfirm={() => {
          logout();
          navigate(ROUTES.login, { replace: true });
          setShowLogoutConfirm(false);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}
