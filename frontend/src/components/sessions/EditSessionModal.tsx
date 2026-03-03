import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SelectorInput from '../ui/SelectorInput';
import DayPickerSingle from '../ui/DayPickerSingle';
import TimeRangePicker from '../ui/TimeRangePicker';
import { useLoader } from '../../contexts/Loader/LoaderContext';
import { useToast } from '../../contexts/Toast/ToastContext';
import { getAvailableSpeakers } from '../../services/sessionsServices';

interface EditSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: any;
  event: any;
  onSessionUpdated: () => void;
}

const EditSessionModal: React.FC<EditSessionModalProps> = ({ open, onClose, session, event, onSessionUpdated }) => {
  const [titulo, setTitulo] = useState(session.titulo || '');
  const [descripcion, setDescripcion] = useState(session.descripcion || '');
  const [fecha, setFecha] = useState<Date | undefined>(session.fecha_inicio ? new Date(session.fecha_inicio) : undefined);
  const [horaInicio, setHoraInicio] = useState(session.fecha_inicio ? session.fecha_inicio.substring(11, 16) : '08:00');
  const [horaFin, setHoraFin] = useState(session.fecha_fin ? session.fecha_fin.substring(11, 16) : '09:00');
  const [ubicacion, setUbicacion] = useState(session.ubicacion || event?.ubicacion || '');
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setTitulo(session.titulo || '');
      setDescripcion(session.descripcion || '');
      setFecha(session.fecha_inicio ? new Date(session.fecha_inicio) : undefined);
      setHoraInicio(session.fecha_inicio ? session.fecha_inicio.substring(11, 16) : '08:00');
      setHoraFin(session.fecha_fin ? session.fecha_fin.substring(11, 16) : '09:00');
      setUbicacion(session.ubicacion || event?.ubicacion || '');
    }
  }, [open, session, event]);

  const handleUpdateSession = async () => {
    // TODO: Implement update session logic
    showToast({
      title: 'Sesión actualizada',
      message: 'La sesión ha sido actualizada exitosamente.',
      status: 'success',
    });
    onSessionUpdated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar Sesión">
      <div className="flex gap-6" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow-md min-w-[260px]">
          <DayPickerSingle
            selected={fecha}
            onSelect={setFecha}
            initialMonth={fecha}
            disabled={date => {
              // Limitar solo a rango del evento
              const inicio = new Date(event.fecha_inicio);
              const fin = new Date(event.fecha_fin);
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
            onClick={handleUpdateSession}
            disabled={!titulo || !fecha || !horaInicio || !horaFin || titulo.length > 100}
          >
            Actualizar Sesión
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditSessionModal;
