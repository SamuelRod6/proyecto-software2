import React, { useState } from "react";
// components
import EventDetailModal from "./EventDetailModal";
import Button from "../ui/Button";

interface Evento {
    id_evento: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion: string;
    fecha_cierre_inscripcion: string;
    inscripciones_abiertas: boolean;
}

interface Props {
    eventos: Evento[];
    onInscribir?: (evento: Evento) => void;
}

const AvailableEventsList: React.FC<Props> = ({ eventos, onInscribir }) => {
    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
    return (
        <>
            <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="font-semibold mb-2 text-slate-200">
                    Eventos en los que puedes inscribirte
                </h3>
                <ul className="space-y-3">
                    {eventos.map((evento) => (
                        <li
                            key={evento.id_evento}
                            className="p-4 rounded-lg border bg-slate-700 border-slate-600 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer hover:bg-slate-600 transition"
                            onClick={() => setSelectedEvento(evento)}
                        >
                            <div>
                                <div className="font-bold text-slate-200">
                                    {evento.nombre}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {evento.fecha_inicio} - {evento.fecha_fin}
                                </div>
                                <div className="text-xs text-slate-300">
                                    {evento.ubicacion}
                                </div>
                            </div>
                            {(() => {
                                const [day, month, year] = evento.fecha_cierre_inscripcion.split("/").map(Number);
                                const closeDate = new Date(year, month - 1, day);
                                const now = new Date();
                                // Reset hours to compare only dates or include time if needed. 
                                // Assuming closing date is until end of day, we might compare timestamps.
                                // For now, simple comparison.
                                const isClosed = now > closeDate;

                                if (isClosed) {
                                    return (
                                        <div className="flex flex-col items-end">
                                            <span className="text-red-400 font-semibold mb-1 text-sm">
                                                Inscripciones cerradas
                                            </span>
                                            <Button
                                                className="bg-slate-600 text-slate-400 font-semibold px-4 py-2 rounded-lg cursor-not-allowed"
                                                disabled
                                            >
                                                Cerrado
                                            </Button>
                                        </div>
                                    );
                                }

                                return (
                                    <Button
                                        className="mt-2 md:mt-0 bg-yellow-400 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onInscribir && onInscribir(evento);
                                        }}
                                    >
                                        Inscribirme
                                    </Button>
                                );
                            })()}
                        </li>
                    ))}
                </ul>
            </div>
            {selectedEvento && (
                <EventDetailModal
                    event={selectedEvento}
                    open={!!selectedEvento}
                    onClose={() => setSelectedEvento(null)}
                    showInscribirButton
                    onInscribir={() => {
                        onInscribir && onInscribir(selectedEvento);
                        setSelectedEvento(null);
                    }}
                />
            )}
        </>
    );
};

export default AvailableEventsList;