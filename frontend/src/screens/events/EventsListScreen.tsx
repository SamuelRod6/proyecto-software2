import { useEffect, useState } from "react";
// components
import Button from "../../components/ui/Button";
import EventCreateModal from "../../components/events/EventCreateModal";
import EventItem from "../../components/events/EventItem";
import EventDetailModal from "../../components/events/EventDetailModal";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
// contexts
import { useToast } from "../../contexts/Toast/ToastContext";
// animations
import emptyAnimation from "../../assets/animations/empty-animation.json";
// APIs
import { getEvents, Evento } from "../../services/eventsServices";

export default function EventsListScreen(): JSX.Element {
	// states
	const [events, setEvents] = useState<Evento[]>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
	// contexts
	const { showToast } = useToast();

	// function to fetch events
	async function fetchEvents() {
		setLoading(true);
		try {
			const { status, data } = await getEvents();
			if (status === 200 && Array.isArray(data)) {
				setEvents(data);
			} else {
				const msg = data?.error || "Error al cargar eventos";
				setError(msg);
				showToast({
					title: "Error",
					message: msg,
					status: "error"
				});
			}
		} catch {
			setError("Error al cargar eventos");
			showToast({
				title: "Error",
				message: "Error al cargar eventos",
				status: "error"
			});
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchEvents();
	}, []);

	return (
		<section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold text-[#F5E427]">
						Eventos científicos
					</h1>
					<p className="text-slate-300">
						Administra los eventos, fechas, ubicaciones y sesiones.
					</p>
				</div>
				 <Button onClick={() => setShowCreateModal(true)}>
					 Crear evento
				 </Button>
			</header>

			<EventCreateModal 
				open={showCreateModal} 
				onClose={() => { setShowCreateModal(false); fetchEvents(); }} 
			/>
			{loading ? (
					<div className="flex justify-center items-center min-h-[200px] pt-16">
						<Loader visible={true} />
					</div>
			 ) : error ? (
					<ErrorState
						title="Error al cargar los eventos"
						description="Hubo un problema al cargar los eventos. Por favor, recarga para intentarlo nuevamente."
						buttonText="Volver a intentar"
						onRetry={fetchEvents}
					/>
			 ) : events.length === 0 ? (
					<EmptyState
						title="Aún no hay eventos creados"
						description="Cuando existan eventos, los mostraremos en esta sección."
						animationData={emptyAnimation}
					/>
			) : (
				<div className="mt-6">
					{events.map(ev => (
						<EventItem
							key={ev.id_evento}
							id_evento={ev.id_evento}
							nombre={ev.nombre}
							fecha_inicio={ev.fecha_inicio}
							fecha_fin={ev.fecha_fin}
							fecha_cierre_inscripcion={ev.fecha_cierre_inscripcion}
							inscripciones_abiertas={ev.inscripciones_abiertas}
							ubicacion={ev.ubicacion}
							onClick={() => setSelectedEvent(ev)}
						/>
					))}
					<EventDetailModal 
						open={!!selectedEvent} 
						onClose={() => setSelectedEvent(null)} 
						event={selectedEvent} 
						onUpdate={() => {
							setSelectedEvent(null);
							fetchEvents();
						}}
					/>
				</div>
			)}
		</section>
	);
}
