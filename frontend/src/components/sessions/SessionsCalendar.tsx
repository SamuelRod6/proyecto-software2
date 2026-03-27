import React, {useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale/es";

interface SessionItem {
    id_session: number;
    titulo: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicación?: string;
}

interface SessionsCalendarProps {
    sessions: SessionItem[];
}

function normalizeDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, "0");
    const d = `${date.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseDisplayDateTime(value: string): Date {
  if (!value) return new Date(NaN);
  if (!value.includes("/")) return new Date(value);
  const [datePart, timePart = "00:00"] = value.split(" ");
  const [d, m, y] = datePart.split("/").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

export default function SessionCalendar({ sessions} : SessionsCalendarProps) {
    const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);

    const sessionsByDay = useMemo(() => {
        const map = new Map<string, SessionItem[]>();
        sessions.forEach((session) => {
          const start = parseDisplayDateTime(session.fecha_inicio);
            const key = normalizeDateKey(start);
            const current = map.get(key) ?? [];
            current.push(session);
            map.set(key, current);
        });

        for (const [, value] of map) {
            value.sort(
                (a, b) =>
                parseDisplayDateTime(a.fecha_inicio).getTime() - parseDisplayDateTime(b.fecha_inicio).getTime()
            );
        }

        return map;
    }, [sessions]);

    const busyDays = useMemo(() => {
        const dates: Date[] = [];
        for (const key of sessionsByDay.keys()) {
            const [y, m, d] = key.split("-").map(Number);
            dates.push(new Date(y, m - 1, d));
        }
        return dates;
    }, [sessionsByDay]);

    const selectedKey = selectedDay ? normalizeDateKey(selectedDay) : "";
    const selectedSessions = selectedKey ? sessionsByDay.get(selectedKey) ?? [] : [];
    
    return (
        <div className="w-full mt-6">
            <h3 className="text-slate-400 font-semibold mb-2 text-base">Calendario de sesiones</h3>
            <div className="bg-white rounded-xl p-4 inline-block">
                <DayPicker
                mode="single"
                locale={es}
                selected={selectedDay}
                onSelect={setSelectedDay}
                modifiers={{ busy: busyDays }}
                modifiersClassNames={{
                    busy: "bg-blue-200 text-blue-900 rounded-md",
                }}
                showOutsideDays
                />
        </div>

        {selectedDay && (
        <div className="mt-3">
          {selectedSessions.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No hay sesiones para el día seleccionado.
            </p>
          ) : (
            <ul className="divide-y divide-slate-300/30">
              {selectedSessions.map((session) => {
                const inicio = parseDisplayDateTime(session.fecha_inicio);
                const fin = parseDisplayDateTime(session.fecha_fin);
                return (
                  <li key={session.id_session} className="py-2">
                    <p className="font-semibold text-[#F5E427]">{session.titulo}</p>
                    <p className="text-xs text-slate-400">
                      {inicio.toLocaleTimeString("es-VE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Caracas",
                      })}{" "}
                      -{" "}
                      {fin.toLocaleTimeString("es-VE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Caracas",
                      })}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}