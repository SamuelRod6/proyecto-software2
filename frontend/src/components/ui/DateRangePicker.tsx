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
    disabledRanges?: { from: Date; to: Date }[];
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
    value,
    onChange,
    fromLabel = "Desde",
    toLabel = "Hasta",
    className = "",
    dayPickerProps = {},
    disabledRanges = [],
}) => {
    // Disable all dates before tomorrow
    const disableBeforeTomorrow = { before: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1) };
    // Combine with any additional disabled ranges passed as props
    const disabled = [disableBeforeTomorrow, ...disabledRanges];
    return (
        <div className={className}>
            <DayPicker
                mode="range"
                selected={value}
                onSelect={onChange}
                locale={es}
                disabled={disabled}
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
