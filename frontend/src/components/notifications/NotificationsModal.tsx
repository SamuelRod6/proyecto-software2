import React, { useContext, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import { NotificationContext } from "../../contexts/Notifications/NotificationContext";

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  open,
  onClose,
}) => {
  const { notifications, markAsRead, removeNotification, loading, error } = useContext(
    NotificationContext,
  );
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  const orderedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [notifications]);

  const selectedNotif = notifications.find((n) => n.id === selectedId);

  return (
    <Modal open={open} onClose={onClose} title="Notificaciones" className="max-w-5xl w-full">
      <div className="flex min-h-[420px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="w-1/3 min-w-[220px] max-w-[340px] flex flex-col border-r border-slate-700 bg-slate-900">
          <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/80">
            <h3 className="text-lg font-bold text-[#F5E427] tracking-wide">
              Bandeja
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: "520px" }}>
            {loading ? (
              <div className="px-5 py-6 text-sm text-slate-400">Cargando...</div>
            ) : error ? (
              <div className="px-5 py-6 text-sm text-red-400">{error}</div>
            ) : orderedNotifications.length === 0 ? (
              <div className="px-5 py-6 text-sm text-slate-400">
                No hay notificaciones.
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {orderedNotifications.map((notif) => (
                  <button
                    key={String(notif.id)}
                    className={`w-full text-left px-5 py-3 flex items-center gap-2 transition-colors focus:outline-none ${
                      selectedId === notif.id
                        ? "bg-slate-800/80"
                        : "bg-slate-900"
                    }`}
                    onClick={() => {
                      if (selectedId === notif.id) {
                        setSelectedId(null);
                        return;
                      }
                      setSelectedId(notif.id);
                      if (!notif.read) {
                        markAsRead(notif.id);
                      }
                    }}
                  >
                    {!notif.read && (
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    )}
                    <span
                      className={`font-semibold truncate flex-1 ${
                        notif.read ? "text-slate-400" : "text-white"
                      }`}
                      title={notif.title || notif.type}
                    >
                      {notif.title || notif.type}
                    </span>
                    <button
                      type="button"
                      className="ml-2 text-slate-400 hover:text-slate-200"
                      aria-label="Quitar notificacion"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (selectedId === notif.id) {
                          setSelectedId(null);
                        }
                        removeNotification(notif.id);
                      }}
                    >
                      ×
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-start items-stretch p-6 md:p-10 bg-slate-800 relative min-h-[420px]">
          {selectedNotif ? (
            <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
              <div className="text-2xl font-bold mb-4 text-white break-words">
                {selectedNotif.title || selectedNotif.type}
              </div>
              <div className="flex-1 text-lg text-slate-200 mb-6 whitespace-pre-line break-words">
                {selectedNotif.content || selectedNotif.description || ""}
              </div>
              <div className="mt-auto">
                {selectedNotif.read ? (
                  <span className="text-xs text-slate-400">Leido</span>
                ) : (
                  <span className="text-xs text-red-500 font-semibold">
                    No leido
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="text-2xl font-bold text-slate-200 mb-2">
                No hay notificacion seleccionada
              </div>
              <div className="text-slate-400">
                Selecciona una notificacion del listado para ver el detalle.
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationsModal;
