// Estilo para rc-time-picker dropdown
const dropdownStyle = `
.rc-time-picker-panel {
  margin-top: 14px !important;
  z-index: 9999;
}
`;
import React from "react";
import TimePicker from "rc-time-picker";
import "rc-time-picker/assets/index.css";
import moment from "moment";

interface TimeRangePickerProps {
  horaInicio: string;
  horaFin: string;
  setHoraInicio: (value: string) => void;
  setHoraFin: (value: string) => void;
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  horaInicio,
  horaFin,
  setHoraInicio,
  setHoraFin,
}) => {
  return (
    <>
      <style>{dropdownStyle}</style>
      <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-slate-700 font-semibold mb-1">Hora de inicio</label>
        <div className="relative">
          <TimePicker
            showSecond={false}
            value={horaInicio ? moment(horaInicio, "HH:mm") : undefined}
            onChange={val => setHoraInicio(val ? val.format("HH:mm") : "08:00")}
            className="min-w-[180px] w-[240px] text-base bg-white rounded-xl border-2 border-[#F5E427] focus:border-[#F5E427] focus:ring-2 focus:ring-[#F5E427] transition-all shadow-lg px-4 py-3 cursor-pointer hover:border-[#F5E427]"
            inputReadOnly={false}
            format="HH:mm"
            placeholder="hh:mm"
            allowEmpty={false}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-slate-700 font-semibold mb-1">Hora de fin</label>
        <div className="relative">
          <TimePicker
            showSecond={false}
            value={horaFin ? moment(horaFin, "HH:mm") : undefined}
            onChange={val => setHoraFin(val ? val.format("HH:mm") : "09:00")}
            className="min-w-[180px] w-[240px] text-base bg-white rounded-xl border-2 border-[#F5E427] focus:border-[#F5E427] focus:ring-2 focus:ring-[#F5E427] transition-all shadow-lg px-4 py-3 cursor-pointer hover:border-[#F5E427]"
            inputReadOnly={false}
            format="HH:mm"
            placeholder="hh:mm"
            allowEmpty={false}
          />
        </div>
      </div>
      </div>
    </>
  );
};

export default TimeRangePicker;
