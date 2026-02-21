import { useEffect, useState } from "react";
// components
import Button from "../../components/ui/Button";
import EventCreateModal from "../../components/events/EventCreateModal";
import EventItem from "../../components/events/EventItem";
import EventDetailModal from "../../components/events/EventDetailModal";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
// contexts
import { useToast } from "../../contexts/Toast/ToastContext";
import { useAuth } from "../../contexts/Auth/Authcontext";
// animations
import emptyAnimation from "../../assets/animations/empty-animation.json";
// APIs
import { getEvents, Evento, deleteEvent, patchInscriptionDate } from "../../services/eventsServices";

export default function EventsAdminListScreen(): JSX.Element {
	// states
	const [events, setEvents] = useState<Evento[]>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [eventToDelete, setEventToDelete] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [eventosInscritos, setEventosInscritos] = useState<number[]>([]);

	// contexts
	const { showToast } = useToast();
	const { user } = useAuth();

	// function to fetch events
	async function fetchEvents() {
		setLoading(true);
		try {
			const { status, data } = await getEvents();
			if (status === 200 && Array.isArray(data)) {
				setEvents(data);
			} else {
				const msg = data?.message || "Error al cargar eventos";
				setError(msg);
				showToast({
					title: "Error",
					message: msg,
					status: "error"
				});
			}
		} catch (error: any) {
			const msg = error?.response?.data?.message || error.message || "Error al cargar eventos";
			setError(msg);
			showToast({
				title: "Error",
				message: msg,
				status: "error"
			});
		} finally {
			setLoading(false);
		}
	}

	// handler to open delete confirmation modal
	const handleDeleteClick = (id: number) => {
		setEventToDelete(id);
		setDeleteModalOpen(true);
	};

	// handler to confirm deletion
	const handleConfirmDelete = async () => {
		if (eventToDelete == null) return;
		setDeleting(true);
		const { status, data } = await deleteEvent(eventToDelete);
		if (status === 204) {
			showToast({ 
				title: "Evento eliminado", 
				message: "El evento fue eliminado correctamente.", 
				status: "success" 
			});
			fetchEvents();
		} else {
			showToast({ 
				title: "Error al eliminar", 
				message: data?.message || data?.error || "No se pudo eliminar el evento.", 
				status: "error" 
			});
		}
		setDeleting(false);
		setDeleteModalOpen(false);
		setEventToDelete(null);
	};

	// handler to cancel deletion
	const handleCancelDelete = () => {
		setDeleteModalOpen(false);
		setEventToDelete(null);
	};

	// handler to toggle inscription status
	const handleToggleInscripcion = async (id: number, abiertas: boolean) => {
		const action = abiertas ? "cerrar" : "abrir";
		const { status, data } = await patchInscriptionDate(id, action);
		if (status === 200) {
			showToast({
				title: abiertas ? "Inscripciones cerradas" : "Inscripciones abiertas",
				message: abiertas ? "Las inscripciones fueron cerradas." : "Las inscripciones fueron abiertas.",
				status: "success"
			});
			fetchEvents();
		} else {
			showToast({
				title: "Error al cambiar inscripciones",
				message: data?.message || data?.error || "No se pudo cambiar el estado de las inscripciones.",
				status: "error"
			});
		}
	};

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
							inscrito={eventosInscritos.includes(ev.id_evento)}
							onClick={e => {
								// Only open modal if the click is not on a button or its children (like the toggle or delete icons)
								if (e && e.target && (e.target.closest('button') || e.target.closest('svg'))) return;
								setSelectedEvent(ev);
							}}
							onDelete={handleDeleteClick}
							onToggleInscripcion={handleToggleInscripcion}
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
			<ConfirmModal
				open={deleteModalOpen}
				title="Eliminar evento"
				message="¿Seguro que deseas eliminar este evento? Esta acción no se puede deshacer."
				confirmText="Eliminar"
				cancelText="Cancelar"
				onConfirm={handleConfirmDelete}
				onCancel={handleCancelDelete}
				loading={deleting}
			/>
		</section>
	);
}
