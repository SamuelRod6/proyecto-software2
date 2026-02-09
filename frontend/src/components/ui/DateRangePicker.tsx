import React from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale/es";

interface DateRangePickerProps {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    fromLabel?: string;
    toLabel?: string;
    className?: string;
    dayPickerProps?: React.ComponentProps<typeof DayPicker>;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    value,
    onChange,
    fromLabel = "Desde",
    toLabel = "Hasta",
    className = "",
    dayPickerProps = {},
}) => {
    return (
        <div className={className}>
                <DayPicker
                    mode="range"
                    selected={value}
                    onSelect={onChange}
                    locale={es}
                    disabled={date => date < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1)}
                    {...dayPickerProps}
                />
            <div className="flex justify-between mt-2 text-sm text-slate-400">
                <span>{fromLabel}: {value?.from ? value.from.toLocaleDateString() : "-"}</span>
                <span>{toLabel}: {value?.to ? value.to.toLocaleDateString() : "-"}</span>
            </div>
        </div>
    );
};

export default DateRangePicker;
