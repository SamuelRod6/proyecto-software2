interface InscriptionEventCardProps {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    fecha_cierre_inscripcion: string;
    ubicacion: string;
    inscripciones_abiertas: boolean;
    estadoInscripcion?: string;
    registrado?: boolean;
    onSelect?: () => void;
}

export default function InscriptionEventCard({
    nombre,
    fecha_inicio,
    fecha_fin,
    fecha_cierre_inscripcion,
    ubicacion,
    inscripciones_abiertas,
    estadoInscripcion,
    registrado = false,
    onSelect,
}: InscriptionEventCardProps): JSX.Element {
    const statusLabel = registrado ? (estadoInscripcion || "Registrado") : null;
    return (
        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6 shadow-md flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-[#F5E427]">{nombre}</h3>
                    <p className="text-sm text-slate-300">{ubicacion}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {!registrado ? (
                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                inscripciones_abiertas
                                    ? "bg-emerald-500/20 text-emerald-200"
                                    : "bg-rose-500/20 text-rose-200"
                            }`}
                        >
                            {inscripciones_abiertas ? "Abierto" : "Cerrado"}
                        </span>
                    ) : null}
                    {statusLabel ? (
                        <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">
                            {statusLabel}
                        </span>
                    ) : null}
                </div>
            </div>
            <div className="text-sm text-slate-300">
                <span className="mr-4">
                    <span className="font-medium">Inicio:</span> {fecha_inicio}
                </span>
                <span>
                    <span className="font-medium">Fin:</span> {fecha_fin}
                </span>
            </div>
            <div className="text-xs text-slate-400">
                Cierre de inscripciones: {fecha_cierre_inscripcion}
            </div>
            {!registrado ? (
                <button
                    disabled={!inscripciones_abiertas}
                    onClick={onSelect}
                    className={`mt-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                        inscripciones_abiertas
                            ? "bg-[#F5E427] text-slate-900 hover:bg-[#E6D51E]"
                            : "cursor-not-allowed bg-slate-700 text-slate-400"
                    }`}
                >
                    Inscribirse
                </button>
            ) : null}
        </div>
    );
}
