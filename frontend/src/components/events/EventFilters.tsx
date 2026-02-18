import Input from "../ui/Input";
import SelectInput from "../ui/SelectorInput";
import { venezuelaCities } from "../../constants/venezuelaCities";

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

const countryOptions = [{ value: "Venezuela", label: "Venezuela" }];

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
		<div className="grid gap-4 md:items-end md:[grid-template-columns:3fr_2fr_2fr_1fr_1fr]">
			<Input
				label="Buscar por nombre"
				placeholder="Ej. Congreso de Biología"
				value={searchTerm}
				onChange={(e) => onSearchTermChange(e.target.value)}
			/>
			<div>
				<SelectInput
					inputLabel="Filtrar por país"
					value={countryTerm}
					onChange={onCountryTermChange}
					isClearable
					options={countryOptions}
					placeholder="Selecciona un país"
				/>
			</div>
			<div>
				<SelectInput
					inputLabel="Filtrar por ciudad"
					value={cityTerm}
					onChange={onCityTermChange}
					isClearable
					options={venezuelaCities.map((city) => ({
						value: city,
						label: city
					}))}
					placeholder="Selecciona una ciudad"
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
	);
}
