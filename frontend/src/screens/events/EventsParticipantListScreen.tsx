import React, { useEffect, useState } from "react";
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
import EventFilters from "../../components/events/EventFilters";
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
    const [loadingDisponibles, setLoadingDisponibles] = useState(false);
    const [eventosInscritos, setEventosInscritos] = useState<Evento[]>([]);
    const [eventosDisponibles, setEventosDisponibles] = useState<Evento[]>([]);
    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
    const [inscribirEventoModal, setInscribirEventoModal] = useState<{ open: boolean, evento: Evento | null }>({ open: false, evento: null });
    const [inscribirLoading, setInscribirLoading] = useState(false);
    // filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [countryTerm, setCountryTerm] = useState("");
    const [cityTerm, setCityTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    // contexts
    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchInscritos = async () => {
        if (!user?.id) {
            setEventosInscritos([]);
            return;
        }

        try {
            const { status, data } = await getInscripciones({ usuarioId: user.id });
            if (status === 200 && data) {
                setEventosInscritos(data.eventos_inscritos || []);
            } else {
                setEventosInscritos([]);
                showToast({
                    title: "Error",
                    status: "error",
                    message: data?.message || data?.error || "No se pudieron cargar tus eventos inscritos",
                });
            }
        } catch (error: any) {
            showToast({
                title: "Error",
                status: "error",
                message: error?.message || "Error al cargar tus eventos inscritos"
            });
        }
    };

    const fetchDisponiblesFiltrados = async () => {
        if (!user?.id) {
            setEventosDisponibles([]);
            return;
        }

        setLoadingDisponibles(true);
        try {
            const { status, data } = await getInscripciones({
                usuarioId: user.id,
                searchTerm,
                countryTerm,
                cityTerm,
                fromDate,
                toDate,
            });

            if (status === 200 && data) {
                setEventosDisponibles(data.eventos_disponibles || []);
            } else {
                setEventosDisponibles([]);
                showToast({
                    title: "Error",
                    status: "error",
                    message: data?.message || data?.error || "No se pudieron cargar los eventos disponibles",
                });
            }
        } catch (error: any) {
            showToast({
                title: "Error",
                status: "error",
                message: error?.message || "Error al cargar eventos disponibles",
            });
        } finally {
            setLoadingDisponibles(false);
        }
    };

    // initial load when user changes
    useEffect(() => {
        const run = async () => {
            if (!user?.id) {
                setLoading(false);
                setEventosInscritos([]);
                setEventosDisponibles([]);
                return;
            }

            setLoading(true);
            await Promise.all([fetchInscritos(), fetchDisponiblesFiltrados()]);
            setLoading(false);
        };

        run();
    }, [user]);

    // refetch only available events when filters change
    useEffect(() => {
        if (!user?.id) return;

        const timeoutId = window.setTimeout(() => {
            fetchDisponiblesFiltrados();
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [user, searchTerm, countryTerm, cityTerm, fromDate, toDate]);

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
                await Promise.all([fetchInscritos(), fetchDisponiblesFiltrados()]);
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
            {/* Filtros de eventos */}
            <EventFilters
                searchTerm={searchTerm}
                countryTerm={countryTerm}
                cityTerm={cityTerm}
                fromDate={fromDate}
                toDate={toDate}
                onSearchTermChange={setSearchTerm}
                onCountryTermChange={setCountryTerm}
                onCityTermChange={setCityTerm}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
            />
            <div>
                {loadingDisponibles ? (
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
