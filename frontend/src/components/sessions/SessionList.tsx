import React from "react";

interface SessionListProps {
  sessions: any[];
  onEdit?: (session: any) => void;
  showEditButton?: boolean;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, onEdit, showEditButton = false }) => {
  const parseDisplayDateTime = (value: string): Date => {
    if (!value) return new Date(NaN);
    if (!value.includes("/")) return new Date(value);
    const [datePart, timePart = "00:00"] = value.split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  };

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
                    const inicio = parseDisplayDateTime(sesion.fecha_inicio);
                    const fin = parseDisplayDateTime(sesion.fecha_fin);
                    return `${inicio.toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} - ${fin.toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
                  })()}
                </div>
              </div>
              {showEditButton && onEdit && (
                <button
                  type="button"
                  className="ml-2 px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(sesion);
                  }}
                  title="Editar sesión"
                >
                  ✏️ Editar
                </button>
              )}
              {Array.isArray(sesion.ponentes) && sesion.ponentes.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-[11px] text-slate-400">Ponentes asignados:</p>
                  {sesion.ponentes.map((p: any) => (
                    <div key={p.id_usuario} className="text-xs text-slate-300">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-slate-400"> · contacto: {p.email || "No disponible"}</span>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SessionList;
