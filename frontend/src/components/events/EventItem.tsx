// components
import DeleteIconButton from "../ui/DeleteIconButton";
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
}

export default function EventItem(props: EventItemProps) {
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
} = props;
	const { user } = useAuth();
	const isAdmin = user?.role === "ADMIN";
	const isOrganizer = user?.role === "COMITE CIENTIFICO";
	return (
		<div
			className="rounded-lg bg-slate-800 shadow-md p-6 mb-4 flex flex-col md:flex-row md:items-center md:justify-between transition hover:bg-slate-700 cursor-pointer"
			onClick={typeof onClick === 'function' ? onClick : undefined}
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
						<span className="font-medium">Inicio:</span> {fecha_inicio}
					</span>
					<span>
						<span className="font-medium">Fin:</span> {fecha_fin}
					</span>
				</div>
			</div>
				{(isAdmin || isOrganizer) && onDelete && (
					<div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0">
						<DeleteIconButton onClick={(e) => { e.stopPropagation(); onDelete(id_evento); }} />
					</div>
				)}
		</div>
	);
}
