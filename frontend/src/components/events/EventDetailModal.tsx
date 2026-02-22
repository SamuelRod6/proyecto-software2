import { useEffect, useState } from "react";
// contexts
import { useToast } from "../../contexts/Toast/ToastContext";
import { useAuth } from "../../contexts/Auth/Authcontext";
import { useModal } from "../../contexts/Modal/ModalContext";
// components
import DateRangePicker from "../../components/ui/DateRangePicker";
import Input from "../../components/ui/Input";
import EditIconButton from "../../components/ui/EditIconButton";
import EditEventModal from "./EditEventModal";
import Modal from "../../components/ui/Modal";
import UpdateCloseDateModal from "./UpdateCloseDateModal";
import ToggleIconButton from "../../components/ui/ToggleIconButton";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Loader from "../../components/ui/Loader";
import Button from "../../components/ui/Button";
// services
import { patchInscriptionDate } from "../../services/eventsServices";
import { getEventDetail } from "../../services/sessionsServices";
import SessionList from "../sessions/SessionList";
// interfaces
import { Evento } from "../../services/eventsServices";

interface EventDetailModalProps {
    open: boolean;
    onClose: () => void;
    event?: Evento | null;
    onUpdate?: () => void;
    showInscribirButton?: boolean;
    onInscribir?: () => void;
}

