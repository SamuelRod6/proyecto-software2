import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import DayPickerSingle from "../ui/DayPickerSingle";
import BackArrow from "../ui/BackArrow";
import { useLoader } from "../../contexts/Loader/LoaderContext";
import { useToast } from "../../contexts/Toast/ToastContext";
import { useModal } from "../../contexts/Modal/ModalContext";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";
import DateRangePicker from "../ui/DateRangePicker";
import SelectInput from "../ui/SelectorInput";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Evento, patchEvent, fetchFechasOcupadas, RangoFechasApi } from "../../services/eventsServices";
import { venezuelaCities } from "../../constants/venezuelaCities";
import { getEventDetail } from "../../services/sessionsServices";
import EditSessionModal from "../sessions/EditSessionModal";
import SessionList from "../sessions/SessionList";

interface EditEventModalProps {
  open: boolean;
  onClose: () => void;
  event: Evento;
  onUpdate?: () => void;
}

export default function EditEventModal({ open, onClose, event, onUpdate }: EditEventModalProps): JSX.Element {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<any | null>(null);
    const [showEditSessionModal, setShowEditSessionModal] = useState(false);
    // Cargar sesiones del evento cuando se abre el modal o cambia el evento
    useEffect(() => {
      if (open && event?.id_evento) {
        getEventDetail(event.id_evento).then(({ status, data }) => {
          if (status === 200 && data && Array.isArray(data.sesiones)) {
            setSessions(data.sesiones);
          } else {
            setSessions([]);
          }
        });
      }
    }, [open, event]);
  const { dispatch: modalDispatch } = useModal();
  const navigate = useNavigate();
  const [name, setName] = useState(event.nombre);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: parseDate(event.fecha_inicio),
    to: parseDate(event.fecha_fin)
  });
  const [country, setCountry] = useState(event.ubicacion.split(", ")[1] || "");
  const [city, setCity] = useState(event.ubicacion.split(", ")[0] || "");
  const [page2, setPage2] = useState(false);
  const [closeDate, setCloseDate] = useState(parseDate(event.fecha_cierre_inscripcion));
  const [disabledRanges, setDisabledRanges] = useState<{ from: Date; to: Date }[]>([]);
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFechasOcupadas().then(({ status, data }) => {
        if (status === 200 && Array.isArray(data)) {
          setDisabledRanges(
            data.map((r: RangoFechasApi) => ({
              from: parseDate(r.fecha_inicio),
              to: parseDate(r.fecha_fin),
            }))
          );
        } else {
          setDisabledRanges([]);
        }
      });
    }
  }, [open]);

  function parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  function formatDateWithTime(d: Date, hour: number, minute: number): string {
    const date = new Date(d);
    date.setHours(hour, minute, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  function getEventPayload() {
    if (!name || !dateRange || !dateRange.from || !dateRange.to || !country || !city || !closeDate) {
      return null;
    }
    return {
      id_evento: event.id_evento,
      nombre: name,
      fecha_inicio: formatDateWithTime(dateRange.from, 0, 0),
      fecha_fin: formatDateWithTime(dateRange.to, 23, 59),
      ubicacion: `${city}, ${country}`,
      fecha_cierre_inscripcion: formatDateWithTime(closeDate, 23, 59),
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoader();
    try {
      const payload = getEventPayload();
      if (!payload) {
        showToast({
          title: "Error al actualizar evento",
          message: "Faltan datos obligatorios.",
          status: "error",
        });
        return;
      }
      const { status, data } = await patchEvent(event.id_evento, payload);
      if (status === 200 && data) {
        showToast({
          title: "Evento actualizado",
          message: "El evento ha sido actualizado exitosamente.",
          status: "success",
        });
        if (onUpdate) onUpdate();
        modalDispatch({ type: 'CLOSE_MODAL' });
        navigate('/events');
      } else {
        showToast({
          title: "Error al actualizar evento",
          message: data?.message || "No se pudo actualizar el evento.",
          status: "error",
        });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "El evento no pudo ser actualizado, ocurrió un error inesperado.";
      showToast({
        title: "Error al actualizar evento",
        message: msg,
        status: "error",
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar evento" className="max-w-screen-lg w-full">
      <form 
        className="rounded-xl border border-slate-700 bg-slate-800/90 p-10 max-w-[900px] w-full mx-auto shadow-lg"
      >
        {!page2 ? (
          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            <div className="flex-1 flex flex-col justify-center items-center">
              <label className="block mb-2 text-slate-300 font-medium text-lg">
                Fechas del evento
              </label>
              <div className="w-full bg-[#e3e8f0] rounded-xl p-5 flex items-center justify-center">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  fromLabel="Inicio"
                  toLabel="Fin"
                  className="bg-[#e3e8f0] rounded p-2"
                  disabledRanges={disabledRanges}
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-6 justify-center">
              <div>
                <label className="block mb-1 text-slate-300 font-medium">
                  Nombre del evento
                </label>
                <Input
                  type="text"
                  placeholder="Ej: Expo de galaxias"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-[380px] max-w-full"
                />
              </div>
              <div>
                <SelectInput
                  value={country}
                  onChange={setCountry}
                  options={[{ value: "Venezuela", label: "Venezuela" }]}
                  inputLabel="País"
                  placeholder="Selecciona el país"
                  className="mt-2 w-[380px] max-w-full"
                  allowCustom={false}
                />
                {country === "Venezuela" && (
                  <SelectInput
                    value={city}
                    onChange={setCity}
                    options={venezuelaCities.map(city => ({ value: city, label: city }))}
                    inputLabel="Ciudad"
                    placeholder="Selecciona o escribe la ciudad"
                    className="mt-2 w-[380px] max-w-full"
                    allowCustom={true}
                    customPlaceholder="Escribe la ciudad..."
                  />
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!name || !dateRange || !dateRange.from || !dateRange.to || !country || !city}
                  onClick={() => setPage2(true)}
                >
                  Siguiente
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full border border-slate-600"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            <div className="flex-1 flex flex-col justify-center items-center">
              <label className="block mb-2 text-slate-300 font-medium text-lg">
                Fecha de cierre de inscripciones
              </label>
              <div className="w-full bg-[#e3e8f0] rounded-xl p-5 flex items-center justify-center">
                <DayPickerSingle
                  selected={closeDate}
                  onSelect={(date) => setCloseDate(date ?? new Date())}
                  className="bg-[#e3e8f0] rounded p-2"
                  maxDate={dateRange?.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate() - 1) : undefined}
                />
              </div>
              {/* Listado de sesiones componentizado */}
              <SessionList
                sessions={sessions}
                showEditButton={true}
                onEdit={(sesion) => {
                  setSelectedSession(sesion);
                  setShowEditSessionModal(true);
                }}
              />
            </div>
            <div className="flex-1 flex flex-col gap-6 justify-center relative">
              <div className="absolute left-0 top-0">
                <BackArrow onClick={() => setPage2(false)} />
              </div>
              <div className="flex flex-col justify-center h-full">
                <p className="text-slate-300 text-lg mb-4">
                  Selecciona la fecha límite para que los usuarios puedan inscribirse al evento. Esta fecha debe estar dentro del rango de fechas del evento.
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!closeDate || !name || !dateRange || !dateRange.from || !dateRange.to || !country || !city}
                  onClick={handleSubmit}
                >
                  Actualizar evento
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full border border-slate-600"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    {showEditSessionModal && selectedSession && (
      <EditSessionModal
        open={showEditSessionModal}
        onClose={() => setShowEditSessionModal(false)}
        session={selectedSession}
        event={event}
        onSessionUpdated={() => {
          setShowEditSessionModal(false);
          // Refrescar sesiones después de editar
          getEventDetail(event.id_evento).then(({ status, data }) => {
            if (status === 200 && data && Array.isArray(data.sesiones)) {
              setSessions(data.sesiones);
            }
          });
        }}
      />
    )}
    </Modal>
  );
}
