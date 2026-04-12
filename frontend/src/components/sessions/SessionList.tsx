/*
File: SessionList.tsx

Contains:
Session list renderer with schedule formatting and optional edit action.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import React from "react";
import EditIconButton from "../ui/EditIconButton";

interface SessionListProps {
  sessions: any[];
  onEdit?: (session: any) => void;
  showEditButton?: boolean;
}

// SessionList displays each session, its schedule, and assigned speakers.
const SessionList: React.FC<SessionListProps> = ({ sessions, onEdit, showEditButton = false }) => {
  // parseDisplayDateTime supports both display and ISO date formats.
  const parseDisplayDateTime = (value: string): Date => {
    if (!value) return new Date(NaN);
    if (!value.includes("/")) return new Date(value);
    const [datePart, timePart = "00:00"] = value.split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  };

  return (
    <div className="w-full mt-0">
      <h3 className="text-slate-300 font-semibold mb-3 text-lg">Sesiones del evento</h3>
      {sessions.length === 0 ? (
        <div className="text-slate-400 italic">No hay sesiones registradas para este evento.</div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((sesion) => (
            <li key={sesion.id_sesion} className="rounded-lg border border-slate-700/80 bg-slate-900/45 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#F5E427]">{sesion.titulo}</div>
                  <div className="text-xs text-slate-400">
                  {(() => {
                    const inicio = parseDisplayDateTime(sesion.fecha_inicio);
                    const fin = parseDisplayDateTime(sesion.fecha_fin);
                    return `${inicio.toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} - ${fin.toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
                  })()}
                  </div>
                </div>
                {showEditButton && onEdit && (
                  <EditIconButton
                    onClick={() => onEdit(sesion)}
                    color="#94a3b8"
                    title="Editar sesión"
                  />
                )}
              </div>
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