export default function EventDetailModal({ 
    open, 
    onClose, 
    event, 
    onUpdate,
    showInscribirButton,
    onInscribir
}: EventDetailModalProps): JSX.Element | null {
    // modal context
    const { state: modalState, dispatch: modalDispatch } = useModal();
    // states
    const [showCloseDateModal, setShowCloseDateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState<"abrir"|"cerrar"|null>(null);
    const [loadingConfirm, setLoadingConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [eventDetail, setEventDetail] = useState<any | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);

    // contexts
    const { showToast } = useToast();
    const { user } = useAuth();

    // Role check
    const isParticipant = user?.role === "PARTICIPANTE";

    // helper to parse date string from API
    function parseDate(dateStr: string): Date | undefined {
        if (!dateStr) return undefined;
        // Soporta formato DD/MM/YYYY HH:mm:ss
        const [datePart, timePart] = dateStr.split(" ");
        const [day, month, year] = datePart.split("/").map(Number);
        let hours = 0, minutes = 0, seconds = 0;
        if (timePart) {
            const [h, m, s] = timePart.split(":").map(Number);
            hours = h || 0;
            minutes = m || 0;
            seconds = s || 0;
        }
        // Construye la fecha en local
        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // Fetch event detail when modal opens
    useEffect(() => {
        if (open && event?.id_evento) {
            setLoading(true);
            getEventDetail(event.id_evento)
                .then(({ status, data }) => {
                    if (status === 200 && data) {
                        setEventDetail(data);
                        setSessions(data.sesiones || []);
                    } else {
                        showToast({
                            title: "Error",
                            message: data?.message || "No se pudo cargar el detalle del evento.",
                            status: "error",
                        });
                        setEventDetail(null);
                        setSessions([]);
                        onClose();
                    }
                })
                .catch(() => {
                    showToast({
                        title: "Error",
                        message: "No se pudo cargar el detalle del evento.",
                        status: "error",
                    });
                    setEventDetail(null);
                    setSessions([]);
                    onClose();
                })
                .finally(() => setLoading(false));
        } else {
            setEventDetail(null);
            setSessions([]);
        }
    }, [open, event]);

    // prepare date range for the calendar
    // Corrige visualización: si la hora de fin es antes de las 6am, muestra el día anterior
    function adjustEndDate(date: Date | undefined): Date | undefined {
        if (!date) return undefined;
        if (date.getHours() < 6) {
            // Si la hora es antes de las 6am, retrocede un día
            const adjusted = new Date(date);
            adjusted.setDate(date.getDate() - 1);
            return adjusted;
        }
        return date;
    }
    const dateRange = event ? {
        from: parseDate(event.fecha_inicio),
        to: adjustEndDate(parseDate(event.fecha_fin))
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
                    message: response.data?.message || "No se pudo actualizar el estado de las inscripciones.",
                    status: "error",
                });
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || "No se pudo actualizar el estado de las inscripciones.";
            showToast({
                title: "Error",
                message: msg,
                status: "error",
            });
        } finally {
            setLoadingConfirm(false);
        }
    }

    // Only render modal if allowed by context
    if (!open || modalState.openModal !== "EVENT_DETAIL") return null;
    if (!event) return null;
    if (loading) {
        return (
            <Modal open={open} onClose={onClose} title="Detalle del evento">
                <div className="flex justify-center items-center min-h-[120px]">
                    <Loader visible={true} />
                </div>
            </Modal>
        );
    }
    if (!eventDetail) return null;

    // Handler to close modal via context and parent
    const handleClose = () => {
        modalDispatch({ type: 'CLOSE_MODAL' });
        onClose();
    };

    return (
        <>
            <Modal
                open={open}
                onClose={handleClose}
                title="Detalle del evento"
                className="max-w-screen-lg w-full"
            >
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
                        {!isParticipant && (
                            <div className="flex items-center justify-center gap-2 mb-2 mt-1 md:mt-0 md:mb-0 md:ml-auto md:mr-0">
                                {eventDetail.inscripciones_abiertas ? (
                                    <>
                                        <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow leading-tight">
                                            Inscripciones abiertas
                                        </span>
                                        <ToggleIconButton 
                                            open={!eventDetail.inscripciones_abiertas} 
                                            onClick={() => setShowConfirmModal("cerrar")} 
                                            className="p-2" 
                                            title="Cerrar inscripciones"
                                            iconSize={22}
                                        />
                                        <EditIconButton 
                                            aria-label="Editar evento"
                                            onClick={() => setShowEditModal(true)}
                                            color="#94a3b8"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow leading-tight">
                                            Inscripciones cerradas
                                        </span>
                                        <ToggleIconButton 
                                            open={!eventDetail.inscripciones_abiertas} 
                                            onClick={() => setShowConfirmModal("abrir")} 
                                            className="p-2" 
                                            title="Abrir inscripciones"
                                            iconSize={22}
                                        />
                                        <EditIconButton 
                                            aria-label="Editar fecha de cierre"
                                            onClick={() => setShowCloseDateModal(true)}
                                            color="#94a3b8"
                                        />
                                    </>
                                )}
                            </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="mb-2">
                                    <label className="block mb-1 text-slate-300 font-medium">
                                        Nombre del evento
                                    </label>
                                    <Input value={eventDetail.nombre} disabled className="w-full" />
                                </div>
                                <div className="mb-2">
                                    <label className="block mb-1 text-slate-300 font-medium">
                                        Ubicación
                                    </label>
                                    <Input value={eventDetail.ubicacion} disabled className="w-full" />
                                </div>
                                <div className="mb-2">
                                    <label className="mb-1 text-slate-300 font-medium flex items-center gap-2">
                                        Fecha de cierre de inscripciones
                                    </label>
                                    <Input 
                                        value={(() => {
                                            let d = parseDate(eventDetail.fecha_cierre_inscripcion);
                                            if (!d) return "";
                                            // Restar un día
                                            d = new Date(d.getTime() - 86400000);
                                            return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Caracas" });
                                        })()} 
                                        disabled 
                                        className="w-full" 
                                    />
                                </div>
                                {showInscribirButton && (
                                    <Button
                                        className="mt-4 bg-yellow-400 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition w-full"
                                        onClick={onInscribir}
                                    >
                                        Inscribirme
                                    </Button>
                                )}
                                {/* Listado de sesiones debajo del campo de cierre de inscripciones */}
                                <SessionList sessions={sessions} />
                            </div>
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
            {showEditModal && event && (
                <EditEventModal 
                    open={showEditModal} 
                    onClose={() => setShowEditModal(false)} 
                    event={event} 
                    onUpdate={onUpdate}
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
