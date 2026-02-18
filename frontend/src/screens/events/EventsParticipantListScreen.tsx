import React, { useEffect, useState } from "react";
import { set } from "date-fns";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { useToast } from "../../contexts/Toast/ToastContext";
// services
import { getInscripciones, inscribirEvento } from "../../services/inscripcionesServices";
// components
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ParticipantEventsCalendar from "../../components/events/ParticipantEventsCalendar";
import ParticipantEventsList from "../../components/events/ParticipantEventsList";
import AvailableEventsList from "../../components/events/AvailableEventsList";
import EventInscriptionModal from "../../components/events/EventInscriptionModal";
// assets
import emptyAnimation from "../../assets/animations/empty-animation.json";

interface Evento {
    id_evento: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion: string;
}

const EventsParticipantListScreen: React.FC = () => {
    // states
    const [loading, setLoading] = useState(true);
    const [eventosInscritos, setEventosInscritos] = useState<Evento[]>([]);
    const [eventosDisponibles, setEventosDisponibles] = useState<Evento[]>([]);
    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
    const [inscribirEventoModal, setInscribirEventoModal] = useState<{ open: boolean, evento: Evento | null }>({ open: false, evento: null });
    const [inscribirLoading, setInscribirLoading] = useState(false);
    // contexts
    const { user } = useAuth();
    const { showToast } = useToast();

    // function to fetch user's inscriptions and available events
    const fetchInscripcionesYDisponibles = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { status, data } = await getInscripciones({ usuarioId: user.id });
            if (status === 200 && data) {
                setEventosInscritos(data.eventos_inscritos || []);
                setEventosDisponibles(data.eventos_disponibles || []);
            }
        } catch (error: any) {
            showToast({
                title: "Error",
                status: "error",
                message: error?.message || "Error al cargar inscripciones"
            });
        } finally {
            setLoading(false);
        }
    };

    // fetch data on mount and when user changes
    useEffect(() => {
        fetchInscripcionesYDisponibles();
    }, [user]);

    // show loader while loading
    if (loading) {
        return <div className="flex justify-center items-center min-h-[300px]"><Loader visible={true} /></div>;
    }

    // helper to parse date strings from API
    function parseDate(dateStr: string): Date {
        const [day, month, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day);
    }

    // Handler to select/deselect an event from the list and highlight it on the calendar
    const handleSelectEvento = (evento: Evento) => {
        if (selectedEvento?.id_evento === evento.id_evento) {
            setSelectedEvento(null);
        } else {
            setSelectedEvento(evento);
            setCalendarMonth(parseDate(evento.fecha_inicio));
        }
    };

    // Handler to open inscription modal for a specific event
    const handleOpenInscribirModal = (evento: Evento) => {
        setInscribirEventoModal({ open: true, evento });
    };

    // Handler to submit inscription form
    const handleInscribir = async (formData: any) => {
        if (!inscribirEventoModal.evento || !user) return;
        setInscribirLoading(true);
        try {
            const payload = {
                id_usuario: user.id,
                id_evento: inscribirEventoModal.evento.id_evento,
                comentario: formData.comentario,
                estado_pago: formData.estado_pago,
                comprobante: formData.comprobante,
            };
            const { status, data } = await inscribirEvento(payload);

            if (status === 200) {
                showToast({
                    title: "Inscripción exitosa",
                    status: "success",
                    message: `Te has inscrito a "${inscribirEventoModal.evento.nombre}"`,
                });
                setInscribirEventoModal({ open: false, evento: null });
                fetchInscripcionesYDisponibles();
            } else {
                showToast({
                    title: "Error",
                    status: "error",
                    message: data?.message || "No se pudo completar la inscripción",
                });
            }
        } catch (error: any) {
            console.log("Error al inscribirse:", error?.response?.data || error);
            showToast({
                title: "Error",
                status: "error",
                message: error?.response?.data?.message || error?.message || "No se pudo completar la inscripción",
            });
        } finally {
            setInscribirLoading(false);
        }
    };

    return (
        <section className="space-y-8 bg-slate-900 min-h-screen px-4 py-8">
            {loading ? (
                <div className="flex justify-center items-center min-h-[200px] bg-slate-800 rounded-xl">
                    <Loader visible={true} />
                </div>
            ) : eventosInscritos.length === 0 ? (
                <div>
                    <EmptyState
                        title="Aún no te has inscrito en ningún evento"
                        description="Cuando te inscribas en algún evento, lo mostraremos aquí."
                        animationData={emptyAnimation}
                    />
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-[0.7] flex justify-center items-center">
                        <ParticipantEventsCalendar
                            eventRanges={eventosInscritos.map(e => ({
                                from: parseDate(e.fecha_inicio),
                                to: parseDate(e.fecha_fin),
                                id: e.id_evento,
                            }))}
                            selectedRange={
                                selectedEvento
                                    ? {
                                        from: parseDate(selectedEvento.fecha_inicio),
                                        to: parseDate(selectedEvento.fecha_fin),
                                        id: selectedEvento.id_evento,
                                    }
                                    : undefined
                            }
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                        />
                    </div>
                    <div className="flex-[2]">
                        <ParticipantEventsList
                            eventos={eventosInscritos}
                            onSelectEvento={handleSelectEvento}
                            selectedEvento={selectedEvento}
                        />
                    </div>
                </div>
            )}
            <div>
                {loading ? (
                    <div className="flex justify-center items-center min-h-[200px] bg-slate-800 rounded-xl">
                        <Loader visible={true} />
                    </div>
                ) : eventosDisponibles.length === 0 ? (
                    <EmptyState
                        title="No hay eventos disponibles"
                        description="Cuando existan eventos disponibles para inscribirte, los mostraremos aquí."
                        animationData={emptyAnimation}
                    />
                ) : (
                    <AvailableEventsList
                        eventos={eventosDisponibles}
                        onInscribir={handleOpenInscribirModal}
                    />
                )}
            </div>
            <EventInscriptionModal
                isOpen={inscribirEventoModal.open}
                onClose={() => setInscribirEventoModal({ open: false, evento: null })}
                evento={inscribirEventoModal.evento}
                onSubmit={handleInscribir}
                loading={inscribirLoading}
            />
        </section>
    );
};

export default EventsParticipantListScreen;
