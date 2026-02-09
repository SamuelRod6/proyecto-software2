import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
// contexts
import { useToast } from "../../contexts/Toast/ToastContext";
// components
import DateRangePicker from "../../components/ui/DateRangePicker";
import Input from "../../components/ui/Input";
import EditIconButton from "../../components/ui/EditIconButton";
import Modal from "../../components/ui/Modal";
import UpdateCloseDateModal from "./UpdateCloseDateModal";
import ToggleIconButton from "../../components/ui/ToggleIconButton";
import ConfirmModal from "../../components/ui/ConfirmModal";
// interfaces
import { Evento } from "../../services/eventsServices";
import { patchInscriptionDate } from "../../services/eventsServices";
interface EventDetailModalProps {
    open: boolean;
    onClose: () => void;
    event?: Evento | null;
    onUpdate?: () => void;
}

export default function EventDetailModal({ 
    open, 
    onClose, 
    event, 
    onUpdate
}: EventDetailModalProps): JSX.Element | null {
    // states
    const [showCloseDateModal, setShowCloseDateModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState<"abrir"|"cerrar"|null>(null);
    const [loadingConfirm, setLoadingConfirm] = useState(false);

    // contexts
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

    // PATCH open/close inscriptions
    async function handleToggleInscripciones() {
        if (!event) return;
        setLoadingConfirm(true);
        const action = showConfirmModal === "cerrar" ? "cerrar" : "abrir";
        try {
            const response = await patchInscriptionDate(event.id_evento, action);
            if (response.status === 200) {
                showToast({
                    title: `Inscripciones ${action === "cerrar" ? "cerradas" : "abiertas"}`,
                    message: `Las inscripciones han sido ${action === "cerrar" ? "cerradas" : "abiertas"} correctamente.`,
                    status: "success",
                });
                setShowConfirmModal(null);
                onClose();
                if (onUpdate) onUpdate();
            } else {
                showToast({
                    title: "Error",
                    message: response.data?.error || "No se pudo actualizar el estado de las inscripciones.",
                    status: "error",
                });
            }
        } catch (error: any) {
            showToast({
                title: "Error",
                message: error?.response?.data?.error || "No se pudo actualizar el estado de las inscripciones.",
                status: "error",
            });
        } finally {
            setLoadingConfirm(false);
        }
    }

    // return null if no event is provided
    if (!event) return null;

    return (
        <>
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
                                dayPickerProps={{
                                    disabled: () => true,
                                    month: dateRange?.from || undefined
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 justify-center p-6 relative">
                        <div className="flex items-center justify-center gap-2 mb-2 mt-1 md:mt-0 md:mb-0 md:ml-auto md:mr-0" >
                            {event.inscripciones_abiertas ? (
                                <>
                                    <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow leading-tight">
                                        Inscripciones abiertas
                                    </span>
                                    <ToggleIconButton 
                                        open={true} 
                                        onClick={() => setShowConfirmModal("cerrar")} 
                                        className="p-2" 
                                        title="Cerrar inscripciones"
                                        iconSize={22}
                                    />
                                </>
                            ) : (
                                <>
                                    <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow leading-tight">
                                        Inscripciones cerradas
                                    </span>
                                    <ToggleIconButton 
                                        open={false} 
                                        onClick={() => setShowConfirmModal("abrir")} 
                                        className="p-2" 
                                        title="Abrir inscripciones"
                                        iconSize={22}
                                    />
                                </>
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
                            <label className="block mb-1 text-slate-300 font-medium flex items-center gap-2">
                                Fecha de cierre de inscripciones
                                <EditIconButton 
                                    aria-label="Editar fecha de cierre"
                                    onClick={() => setShowCloseDateModal(true)}
                                    color="#94a3b8" // slate-400
                                />
                            </label>
                            <Input value={event.fecha_cierre_inscripcion} disabled className="w-full" />
                        </div>
                    </div>
                </div>
            </Modal>
            {showCloseDateModal && (
                <UpdateCloseDateModal 
                    open={showCloseDateModal} 
                    onClose={() => setShowCloseDateModal(false)} 
                    event={event} 
                />
            )}
            <ConfirmModal
                open={!!showConfirmModal}
                title={showConfirmModal === "cerrar" ? "Cerrar inscripciones" : "Abrir inscripciones"}
                message={showConfirmModal === "cerrar"
                    ? "¿Estás seguro que deseas cerrar las inscripciones para este evento?"
                    : "¿Estás seguro que deseas abrir las inscripciones para este evento?"}
                confirmText={showConfirmModal === "cerrar" ? "Cerrar" : "Abrir"}
                cancelText="Cancelar"
                onConfirm={handleToggleInscripciones}
                onCancel={() => setShowConfirmModal(null)}
                loading={loadingConfirm}
            />
        </>
    );
}
