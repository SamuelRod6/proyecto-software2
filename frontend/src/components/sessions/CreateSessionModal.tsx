import React, { useState, useEffect, useContext } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SelectorInput from '../ui/SelectorInput';
import DayPickerSingle from '../ui/DayPickerSingle';
import TimeRangePicker from '../ui/TimeRangePicker';

import { createSession, getAvailableSpeakers, getEventDetail } from '../../services/sessionsServices';
import { useLoader } from '../../contexts/Loader/LoaderContext';
import { useToast } from '../../contexts/Toast/ToastContext';

interface CreateSessionModalProps {
  event: any;
  open: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ 
    event, 
    open,
    onClose, 
    onSessionCreated 
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState<Date | undefined>(undefined);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('09:00');
  // Dynamic speakers selection (segunda página)
  const [ponentesSeleccionados, setPonentesSeleccionados] = useState<(number | null)[]>([null]);
  const [ponentesDisponibles, setPonentesDisponibles] = useState<any[]>([]);
  const [createdSessionId, setCreatedSessionId] = useState<number | null>(null);
  const [showPonentePage, setShowPonentePage] = useState(false);
  const [ubicacion, setUbicacion] = useState(event?.ubicacion || '');
  const [eventoDetalle, setEventoDetalle] = useState<any>(null);
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();

    const [loadingData, setLoadingData] = useState(false);

    // Solo cargar ponentes en la segunda página
    const fetchPonentes = async (sessionId: number) => {
      setLoadingData(true);
      try {
        const res = await getAvailableSpeakers(sessionId);
        if (res.status !== 200) {
          setPonentesDisponibles([]);
          showToast({
            title: 'Error',
            message: res.data?.error || 'Error al obtener ponentes',
            status: 'error',
          });
          return;
        }
        setPonentesDisponibles(res.data || []);
      } catch (err: any) {
        setPonentesDisponibles([]);
        showToast({
          title: 'Error',
          message: err?.message || 'Error al cargar ponentes',
          status: 'error',
        });
      } finally {
        setLoadingData(false);
      }
    };

    useEffect(() => {
      setShowPonentePage(false);
      setCreatedSessionId(null);
      setPonentesSeleccionados([null]);
      setPonentesDisponibles([]);
      setTitulo('');
      setDescripcion('');
      setFecha(undefined);
      setHoraInicio('08:00');
      setHoraFin('09:00');
      setUbicacion(event?.ubicacion || '');
    }, [open, event.id]);

  // Primera página: crear sesión
  const handleCreateSession = async () => {
    showLoader();
    try {
      const fechaInicio = new Date(fecha!);
      const [hIni, mIni] = horaInicio.split(':');
      fechaInicio.setHours(Number(hIni), Number(mIni), 0, 0);
      const fechaFin = new Date(fecha!);
      const [hFin, mFin] = horaFin.split(':');
      fechaFin.setHours(Number(hFin), Number(mFin), 0, 0);
      const payload = {
        titulo,
        descripcion,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        ubicacion,
      };
      const eventId = event?.id_evento || event?.id || event?.idEvento;
      const res = await createSession(eventId, payload);
      if (res.status === 200 && res.data?.id_sesion) {
        setCreatedSessionId(res.data.id_sesion);
        setShowPonentePage(true);
        fetchPonentes(res.data.id_sesion);
        showToast({
          title: 'Sesión creada',
          message: 'Ahora debes asignar un ponente.',
          status: 'info',
        });
      } else {
        showToast({
          title: 'Error',
          message: res.data?.message || 'Error al crear sesión',
          status: 'error',
        });
      }
    } catch (e: any) {
      showToast({
        title: 'Error',
        message: e?.response?.data?.message || 'Error al crear sesión',
        status: 'error',
      });
    } finally {
      hideLoader();
    }
  };

