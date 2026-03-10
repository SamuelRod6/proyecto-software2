// Estilo para rc-time-picker dropdown
const dropdownStyle = `
.rc-time-picker-panel {
  margin-top: 14px !important;
  z-index: 9999;
  min-width: 360px !important;
}
.rc-time-picker-panel-inner {
  background: #1e293b !important;
  border: 1px solid #334155 !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 10px 25px rgba(2, 6, 23, 0.45) !important;
  width: 100% !important;
  min-width: 360px !important;
}
.rc-time-picker-panel-input-wrap {
  border-bottom: 1px solid #334155 !important;
}
.rc-time-picker-panel-input {
  background: #0f172a !important;
  border: 1px solid #334155 !important;
  color: #e2e8f0 !important;
}
.rc-time-picker-panel-input::placeholder {
  color: #94a3b8 !important;
}
.rc-time-picker-panel-select {
  border-right: 1px solid #334155 !important;
  width: 50% !important;
  max-width: none !important;
}
.rc-time-picker-panel-select:last-child {
  border-right: none !important;
}
.rc-time-picker-panel-select ul {
  background: #1e293b !important;
  width: 100% !important;
}
.rc-time-picker-panel-select li {
  color: #cbd5e1 !important;
  padding: 0 14px !important;
}
.rc-time-picker-panel-select li:hover {
  background: #334155 !important;
}
.rc-time-picker-panel-select li.rc-time-picker-panel-select-option-selected {
  background: #facc15 !important;
  color: #0f172a !important;
  font-weight: 600;
}
.rc-time-picker-panel-select li.rc-time-picker-panel-select-option-disabled {
  color: #64748b !important;
}
.rc-time-picker-panel-select-arrow {
  border-color: #0f172a !important;
}
.rc-time-picker-panel-select-handler {
  background: #1e293b !important;
  border-color: #334155 !important;
}
.rc-time-picker-panel-select-handler:hover {
  background: #334155 !important;
}
.rc-time-picker-panel-select-handler-up-inner {
  border-width: 0 5px 6px 5px !important;
  border-color: transparent transparent #0f172a transparent !important;
}
.rc-time-picker-panel-select-handler-down-inner {
  border-width: 6px 5px 0 5px !important;
  border-color: #0f172a transparent transparent transparent !important;
}
.session-time-picker {
  width: 100%;
}
.session-time-picker .rc-time-picker-input {
  width: 100%;
  height: 40px;
  border-radius: 0.5rem;
  border: 1px solid #334155;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.session-time-picker .rc-time-picker-input::placeholder {
  color: #94a3b8;
}
.session-time-picker .rc-time-picker-input:focus {
  outline: none;
  border-color: #facc15;
  box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.2);
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
        <label className="text-slate-300 font-medium mb-1">Hora de inicio</label>
        <div className="relative">
          <TimePicker
            showSecond={false}
            value={horaInicio ? moment(horaInicio, "HH:mm") : undefined}
            onChange={val => setHoraInicio(val ? val.format("HH:mm") : "08:00")}
            className="session-time-picker"
            inputReadOnly={false}
            format="HH:mm"
            placeholder="hh:mm"
            allowEmpty={false}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-slate-300 font-medium mb-1">Hora de fin</label>
        <div className="relative">
          <TimePicker
            showSecond={false}
            value={horaFin ? moment(horaFin, "HH:mm") : undefined}
            onChange={val => setHoraFin(val ? val.format("HH:mm") : "09:00")}
            className="session-time-picker"
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
