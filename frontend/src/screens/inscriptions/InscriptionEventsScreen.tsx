import { useEffect, useMemo, useState } from "react";
import { getEvents, Evento } from "../../services/eventsServices";
import { getInscriptions, InscriptionItem } from "../../services/inscriptionServices";
import InscriptionEventCard from "../../components/inscriptions/InscriptionEventCard";
import InscriptionCreateModal from "../../components/inscriptions/InscriptionCreateModal";
import Input from "../../components/ui/Input";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import emptyAnimation from "../../assets/animations/empty-animation.json";
import { useToast } from "../../contexts/Toast/ToastContext";

function getAuthUser() {
    const raw = localStorage.getItem("auth-user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as { id: number; name: string; email: string; role: string };
    } catch {
        return null;
    }
}

export default function InscriptionEventsScreen(): JSX.Element {
    const [events, setEvents] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchName, setSearchName] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
    const [inscriptions, setInscriptions] = useState<InscriptionItem[]>([]);
    const { showToast } = useToast();

    const authUser = getAuthUser();

    async function fetchEvents() {
        setLoading(true);
        try {
            const { status, data } = await getEvents();
            if (status === 200 && Array.isArray(data)) {
                setEvents(data);
                setError("");
            } else {
                const msg = data?.error || "Error al cargar eventos";
                setError(msg);
                showToast({ title: "Error", message: msg, status: "error" });
            }
        } catch {
            setError("Error al cargar eventos");
            showToast({ title: "Error", message: "Error al cargar eventos", status: "error" });
        } finally {
            setLoading(false);
        }
    }

    async function fetchInscriptions() {
        if (!authUser?.id) return;
        const { status, data } = await getInscriptions({ user_id: authUser.id });
        if (status === 200 && Array.isArray(data)) {
            setInscriptions(data);
        }
    }

    useEffect(() => {
        fetchEvents();
        fetchInscriptions();
    }, []);

    const filtered = useMemo(() => {
        return events.filter((ev) => {
            const matchesName = ev.nombre.toLowerCase().includes(searchName.trim().toLowerCase());
            const matchesLocation = ev.ubicacion.toLowerCase().includes(searchLocation.trim().toLowerCase());
            const matchesDate = searchDate.trim() === "" || ev.fecha_inicio.includes(searchDate.trim()) || ev.fecha_fin.includes(searchDate.trim());
            return matchesName && matchesLocation && matchesDate;
        });
    }, [events, searchName, searchLocation, searchDate]);

    const inscriptionMap = useMemo(() => {
        const map = new Map<number, InscriptionItem>();
        inscriptions.forEach((item) => {
            map.set(item.id_evento, item);
        });
        return map;
    }, [inscriptions]);

    return (
        <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[#F5E427]">Inscripciones</h1>
                    <p className="text-slate-300">Selecciona el evento para registrarte.</p>
                </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                <Input
                    label="Buscar por nombre"
                    placeholder="Ej: Congreso"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                />
                <Input
                    label="Buscar por ubicación"
                    placeholder="Ciudad, país"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                />
                <Input
                    label="Buscar por fecha"
                    placeholder="DD/MM/AAAA"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[200px] pt-16">
                    <Loader visible={true} />
                </div>
            ) : error ? (
                <ErrorState
                    title="Error al cargar los eventos"
                    description="Hubo un problema al cargar los eventos."
                    buttonText="Volver a intentar"
                    onRetry={fetchEvents}
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title="No hay eventos disponibles"
                    description="Aún no existen eventos que coincidan con los filtros."
                    animationData={emptyAnimation}
                />
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {filtered.map((ev) => {
                        const ins = inscriptionMap.get(ev.id_evento);
                        return (
                            <InscriptionEventCard
                                key={ev.id_evento}
                                nombre={ev.nombre}
                                fecha_inicio={ev.fecha_inicio}
                                fecha_fin={ev.fecha_fin}
                                fecha_cierre_inscripcion={ev.fecha_cierre_inscripcion}
                                ubicacion={ev.ubicacion}
                                inscripciones_abiertas={ev.inscripciones_abiertas}
                                registrado={!!ins}
                                estadoInscripcion={ins?.estado}
                                onSelect={() => setSelectedEvent(ev)}
                            />
                        );
                    })}
                </div>
            )}

            <InscriptionCreateModal
                open={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                eventoId={selectedEvent?.id_evento ?? null}
                eventoNombre={selectedEvent?.nombre ?? ""}
                userId={authUser?.id ?? 0}
                userEmail={authUser?.email ?? ""}
                userName={authUser?.name ?? ""}
            />
        </section>
    );
}
