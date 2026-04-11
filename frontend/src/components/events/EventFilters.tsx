/*
File: EventFilters.tsx

Contains:
Filter panel component for searching and filtering events.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import Input from "../ui/Input";
import SelectInput from "../ui/SelectorInput";
import { venezuelaCities } from "../../constants/venezuelaCities";

// EventFiltersProps defines controlled filter state and setter callbacks.
interface EventFiltersProps {
	searchTerm: string;
	countryTerm: string;
	cityTerm: string;
	fromDate: string;
	toDate: string;
	onSearchTermChange: (value: string) => void;
	onCountryTermChange: (value: string) => void;
	onCityTermChange: (value: string) => void;
	onFromDateChange: (value: string) => void;
	onToDateChange: (value: string) => void;
}

// countryOptions currently limits selection to Venezuela for consistency
// with available city options.
const countryOptions = [{ value: "Venezuela", label: "Venezuela" }];

// EventFilters renders the search and date/location filter controls.
export default function EventFilters({
	searchTerm,
	countryTerm,
	cityTerm,
	fromDate,
	toDate,
	onSearchTermChange,
	onCountryTermChange,
	onCityTermChange,
	onFromDateChange,
	onToDateChange
}: EventFiltersProps): JSX.Element {
	return (
		<section className="rounded-[0.5rem] border border-slate-700 bg-slate-800/40 p-4">
			<div className="grid gap-4 md:items-end md:[grid-template-columns:minmax(220px,2.2fr)_minmax(180px,1.2fr)_minmax(180px,1.2fr)_minmax(140px,1fr)_minmax(140px,1fr)]">
				<Input
					label="Buscar evento"
					placeholder="Ej. Congreso de Biología"
					value={searchTerm}
					onChange={(e) => onSearchTermChange(e.target.value)}
				/>
				<div>
					<SelectInput
						inputLabel="País"
						value={countryTerm}
						onChange={onCountryTermChange}
						isClearable
						options={countryOptions}
						placeholder="Selecciona"
					/>
				</div>
				<div>
					<SelectInput
						inputLabel="Ciudad"
						value={cityTerm}
						onChange={onCityTermChange}
						isClearable
						options={venezuelaCities.map((city) => ({
							value: city,
							label: city
						}))}
						placeholder="Selecciona"
					/>
				</div>
				<Input
					type="date"
					label="Desde"
					value={fromDate}
					onChange={(e) => onFromDateChange(e.target.value)}
				/>
				<Input
					type="date"
					label="Hasta"
					value={toDate}
					onChange={(e) => onToDateChange(e.target.value)}
				/>
			</div>
		</section>
	);
}