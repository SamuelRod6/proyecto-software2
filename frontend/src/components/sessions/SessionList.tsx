import React from "react";

interface SessionListProps {
  sessions: any[];
  onEdit?: (session: any) => void;
  showEditButton?: boolean;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onEdit, showEditButton = false }) => {
  return (
    <div className="w-full mt-8">
      <h3 className="text-slate-400 font-semibold mb-2 text-base">Sesiones del evento</h3>
      {sessions.length === 0 ? (
        <div className="text-slate-400 italic">No hay sesiones registradas para este evento.</div>
      ) : (
        <ul className="divide-y divide-slate-300/30">
          {sessions.map((sesion) => (
            <li key={sesion.id_sesion} className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-[#F5E427] dark:text-[#F5E427]">{sesion.titulo}</div>
                <div className="text-xs text-slate-400">
                  {(() => {
                    const inicio = new Date(sesion.fecha_inicio);
                    const fin = new Date(sesion.fecha_fin);
                    return `${inicio.toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} - ${fin.toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
                  })()}
                </div>
              </div>
              {showEditButton && onEdit && (
                <button
                  className="ml-2 px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                  onClick={() => onEdit(sesion)}
                  title="Editar sesión"
                >
                  ✏️ Editar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SessionList;
