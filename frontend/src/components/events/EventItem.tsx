import { useState } from "react";
import { useModal } from "../../contexts/Modal/ModalContext";
// components
import DeleteIconButton from "../ui/DeleteIconButton";
import ToggleIconButton from "../ui/ToggleIconButton";
import ConfirmModal from "../ui/ConfirmModal";
import AddSessionButton from "./AddSessionButton";
import EventDetailModal from "./EventDetailModal";
import CreateSessionModal from "../sessions/CreateSessionModal";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";

interface EventItemProps {
	id_evento: number;
	nombre: string;
	fecha_inicio: string;
	fecha_fin: string;
	fecha_cierre_inscripcion: string;
	inscripciones_abiertas: boolean;
	ubicacion: string;
	onClick?: () => void;
	inscrito?: boolean;
	onDelete?: (id: number) => void;
	onToggleInscripcion?: (id: number, open: boolean) => void;
}

export default function EventItem(props: EventItemProps) {
	// Helper para parsear fecha DD/MM/YYYY HH:mm:ss
	function parseDate(dateStr: string): Date | undefined {
		if (!dateStr) return undefined;
		const [datePart, timePart] = dateStr.split(" ");
		const [day, month, year] = datePart.split("/").map(Number);
		let hours = 0, minutes = 0, seconds = 0;
		if (timePart) {
			const [h, m, s] = timePart.split(":").map(Number);
			hours = h || 0;
			minutes = m || 0;
			seconds = s || 0;
		}
		return new Date(year, month - 1, day, hours, minutes, seconds);
	}

	// Ajusta fecha fin si es antes de las 6am
	function adjustEndDate(date: Date | undefined): Date | undefined {
		if (!date) return undefined;
		if (date.getHours() < 6) {
			const adjusted = new Date(date);
			adjusted.setDate(date.getDate() - 1);
			return adjusted;
		}
		return date;
	}

	// Formatea fecha a string legible
	function formatDate(d: Date | undefined): string {
		if (!d) return "";
		return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
	}
const {
	id_evento,
	nombre,
	fecha_inicio,
	fecha_fin,
	fecha_cierre_inscripcion,
	inscripciones_abiertas,
	ubicacion,
	onClick,
	inscrito,
	onDelete,
	onToggleInscripcion,
} = props;
	// states
	const [showConfirm, setShowConfirm] = useState<null | "abrir" | "cerrar">(null);
	const [loading, setLoading] = useState(false);
	// modal context
	const { state: modalState, dispatch: modalDispatch } = useModal() as { state: { openModal: string | null, payload?: any }, dispatch: any };
	// contexts
	const { user } = useAuth();

	// role checks
	const isAdmin = user?.role === "ADMIN";
	const isOrganizer = user?.role === "COMITE CIENTIFICO";
	const canOpenDetailModal = !modalState.openModal || modalState.openModal === "EVENT_DETAIL";
	const isAnyOtherModalOpen = modalState.openModal && modalState.openModal !== "EVENT_DETAIL";
	 return (
	 	<div
	 		className="rounded-lg bg-slate-800 shadow-md p-6 mb-4 flex flex-col md:flex-row md:items-center md:justify-between transition hover:bg-slate-700 cursor-pointer"
	 		onClick={(e) => {
	 			if (isAnyOtherModalOpen) {
	 				return;
	 			}
	 			if (canOpenDetailModal) {
	 				modalDispatch({ type: 'OPEN_MODAL', payload: { modalName: 'EVENT_DETAIL', payload: {
	 					id_evento,
	 					nombre,
	 					fecha_inicio,
	 					fecha_fin,
	 					fecha_cierre_inscripcion,
	 					inscripciones_abiertas,
	 					ubicacion,
	 					inscrito,
	 				} } });
	 			}
	 		}}
	 	>
			<div>
				<h2 className="text-xl font-semibold text-[#F5E427] mb-2 flex items-center gap-2">
					{nombre}
					{inscrito && (
						<span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-500 text-white font-semibold">Inscrito</span>
					)}
				</h2>
				<div className="text-slate-300 text-sm">
					<span className="mr-4">
						<span className="font-medium">Inicio:</span> {formatDate(parseDate(fecha_inicio))}
					</span>
					<span>
						<span className="font-medium">Fin:</span> {formatDate(adjustEndDate(parseDate(fecha_fin)))}
					</span>
					<span className="ml-4">
						<span className="font-medium">Cierre inscripciones:</span> {(() => {
							let d = parseDate(fecha_cierre_inscripcion);
							if (!d) return "";
							d = new Date(d.getTime() - 86400000);
							return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Caracas" });
						})()}
					</span>
				</div>
			</div>
				 {(isAdmin || isOrganizer) && (
					 <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0 flex gap-2 items-center">
						 <AddSessionButton
							 onClick={e => {
								 e.stopPropagation();
								 modalDispatch({ type: 'OPEN_MODAL', payload: { modalName: 'CREATE_SESSION', payload: {
									 event: {
										 id_evento,
										 nombre,
										 fecha_inicio,
										 fecha_fin,
										 fecha_cierre_inscripcion,
										 inscripciones_abiertas,
										 ubicacion,
										 inscrito,
									 }
								 } } });
							 }}
						 />
						 {onToggleInscripcion && (
							 <ToggleIconButton
								 open={!inscripciones_abiertas}
								 onClick={e => {
									 e.stopPropagation();
									 setShowConfirm(inscripciones_abiertas ? "cerrar" : "abrir");
								 }}
								 title={inscripciones_abiertas ? "Cerrar inscripciones" : "Abrir inscripciones"}
							 />
						 )}
						 {onDelete && (
							 <DeleteIconButton onClick={e => { e.stopPropagation(); onDelete(id_evento); }} />
						 )}
					 </div>
				 )}
			 {/* Modal de crear sesión */}
			 {modalState.openModal === "CREATE_SESSION" && (
				 <CreateSessionModal
					 event={modalState.payload?.event}
					 open={modalState.openModal === "CREATE_SESSION"}
					 onClose={() => {
						 modalDispatch({ type: 'CLOSE_MODAL' });
					 }}
					 onSessionCreated={() => {
						 modalDispatch({ type: 'CLOSE_MODAL' });
					 }}
				 />
			 )}
			 {/* Event Detail Modal */}
			 {modalState.openModal === "EVENT_DETAIL" && (
				 <EventDetailModal
					 event={modalState.payload}
					 open={modalState.openModal === "EVENT_DETAIL"}
					 onClose={() => {
						 modalDispatch({ type: 'CLOSE_MODAL' });
					 }}
				 />
			 )}
		<ConfirmModal
			open={!!showConfirm}
			title={showConfirm === "cerrar" ? "Cerrar inscripciones" : "Abrir inscripciones"}
			message={showConfirm === "cerrar"
				? "¿Estás seguro que deseas cerrar las inscripciones para este evento?"
				: "¿Estás seguro que deseas abrir las inscripciones para este evento?"}
			confirmText={showConfirm === "cerrar" ? "Cerrar" : "Abrir"}
			cancelText="Cancelar"
			loading={loading}
			onCancel={() => setShowConfirm(null)}
			onConfirm={async () => {
				setLoading(true);
				await onToggleInscripcion?.(id_evento, inscripciones_abiertas);
				setLoading(false);
				setShowConfirm(null);
			}}
		/>
	</div>
);
}
