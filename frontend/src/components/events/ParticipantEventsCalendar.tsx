/*
File: ParticipantEventsCalendar.tsx

Contains:
Calendar component for participant event ranges and selected event highlight.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale/es";

// EventRange defines one inclusive date range mapped to an event id.
interface EventRange {
    from: Date;
    to: Date;
    id: number;
}

interface Props {
    eventRanges: EventRange[];
    selectedRange?: EventRange;
    month?: Date;
    onMonthChange?: (month: Date) => void;
}

// ParticipantEventsCalendar renders occupied dates and optionally highlights
// a selected event range.
const ParticipantEventsCalendar: React.FC<Props> = ({
    eventRanges,
    selectedRange,
    month,
    onMonthChange,
}) => {
    // Build all occupied days to paint event activity on the calendar.
    const busyDays: Date[] = [];
    eventRanges.forEach(range => {
        let d = new Date(range.from);
        while (d <= range.to) {
            busyDays.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
    });

    // Build the selected event range to visually highlight it.
    let selectedDays: Date[] = [];
    if (selectedRange) {
        let d = new Date(selectedRange.from);
        while (d <= selectedRange.to) {
            selectedDays.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
    }

    return (
        <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-slate-200">
                Calendario de eventos inscritos
            </h3>
            <div className="flex justify-center items-center">
                <div className="bg-white rounded-xl p-6">
                    <DayPicker
                        mode="single"
                        locale={es}
                        modifiers={{
                            busy: busyDays,
                            selectedRange: selectedDays,
                        }}
                        modifiersClassNames={{
                            busy: "bg-blue-200 text-blue-900 rounded-md",
                            selectedRange: "bg-yellow-400 text-yellow-900 rounded-md",
                        }}
                        month={month}
                        onMonthChange={onMonthChange}
                        selectable={false}
                        className="rounded-xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default ParticipantEventsCalendar;