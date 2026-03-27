import React from "react";

interface Evento {
    id_evento: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion: string;
}

interface Props {
    eventos: Evento[];
    onSelectEvento?: (evento: Evento) => void;
    selectedEvento?: Evento | null;
}

const ParticipantEventsList: React.FC<Props> = ({
    eventos,
    onSelectEvento,
    selectedEvento,
}) => {
    return (
        <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-slate-200">
                Eventos en los que estás inscrito
            </h3>
            <ul
                className="space-y-3 max-h-[420px] overflow-y-auto"
                style={{
                    minHeight: "0",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {eventos.map((evento) => (
                    <li
                        key={evento.id_evento}
                        className={`p-4 rounded-lg cursor-pointer border transition
                            ${selectedEvento?.id_evento === evento.id_evento
                                ? "bg-yellow-400 border-yellow-400 text-slate-800"
                                : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"}
                        `}
                        onClick={() => onSelectEvento && onSelectEvento(evento)}
                    >
                        <div className="font-bold">
                            {evento.nombre}
                        </div>
                        <div className="text-xs">
                            {evento.fecha_inicio} - {evento.fecha_fin}
                        </div>
                        <div className="text-xs">
                            {evento.ubicacion}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ParticipantEventsList;