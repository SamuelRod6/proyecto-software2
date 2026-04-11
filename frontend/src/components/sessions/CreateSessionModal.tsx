/*
File: CreateSessionModal.tsx

Contains:
Two-step modal to create a session and assign at least one speaker.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import React, { useState, useEffect, useContext } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SelectorInput from '../ui/SelectorInput';
import DayPickerSingle from '../ui/DayPickerSingle';
import TimeRangePicker from '../ui/TimeRangePicker';

import { createSession, getAvailableSpeakers, getEventDetail, assignSpeakersToSession, AvailableSpeaker } from '../../services/sessionsServices';
import { useToast } from '../../contexts/Toast/ToastContext';

interface CreateSessionModalProps {
  event: any;
  open: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
}

// CreateSessionModal orchestrates session creation and mandatory speaker assignment.
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
  const [ponentesDisponibles, setPonentesDisponibles] = useState<AvailableSpeaker[]>([]);
  const [createdSessionId, setCreatedSessionId] = useState<number | null>(null);
  const [showPonentePage, setShowPonentePage] = useState(false);
  const [ubicacion, setUbicacion] = useState(event?.ubicacion || '');
  const [eventoDetalle, setEventoDetalle] = useState<any>(null);
  const { showToast } = useToast();
  const [creatingSession, setCreatingSession] = useState(false);
  const [assigningSpeaker, setAssigningSpeaker] = useState(false);
  const [loadingSpeakers, setLoadingSpeakers] = useState(false);

    // fetchPonentes loads available speakers after the session is created.
    const fetchPonentes = async (sessionId: number) => {
      setLoadingSpeakers(true);
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
        setPonentesDisponibles(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setPonentesDisponibles([]);
        showToast({
          title: 'Error',
          message: err?.message || 'Error al cargar ponentes',
          status: 'error',
        });
      } finally {
        setLoadingSpeakers(false);
      }
    };

    const [errors, setErrors] = useState<{
      titulo?: string;
      fechaHora?: string;
      general?: string;
    }>({});

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
      setErrors({});
    }, [open, event.id]);

  // buildDateTime combines selected day and HH:mm input into a single Date.
  const buildDateTime = (baseDate: Date, timeHHmm: string) => {
    const [h, m] = timeHHmm.split(":").map(Number);
    const result = new Date(baseDate);
    result.setHours(h, m, 0, 0);
    return result;
  };

  // validateCreateForm enforces title and time-window constraints.
  const validateCreateForm = () => {
    const nextErrors: { titulo?: string; fechaHora?: string; general?: string } = {};

    const trimmedTitle = titulo.trim();
    if (!trimmedTitle) {
      nextErrors.titulo = "El título es obligatorio";
    } else if (trimmedTitle.length > 100) {
      nextErrors.titulo = "El título no puede exceder 100 caracteres";
    }

    if (!fecha) {
      nextErrors.fechaHora = "Debes seleccionar una fecha para la sesión";
    } else {
      const inicio = buildDateTime(fecha, horaInicio);
      const fin = buildDateTime(fecha, horaFin);
      const now = new Date();

      if (inicio <= now) {
        nextErrors.fechaHora = "La fecha/hora de inicio no puede estar en el pasado.";
      } else if (fin <= inicio) {
        nextErrors.fechaHora = "La hora de fin debe ser mayor que la hora de inicio.";
      } else {
        const duracionMs = fin.getTime() - inicio.getTime();
        const minMs = 30 * 60 * 1000;
        const maxMs = 4 * 60 * 60 * 1000;
        if (duracionMs < minMs || duracionMs > maxMs) {
          nextErrors.fechaHora = "La duración debe ser entre 30 minutos y 4 horas.";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // parseEventDate accepts display dates (DD/MM/YYYY) and ISO-like strings.
  const parseEventDate = (value?: string): Date | undefined => {
    if (!value) return undefined;

    // Soporta DD/MM/YYYY y DD/MM/YYYY HH:mm[:ss]
    if (value.includes('/')) {
      const [datePart] = value.split(' ');
      const [d, m, y] = datePart.split('/').map(Number);
      if (!d || !m || !y) return undefined;
      return new Date(y, m - 1, d);
    }

    // Fallback para ISO u otros formatos parseables por Date
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed;
  };

  const atStartOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // handleCreateSession submits step one and opens speaker assignment on success.
  const handleCreateSession = async () => {

    // Validar antes de enviar
    if (!validateCreateForm()) return;

    setCreatingSession(true);
    try {
      const fechaInicio = new Date(fecha!);
      const [hIni, mIni] = horaInicio.split(':');
      fechaInicio.setHours(Number(hIni), Number(mIni), 0, 0);
      const fechaFin = new Date(fecha!);
      const [hFin, mFin] = horaFin.split(':');
      fechaFin.setHours(Number(hFin), Number(mFin), 0, 0);
      // Formato local Venezuela: YYYY-MM-DDTHH:mm:ss-04:00
      // function toVenezuelaISOString(date: Date) {
      //   // Ajusta a UTC-4
      //   const offset = -4;
      //   const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      //   const pad = (n: number) => n.toString().padStart(2, '0');
      //   return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}-04:00`;
      // }
      // const payload = {
      //   titulo,
      //   descripcion,
      //   fecha_inicio: toVenezuelaISOString(fechaInicio),
      //   fecha_fin: toVenezuelaISOString(fechaFin),
      //   ubicacion,
      // };

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
        await fetchPonentes(res.data.id_sesion);
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
      setCreatingSession(false);
    }
  };

  // handleAssignPonente persists selected speakers and closes the modal flow.
  const handleAssignPonente = async () => {
    setAssigningSpeaker(true);
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

      const res = await assignSpeakersToSession(createdSessionId, usuarios);

      if (res.status !== 204 && res.status !== 200) {
        showToast({
          title: 'Error',
          message: res.data?.message || 'No se pudo asignar el/los ponente(s).',
          status: 'error',
        });
        return;
      }

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
      setAssigningSpeaker(false);
    }
  };

  return (
    <Modal 
      open={open}
      onClose={onClose} 
      title={showPonentePage ? 'Asignar Ponente a Sesión' : 'Crear Sesión'}
    >
      {showPonentePage ? (
        <div className="flex flex-col gap-4" onClick={e => e.stopPropagation()}>
          {loadingSpeakers && (
            <p className="text-sm text-slate-400">Cargando ponentes disponibles...</p>
          )}
          <div className="flex flex-col gap-2">
            {ponentesSeleccionados.map((selected, idx) => {
              const selectedIds = ponentesSeleccionados.filter((id, i) => id !== null && i !== idx);
              const options = ponentesDisponibles
                .filter(p => !selectedIds.includes(p.id_usuario))
                .map(p => ({ value: String(p.id_usuario), label: `${p.nombre} · ${p.email ?? "sin correo"}` }));
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <SelectorInput
                      inputLabel={idx === 0 ? 'Ponente principal' : `Ponente adicional ${idx}`}
                      placeholder={idx === 0 ? 'Escoge un ponente' : 'Escoge otro ponente'}
                      options={options}
                      value={selected !== null ? String(selected) : ''}
                      onChange={val => {
                        const selectedValue = Array.isArray(val) ? val[0] ?? '' : val;
                        const newArr = [...ponentesSeleccionados];
                        newArr[idx] = selectedValue === '' ? null : Number(selectedValue);
                        setPonentesSeleccionados(newArr);
                      }}
                    />
                    {options.length === 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        No hay ponentes disponibles para seleccionar en este momento.
                      </p>
                    )}
                  </div>
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
            loading={assigningSpeaker}
            loadingText="Asignando..."
          >
            Asignar Ponente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 items-start" onClick={e => e.stopPropagation()}>
          <div className="flex flex-col gap-4 min-w-[260px]">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow-md">
              <DayPickerSingle
                selected={fecha}
                onSelect={setFecha}
                initialMonth={(() => {
                  const fechaInicioStr = eventoDetalle?.fecha_inicio || event.fecha_inicio || event.fechaInicio;
                  const inicio = parseEventDate(fechaInicioStr);
                  return inicio || new Date();
                })()}
                disabled={date => {
                  // Obtener rango del evento
                  const fechaInicioStr = eventoDetalle?.fecha_inicio || event.fecha_inicio || event.fechaInicio;
                  const fechaFinStr = eventoDetalle?.fecha_fin || event.fecha_fin || event.fechaFin;

                  const inicio = parseEventDate(fechaInicioStr);
                  const fin = parseEventDate(fechaFinStr);

                  // Si no se pueden parsear las fechas, no bloquear para evitar falso positivo.
                  if (!inicio || !fin) return false;

                  const day = atStartOfDay(date);
                  const inicioDay = atStartOfDay(inicio);
                  const finDay = atStartOfDay(fin);

                  // Limitar solo a rango del evento
                  return day < inicioDay || day > finDay;
                }}
              />
            </div>
            <div className="rounded-lg border border-slate-700 p-4">
              <TimeRangePicker
                horaInicio={horaInicio}
                horaFin={horaFin}
                setHoraInicio={setHoraInicio}
                setHoraFin={setHoraFin}
              />
              {errors.fechaHora && (
                <p className="text-xs text-red-300 mt-2">{errors.fechaHora}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 flex-1 self-stretch md:min-h-[520px]">
            <div className="flex flex-col gap-4">
            <Input 
              label="Título"
              value={titulo}
              maxLength={100}
              onChange={e => {
                setTitulo(e.target.value);
                if (errors.titulo) setErrors(prev => ({ ...prev, titulo: undefined }));
              }}
              error={errors.titulo} 
              required 
            />
            <Input
              label="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              descripcion={true}
              maxLength={300}
            />
            <Input label="Ubicación" value={ubicacion} disabled required />
            </div>
            <Button
              className="mt-auto self-center w-full md:w-56"
              onClick={handleCreateSession}
              disabled={!titulo || !fecha || !horaInicio || !horaFin || titulo.length > 100}
              loading={creatingSession}
              loadingText="Creando..."
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