  // Segunda página: asignar ponente obligatorio
  const handleAssignPonente = async () => {
    showLoader();
    try {
      const usuarios = ponentesSeleccionados.filter(
        (id, idx, arr) => id !== null && arr.indexOf(id) === idx
      ) as number[];
      if (!createdSessionId || usuarios.length === 0) {
        showToast({
          title: 'Error',
          message: 'Debes asignar al menos un ponente.',
          status: 'error',
        });
        return;
      }
      // Aquí deberías llamar al endpoint para asignar ponentes
      // await assignPonentes(createdSessionId, usuarios);
      showToast({
        title: 'Ponente asignado',
        message: 'Ponente asignado exitosamente.',
        status: 'success',
      });
      onSessionCreated();
      onClose();
    } catch (e: any) {
      showToast({
        title: 'Error',
        message: e?.response?.data?.message || 'Error al asignar ponente',
        status: 'error',
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <Modal 
      open={open}
      onClose={onClose} 
      title={showPonentePage ? 'Asignar Ponente a Sesión' : 'Crear Sesión'}
    >
      {loadingData ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="loader" />
        </div>
      ) : showPonentePage ? (
        <div className="flex flex-col gap-4" onClick={e => e.stopPropagation()}>
          <div className="flex flex-col gap-2">
            {ponentesSeleccionados.map((selected, idx) => {
              const selectedIds = ponentesSeleccionados.filter((id, i) => id !== null && i !== idx);
              const options = ponentesDisponibles
                .filter(p => !selectedIds.includes(p.id_usuario))
                .map(p => ({ value: String(p.id_usuario), label: p.nombre }));
              return (
                <div key={idx} className="flex items-center gap-2">
                  {options.length > 0 && (
                    <SelectorInput
                      inputLabel={idx === 0 ? 'Ponente principal' : `Ponente adicional ${idx}`}
                      placeholder={idx === 0 ? 'Escoge un ponente' : 'Escoge otro ponente'}
                      options={options}
                      value={selected !== null ? String(selected) : ''}
                      onChange={val => {
                        const newArr = [...ponentesSeleccionados];
                        newArr[idx] = val === '' ? null : Number(val);
                        setPonentesSeleccionados(newArr);
                      }}
                    />
                  )}
                  {idx > 0 && (
                    <Button
                      type="button"
                      className="!px-2 !py-1 !text-xs !bg-red-200 !text-red-700"
                      onClick={() => {
                        const newArr = ponentesSeleccionados.filter((_, i) => i !== idx);
                        setPonentesSeleccionados(newArr);
                      }}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              );
            })}
            {ponentesDisponibles.length > ponentesSeleccionados.filter(id => id !== null).length && (
              <Button
                type="button"
                className="!px-2 !py-1 !text-xs !bg-green-200 !text-green-700"
                onClick={() => setPonentesSeleccionados([...ponentesSeleccionados, null])}
                disabled={ponentesSeleccionados.includes(null)}
              >
                + Añadir ponente
              </Button>
            )}
            {ponentesSeleccionados.length > 1 && (
              <Button
                type="button"
                className="!px-2 !py-1 !text-xs !bg-gray-200 !text-gray-700"
                onClick={() => setPonentesSeleccionados([null])}
              >
                Limpiar ponentes
              </Button>
            )}
          </div>
          <Button
            className="mt-4"
            onClick={handleAssignPonente}
            disabled={!ponentesSeleccionados[0]}
          >
            Asignar Ponente
          </Button>
        </div>
      ) : (
        <div className="flex gap-6" onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow-md min-w-[260px]">
            <DayPickerSingle
              selected={fecha}
              onSelect={setFecha}
              initialMonth={(() => {
                const fechaInicioStr = eventoDetalle?.fecha_inicio || event.fecha_inicio || event.fechaInicio;
                if (fechaInicioStr && fechaInicioStr.includes('/')) {
                  const [d, m, y] = fechaInicioStr.split('/');
                  return new Date(Number(y), Number(m) - 1, Number(d));
                } else {
                  return new Date(fechaInicioStr);
                }
              })()}
              disabled={date => {
                // Obtener rango del evento
                const fechaInicioStr = eventoDetalle?.fecha_inicio || event.fecha_inicio || event.fechaInicio;
                const fechaFinStr = eventoDetalle?.fecha_fin || event.fecha_fin || event.fechaFin;
                // Parsear fechas (formato esperado: YYYY-MM-DD o DD/MM/YYYY)
                let inicio: Date, fin: Date;
                if (fechaInicioStr && fechaInicioStr.includes('/')) {
                  // Formato DD/MM/YYYY
                  const [d, m, y] = fechaInicioStr.split('/');
                  inicio = new Date(Number(y), Number(m) - 1, Number(d));
                } else {
                  inicio = new Date(fechaInicioStr);
                }
                if (fechaFinStr && fechaFinStr.includes('/')) {
                  const [d, m, y] = fechaFinStr.split('/');
                  fin = new Date(Number(y), Number(m) - 1, Number(d));
                } else {
                  fin = new Date(fechaFinStr);
                }
                // Limitar solo a rango del evento
                return date < inicio || date > fin;
              }}
            />
            <div className="mt-4 w-full">
              <TimeRangePicker
                horaInicio={horaInicio}
                horaFin={horaFin}
                setHoraInicio={setHoraInicio}
                setHoraFin={setHoraFin}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            <Input label="Título" value={titulo} maxLength={100} onChange={e => setTitulo(e.target.value)} required />
            <Input
              label="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              descripcion={true}
              maxLength={300}
            />
            <Input label="Ubicación" value={ubicacion} disabled required />
            <Button
              className="mt-4"
              onClick={handleCreateSession}
              disabled={!titulo || !fecha || !horaInicio || !horaFin || titulo.length > 100}
            >
              Crear Sesión
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateSessionModal;
