
interface EventItemProps {
	id_evento: number;
	nombre: string;
	fecha_inicio: string;
	fecha_fin: string;
	fecha_cierre_inscripcion: string;
	inscripciones_abiertas: boolean;
	ubicacion: string;
	onClick?: () => void;
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
  } = props;

	const isClickable = typeof onClick === "function";

	return (
		<div
			className={`rounded-lg bg-slate-800 shadow-md p-6 mb-4 flex flex-col md:flex-row md:items-center md:justify-between transition ${
				isClickable ? "hover:bg-slate-700 cursor-pointer" : ""
			}`}
			onClick={isClickable ? onClick : undefined}
		>
			<div>
				<h2 className="text-xl font-semibold text-[#F5E427] mb-2">
					{nombre}
				</h2>
				<p className="text-slate-300 text-sm mb-2">
					<span className="font-medium">Ubicación:</span> {ubicacion}
				</p>
				<div className="text-slate-300 text-sm">
					<span className="mr-4">
						<span className="font-medium">Inicio:</span> {fecha_inicio}
					</span>
					<span>
						<span className="font-medium">Fin:</span> {fecha_fin}
					</span>
				</div>
			</div>
		</div>
	);
}
