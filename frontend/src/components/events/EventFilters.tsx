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