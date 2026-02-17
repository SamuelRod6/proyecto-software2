import React, { useState, useContext } from 'react';
import Button from '../../components/ui/Button';
import DateRangePicker from '../../components/ui/DateRangePicker';
import BackArrow from '../../components/ui/BackArrow';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
// Loader y Toast hooks
import { useLoader } from '../../contexts/Loader/LoaderContext';
import { useToast } from '../../contexts/Toast/ToastContext';

import { NotificationContext } from '../../contexts/Notifications/NotificationContext';


const NotificationListScreen: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useContext(NotificationContext);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  React.useEffect(() => {
    hideLoader();
    // Si hubiera error:
    // showToast('error', 'Error al cargar notificaciones');
    // eslint-disable-next-line
  }, []); // Solo al montar

  const selectedNotif = notifications.find(n => n.id === selectedId);

  return (
    <div className="mx-auto mt-8 flex rounded-lg border border-slate-800 bg-slate-900 shadow-lg overflow-hidden w-full max-w-4xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl" style={{ minHeight: '350px' }}>
      {/* Listado izquierdo */}
      <div className="w-1/3 min-w-[180px] max-w-[260px] border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
          <BackArrow onClick={() => {
            setSelectedId(null); // Opcional: limpia selección
            navigate('/', { replace: true });
          }} className="mr-2" />
          <h2 className="text-lg font-bold text-slate-200">Notificaciones</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              className={`w-full text-left px-4 py-3 border-b border-slate-800 flex items-center gap-2 transition-colors focus:outline-none ${selectedId === notif.id ? 'bg-slate-800' : 'bg-slate-900'}`}
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
              {/* Indicador de no leído */}
              {!notif.read && <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />}
              <span className={`font-semibold ${notif.read ? 'text-slate-400' : 'text-white'}`}>{notif.title}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Panel derecho */}
      <div className="flex-1 flex flex-col justify-start items-stretch p-4 md:p-8 bg-slate-800 relative min-h-[350px]">
        {selectedNotif ? (
          <div className="w-full max-w-lg">
            {selectedNotif.type === 'event-date-update' ? (
              <>
                <div className="text-xl font-bold mb-2 text-white">{selectedNotif.title}</div>
                <div className="text-base text-slate-200 mb-1">{selectedNotif.description}</div>
                <div className="text-sm text-slate-400 mb-2">Evento: <span className="font-semibold text-slate-200">{selectedNotif.eventName}</span></div>
                <div className="mb-4 flex flex-col">
                  <div className="font-semibold text-slate-300 mb-4 text-left">Nuevas fechas:</div>
                <div className="flex">
                    <div className="bg-white rounded-lg px-6 py-4 shadow ml-auto">
                      <DateRangePicker
                        value={{
                          from: selectedNotif.newDates?.[0]?.date ? new Date(selectedNotif.newDates[0].date) : undefined,
                          to: selectedNotif.newDates?.[1]?.date ? new Date(selectedNotif.newDates[1].date) : undefined
                        }}
                        onChange={() => {}}
                        fromLabel="Inicio"
                        toLabel="Fin"
                        className=""
                        dayPickerProps={{
                          mode: 'range',
                          selected: {
                            from: selectedNotif.newDates?.[0]?.date ? new Date(selectedNotif.newDates[0].date) : undefined,
                            to: selectedNotif.newDates?.[1]?.date ? new Date(selectedNotif.newDates[1].date) : undefined
                          },
                          month: selectedNotif.newDates?.[0]?.date ? new Date(selectedNotif.newDates[0].date) : undefined
                         }}
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-6 right-6">
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Navegar a eventos y abrir el evento correspondiente
                      // Aquí puedes usar navigate(`/eventos/${selectedNotif.eventId}`) o lógica similar
                    }}
                  >
                    Abrir evento
                  </Button>
                </div>
                <div className="mt-4">
                  {selectedNotif.read ? (
                    <span className="text-xs text-slate-400">Leído</span>
                  ) : (
                    <span className="text-xs text-red-500 font-semibold">No leído</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold mb-2 text-white">{selectedNotif.title}</div>
                <div className="text-base text-slate-200 mb-4">{selectedNotif.content}</div>
                {selectedNotif.read ? (
                  <span className="text-xs text-slate-400">Leído</span>
                ) : (
                  <span className="text-xs text-red-500 font-semibold">No leído</span>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="text-2xl font-bold text-slate-200 mb-2">No hay notificación seleccionada</div>
            <div className="text-slate-400">Selecciona una notificación del listado para ver el detalle.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationListScreen;
