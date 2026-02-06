import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
// contexts
import { useToast } from "../../contexts/Toast/ToastContext";
// components
import DateRangePicker from "../../components/ui/DateRangePicker";
import Input from "../../components/ui/Input";
import EditIconButton from "../../components/ui/EditIconButton";
import DeleteIconButton from "../../components/ui/DeleteIconButton";
import Modal from "../../components/ui/Modal";
// interfaces
import { Evento } from "../../services/eventsServices";

interface EventDetailModalProps {
    open: boolean;
    onClose: () => void;
    event?: Evento | null;
}

export default function EventDetailModal({ 
    open, 
    onClose, 
    event 
}: EventDetailModalProps): JSX.Element | null {
    // contexts
    const navigate = useNavigate();
    const { showToast } = useToast();

    // helper to parse date string from API
    function parseDate(dateStr: string): Date | undefined {
        if (!dateStr) return undefined;
        const [day, month, year] = dateStr.split("/");
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    // prepare date range for the calendar
    const dateRange = event ? {
        from: parseDate(event.fecha_inicio),
        to: parseDate(event.fecha_fin)
    } : undefined;

    // effect to show error if no event is provided when modal is opened
    useEffect(() => {
        if (open && !event) {
            showToast({
                title: "Error",
                message: "No hemos podido cargar los detalles de este evento.",
                status: "error",
            });
            onClose();
        }
    }, [open, event, showToast, onClose]);

    // return null if no event is provided
    if (!event) return null;

    return (
        <Modal open={open} onClose={onClose} title="Detalle del evento" className="max-w-screen-lg w-full">
            <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-10 max-w-[900px] w-full mx-auto shadow-lg flex flex-col md:flex-row gap-8 md:gap-10">
                <div className="flex-1 flex flex-col justify-center items-center">
                    <label className="block mb-2 text-slate-300 font-medium text-lg">
                        Fechas del evento
                    </label>
					<div className="w-full bg-[#e3e8f0] rounded-xl p-5 flex items-center justify-center">
                        <DateRangePicker
                            value={dateRange}
                            onChange={() => {}}
                            fromLabel="Inicio"
                            toLabel="Fin"
                            className="bg-[#e3e8f0] rounded p-2"
                            dayPickerProps={{ disabled: () => true }}
                        />
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-6 justify-center p-8 relative">
                    <div className="absolute right-6 top-6 flex flex-col items-end gap-2 z-10">
                        <div className="flex gap-2">
                            <EditIconButton 
                                onClick={() => 
                                    navigate(`/events/${event.id_evento}/edit`, { state: { event } }
                                )} 
                            />
                            <DeleteIconButton 
                                onClick={() => {/* lógica de eliminar */}} 
                            />
                        </div>
                        {event.inscripciones_abiertas && (
                            <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                                Inscripciones abiertas
                            </span>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 text-slate-300 font-medium">
                            Nombre del evento
                        </label>
                        <Input value={event.nombre} disabled className="w-full" />
                    </div>
                    <div>
                        <label className="block mb-1 text-slate-300 font-medium">
                            Ubicación
                        </label>
                        <Input value={event.ubicacion} disabled className="w-full" />
                    </div>
                    <div>
                        <label className="block mb-1 text-slate-300 font-medium">
                            Fecha de cierre de inscripciones
                        </label>
                        <Input value={event.fecha_cierre_inscripcion} disabled className="w-full" />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
