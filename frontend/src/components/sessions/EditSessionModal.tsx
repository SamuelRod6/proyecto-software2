/*
File: EditSessionModal.tsx

Contains:
Modal form to update session details and synchronize assigned speakers.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SelectorInput from '../ui/SelectorInput';
import DayPickerSingle from '../ui/DayPickerSingle';
import TimeRangePicker from '../ui/TimeRangePicker';
import { useToast } from '../../contexts/Toast/ToastContext';
import {updateSession, assignSpeakersToSession, removeSpeakerFromSession, getAvailableSpeakers } from '../../services/sessionsServices';

const parseSpeakerId = (value: any): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeSpeaker = (speaker: any) => {
  const id = parseSpeakerId(
    speaker?.id_usuario ?? speaker?.idUsuario ?? speaker?.id ?? speaker?.usuario_id ?? speaker?.usuarioId,
  );
  if (!id) return null;
  return {
    id_usuario: id,
    nombre: speaker?.nombre ?? speaker?.name ?? `Usuario ${id}`,
    email: speaker?.email,
  };
};

interface EditSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: any;
  event: any;
  onSessionUpdated: () => void;
}

// parseDisplayDateTime parses either display format or ISO-like datetime values.
const parseDisplayDateTime = (value: string): Date => {
  if (!value) return new Date(NaN);
  if (!value.includes('/')) return new Date(value);
  const [datePart, timePart = '00:00'] = value.split(' ');
  const [d, m, y] = datePart.split('/').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
};

// parseEventDate parses event boundaries used by the day picker.
const parseEventDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  if (value.includes('/')) {
    const [datePart] = value.split(' ');
    const [d, m, y] = datePart.split('/').map(Number);
    if (!d || !m || !y) return undefined;
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const atStartOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// getHHmm extracts a HH:mm string from stored datetime values.
const getHHmm = (value?: string): string => {
  if (!value) return '08:00';
  const date = parseDisplayDateTime(value);
  if (Number.isNaN(date.getTime())) return '08:00';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const buildSessionSignature = (params: {
  titulo: string;
  descripcion: string;
  fecha?: Date;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  speakerIds: number[];
}): string => {
  const { titulo, descripcion, fecha, horaInicio, horaFin, ubicacion, speakerIds } = params;
  const normalizedDate = fecha
    ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    : '';
  const normalizedSpeakers = [...speakerIds].sort((a, b) => a - b).join(',');
  return [titulo.trim(), descripcion.trim(), normalizedDate, horaInicio, horaFin, ubicacion.trim(), normalizedSpeakers].join('|');
};

// EditSessionModal edits session metadata and reconciles speaker assignments.
const EditSessionModal: React.FC<EditSessionModalProps> = ({ open, onClose, session, event, onSessionUpdated }) => {
  const [titulo, setTitulo] = useState(session.titulo || '');
  const [descripcion, setDescripcion] = useState(session.descripcion || '');
  const [fecha, setFecha] = useState<Date | undefined>(session.fecha_inicio ? parseDisplayDateTime(session.fecha_inicio) : undefined);
  const [horaInicio, setHoraInicio] = useState(getHHmm(session.fecha_inicio));
  const [horaFin, setHoraFin] = useState(session.fecha_fin ? getHHmm(session.fecha_fin) : '09:00');
  const [ubicacion, setUbicacion] = useState(session.ubicacion || event?.ubicacion || '');
  const [ponentesDisponibles, setPonentesDisponibles] = useState<any[]>([]);
  const [ponentesSeleccionados, setPonentesSeleccionados] = useState<(number | null)[]> ([null]);
  const [initialSpeakerIds, setIintialSpeakerIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialSignature, setInitialSignature] = useState('');
  const [errors, setErrors] = useState<{titulo?: string; fechaHora?: string; ponentes?: string;}>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setTitulo(session.titulo || '');
      setDescripcion(session.descripcion || '');
      setFecha(session.fecha_inicio ? parseDisplayDateTime(session.fecha_inicio) : undefined);
      setHoraInicio(getHHmm(session.fecha_inicio));
      setHoraFin(session.fecha_fin ? getHHmm(session.fecha_fin) : '09:00');
      setUbicacion(session.ubicacion || event?.ubicacion || '');

      const currentIds: number[] = Array.isArray(session.ponentes)
        ? session.ponentes
            .map((p: any) => parseSpeakerId(p?.id_usuario ?? p?.idUsuario ?? p?.id))
            .filter((id: number | null): id is number => id !== null)
        : [];
      
      setIintialSpeakerIds(currentIds);
      setPonentesSeleccionados(currentIds.length > 0 ? currentIds : [null]);
      setInitialSignature(
        buildSessionSignature({
          titulo: session.titulo || '',
          descripcion: session.descripcion || '',
          fecha: session.fecha_inicio ? parseDisplayDateTime(session.fecha_inicio) : undefined,
          horaInicio: getHHmm(session.fecha_inicio),
          horaFin: session.fecha_fin ? getHHmm(session.fecha_fin) : '09:00',
          ubicacion: session.ubicacion || event?.ubicacion || '',
          speakerIds: currentIds,
        }),
      );

      (async () => {
        const res = await getAvailableSpeakers(session.id_sesion);
        const disponibles = res.status === 200 && Array.isArray(res.data) ? res.data : [];

        // Incluye los ya asignados para poder mantener/agregar correctamente
        const asignadosActuales = Array.isArray(session.ponentes)
          ? session.ponentes
              .map((p: any) => normalizeSpeaker(p))
              .filter((p: any) => p !== null)
          : [];
        const merged = [...disponibles];

        asignadosActuales.forEach((p: any) => {
          if (!merged.some((m: any) => m.id_usuario === p.id_usuario)) merged.push(p);
        });

        setPonentesDisponibles(merged);
      })();
    }

    setErrors({});

  }, [open, session, event]);

  // validateEditForm ensures required fields are valid before update.
  const validateEditForm = () => {
    const next: { titulo?: string; fechaHora?: string; ponentes?: string } = {};

    const t = titulo.trim();
    if (!t) next.titulo = 'El título es obligatorio.';
    if (t.length > 100) next.titulo = 'El título no puede exceder 100 caracteres.';

    if (!fecha) {
      next.fechaHora = 'Debe seleccionar fecha.';
    } else {
      const [hIni, mIni] = horaInicio.split(':').map(Number);
      const [hFin, mFin] = horaFin.split(':').map(Number);

      const ini = new Date(fecha);
      ini.setHours(hIni, mIni, 0, 0);

      const fin = new Date(fecha);
      fin.setHours(hFin, mFin, 0, 0);

      if (fin <= ini) next.fechaHora = 'La hora fin debe ser mayor que la hora inicio.';
    }

    const finalSpeakerIds = ponentesSeleccionados.filter((v, i, arr) => v !== null && arr.indexOf(v) === i) as number[];

    if (finalSpeakerIds.length === 0) next.ponentes = 'Debe dejar al menos un ponente asignado.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // handleUpdateSession updates session data, adds new speakers, and removes unselected ones.
  const handleUpdateSession = async () => {
    
    if (!validateEditForm()) return;

    setSaving(true);
    try {
      const [hIni, mIni] = horaInicio.split(':').map(Number);
      const [hFin, mFin] = horaFin.split(':').map(Number);

      const ini = new Date(fecha!);
      ini.setHours(hIni, mIni, 0, 0);

      const fin = new Date(fecha!);
      fin.setHours(hFin, mFin, 0, 0);

      const payload = {
        titulo: titulo.trim(),
        descripcion,
        fecha_inicio: ini.toISOString(),
        fecha_fin: fin.toISOString(),
        ubicacion,
      };

      const updateRes = await updateSession(session.id_sesion, payload);
      if (updateRes.status !== 200) {
        showToast({
          title: 'Error',
          message: updateRes.data?.message || 'No se pudo actualizar la sesión',
          status: 'error',
        });
        return;
      }

      const finalSpeakerIds = ponentesSeleccionados.filter((v, i, arr) => v !== null && arr.indexOf(v) === i) as number[];
      const toAdd = finalSpeakerIds.filter((id) => !initialSpeakerIds.includes(id));
      const toRemove = initialSpeakerIds.filter((id) => !finalSpeakerIds.includes(id));

      if (toAdd.length > 0) {
        const addRes = await assignSpeakersToSession(session.id_sesion, toAdd);
        if (addRes.status !== 204 && addRes.status !== 200) {
          showToast({
            title: 'Error',
            message: addRes.data?.message || 'No se pudieron agregar ponentes.',
            status: 'error',
          });
          return;
        }
      }

      for (const userId of toRemove) {
        const rmRes = await removeSpeakerFromSession(session.id_sesion, userId);
        if (rmRes.status !== 204 && rmRes.status !== 200) {
          showToast ({
            title: 'Error',
            message: rmRes.data?.message || 'No se pudo quitar un ponente',
            status: 'error'
          });
          return;
        }
      }

      showToast({
        title: 'Sesión actualizada',
        message: 'La sesión ha sido actualizada exitosamente.',
        status: 'success',
      });

      onSessionUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedSpeakerIds = ponentesSeleccionados.filter((id): id is number => id !== null);
  const currentSignature = buildSessionSignature({
    titulo,
    descripcion,
    fecha,
    horaInicio,
    horaFin,
    ubicacion,
    speakerIds: selectedSpeakerIds,
  });
  const hasChanges = currentSignature !== initialSignature;

  return (
    <Modal open={open} onClose={onClose} title="Editar Sesión">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 items-center" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col gap-4 min-w-[260px]">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow-md">
            <DayPickerSingle
              selected={fecha}
              onSelect={setFecha}
              initialMonth={fecha}
              disabled={date => {
                // Limitar solo a rango del evento
                const inicio = parseEventDate(event.fecha_inicio);
                const fin = parseEventDate(event.fecha_fin);
                if (!inicio || !fin) return false;

                const day = atStartOfDay(date);
                const inicioDay = atStartOfDay(inicio);
                const finDay = atStartOfDay(fin);

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
        <div className="flex flex-col gap-4 flex-1 justify-center md:min-h-[520px]">
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
          <div className="rounded-lg border border-slate-700 p-4">
            <p className="text-slate-300 font-medium mb-2">Ponentes asignados</p>

            {ponentesSeleccionados.map((selected, idx) => {
              const selectedIds = ponentesSeleccionados.filter((id, i) => id !== null && i !== idx);
              const options = ponentesDisponibles
                .filter((p: any) => !selectedIds.includes(p.id_usuario))
                .map((p: any) => ({
                  value: String(p.id_usuario),
                  label: `${p.nombre} · ${p.email ?? 'sin correo'}`,
                }));

              return (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <SelectorInput
                    inputLabel={idx === 0 ? 'Ponente principal' : `Ponente adicional ${idx}`}
                    options={options}
                    value={selected !== null ? String(selected) : ''}
                    onChange={(val: string | string[]) => {
                      const selectedValue = Array.isArray(val) ? val[0] ?? '' : val;
                      const arr = [...ponentesSeleccionados];
                      arr[idx] = selectedValue === '' ? null : Number(selectedValue);
                      setPonentesSeleccionados(arr);
                    }}
                    placeholder="Selecciona un ponente"
                  />
                  {idx > 0 && (
                    <Button
                      type="button"
                      className="!px-2 !py-1 !text-xs !bg-red-200 !text-red-700"
                      onClick={() => setPonentesSeleccionados(ponentesSeleccionados.filter((_, i) => i !== idx))}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              );
            })}

            <Button
              type="button"
              className="!px-2 !py-1 !text-xs !bg-green-200 !text-green-700 mt-1"
              onClick={() => setPonentesSeleccionados([...ponentesSeleccionados, null])}
              disabled={ponentesSeleccionados.includes(null)}
            >
              + Añadir ponente
            </Button>

            {errors.ponentes && <p className="text-xs text-red-300 mt-2">{errors.ponentes}</p>}
          </div>
          <Input label="Ubicación" value={ubicacion} disabled required />
          <Button
            className="mt-4"
            onClick={handleUpdateSession}
            disabled={!titulo || !fecha || !horaInicio || !horaFin || titulo.length > 100 || !hasChanges}
            loading={saving}
            loadingText="Actualizando..."
          >
            Actualizar Sesión
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditSessionModal;
