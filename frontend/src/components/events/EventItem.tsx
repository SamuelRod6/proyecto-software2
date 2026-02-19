
import Button from "../ui/Button";
import { parseFlexibleDate } from "../../utils/dataParsing";

interface EventItemProps {
	id_evento: number;
	nombre: string;
	fecha_inicio: string;
	fecha_fin: string;
	fecha_cierre_inscripcion: string;
	inscripciones_abiertas: boolean;
	ubicacion: string;
	categoria?: string;
	inscritos_actuales?: number;
	cupo_maximo?: number;
	inscrito?: boolean;
	showInscribirmeButton?: boolean;
	isLastRow?: boolean;
	onClick?: () => void;
	onInscribirmeClick?: (idEvento: number) => void;
}

function formatDate(value: string): string {
	const parsed = parseFlexibleDate(value);
	if (!parsed) return "-";

	const day = String(parsed.getDate()).padStart(2, "0");
	const month = String(parsed.getMonth() + 1).padStart(2, "0");
	const year = parsed.getFullYear();

	return `${day}-${month}-${year}`;
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
	categoria,
	inscritos_actuales,
	cupo_maximo,
	inscrito,
	showInscribirmeButton = false,
	isLastRow = false,
    onClick,
	onInscribirmeClick,
  } = props;

	const isClickable = typeof onClick === "function";
	const canEnroll = showInscribirmeButton && inscripciones_abiertas && !inscrito;
	const inscritosActuales = typeof inscritos_actuales === "number" ? inscritos_actuales : 0;
	const cupoMaximo = typeof cupo_maximo === "number" ? cupo_maximo : 0;
	const enrollmentRatio = `${inscritosActuales} / ${cupoMaximo}`;
	const progressPercent = cupoMaximo > 0 ? Math.min((inscritosActuales / cupoMaximo) * 100, 100) : 0;

	return (
		<div
			className={`grid gap-2 bg-slate-800/40 px-4 py-3 text-sm text-slate-200 transition md:items-center md:[grid-template-columns:90px_minmax(280px,2fr)_120px_120px_160px_130px_150px] ${
				isLastRow ? "" : "border-b border-slate-700"
			} ${
				isClickable ? "hover:bg-slate-700/80 cursor-pointer" : ""
			}`}
			onClick={isClickable ? onClick : undefined}
		>
			<div className="font-semibold text-[#F5E427]">#{id_evento}</div>

			<div className="space-y-0.5">
				<p className="font-semibold text-slate-100">{nombre}</p>
				<p className="text-xs text-slate-300">{ubicacion}</p>
				<span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-200">
					{categoria || "Científico"}
				</span>
			</div>

			<div>{formatDate(fecha_inicio)}</div>
			<div>{formatDate(fecha_fin)}</div>

			<div className="space-y-1">
				<p>{enrollmentRatio}</p>
				<div className="h-1.5 w-full rounded-full bg-slate-700">
					<div
						className="h-1.5 rounded-full bg-[#F5E427]"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>

			<div>
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
						inscripciones_abiertas
							? "bg-emerald-500/20 text-emerald-300"
							: "bg-rose-500/20 text-rose-300"
					}`}
				>
					{inscripciones_abiertas ? "Abierto" : "Cerrado"}
				</span>
			</div>

			<div className="md:justify-self-end">
				<Button
					type="button"
					disabled={!canEnroll}
					className="w-[130px]"
					onClick={(event) => {
						event.stopPropagation();
						if (canEnroll) {
							onInscribirmeClick?.(id_evento);
						}
					}}
				>
					{canEnroll ? "Inscribir" : "Agotado"}
				</Button>
			</div>
		</div>
	);
}
