import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale/es";

interface DayPickerSingleProps {
	selected: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	maxDate?: Date;
	disabled?: (date: Date) => boolean;
	className?: string;
}
export default function DayPickerSingle({ 
	selected, 
	onSelect, 
	maxDate,
	disabled, 
	className = "" 
}: DayPickerSingleProps) {
	const combinedDisabled = (date: Date) => {
		if (maxDate && date > maxDate) return true;
		if (disabled) return disabled(date);
		return false;
	};
	return (
		<div className={className}>
			<DayPicker
				mode="single"
				selected={selected}
				onSelect={onSelect}
				disabled={combinedDisabled}
				showOutsideDays
				locale={es}
			/>
		</div>
	);
}
