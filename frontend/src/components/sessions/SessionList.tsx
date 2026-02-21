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
                  {sesion.fecha_inicio?.substring(0, 16).replace('T', ' ')} - {sesion.fecha_fin?.substring(0, 16).replace('T', ' ')}
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
