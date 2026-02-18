import { useEffect, useState } from "react";
// components
import EventItem from "../../components/events/EventItem";
import EventFilters from "../../components/events/EventFilters";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
// contexts
import { useToast } from "../../contexts/Toast/ToastContext";
// animations
import emptyAnimation from "../../assets/animations/empty-animation.json";
// APIs
import { getEvents, Evento } from "../../services/eventsServices";

function toStartOfLocalDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildValidLocalDate(year: number, month: number, day: number): Date | null {
	const candidate = new Date(year, month - 1, day);
	const isValid =
		candidate.getFullYear() === year &&
		candidate.getMonth() === month - 1 &&
		candidate.getDate() === day;

	return isValid ? candidate : null;
}

function parseFlexibleDate(rawValue: string): Date | null {
	if (!rawValue) return null;

	const value = rawValue.trim();

	const ymdMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\b|T|\s)/);
	if (ymdMatch) {
		const [, year, month, day] = ymdMatch;
		return buildValidLocalDate(Number(year), Number(month), Number(day));
	}

	const dmyMatch = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\b|T|\s|$)/);
	if (dmyMatch) {
		const [, day, month, year] = dmyMatch;
		return buildValidLocalDate(Number(year), Number(month), Number(day));
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;

	return toStartOfLocalDay(parsed);
}

function normalizeText(value: string): string {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

function parseLocationParts(location: string): { city: string; country: string } {
	const parts = location
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length >= 2) {
		return {
			city: parts[0],
			country: parts.slice(1).join(", ")
		};
	}

	return {
		city: parts[0] ?? "",
		country: ""
	};
}

export default function EventCatalogScreen(): JSX.Element {
	// states
	const [events, setEvents] = useState<Evento[]>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [countryTerm, setCountryTerm] = useState("");
	const [cityTerm, setCityTerm] = useState("");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	// contexts
	const { showToast } = useToast();
	const today = toStartOfLocalDay(new Date());
	const fromDateValue = fromDate ? parseFlexibleDate(fromDate) : null;
	const toDateValue = toDate ? parseFlexibleDate(toDate) : null;

	const filteredEvents = events.filter((event) => {
		const eventEndDate = parseFlexibleDate(event.fecha_fin);
		const isCurrentOrFutureEvent = !eventEndDate || eventEndDate >= today;
		const eventStartDate = parseFlexibleDate(event.fecha_inicio);
		const { city, country } = parseLocationParts(event.ubicacion);
		const matchesName = event.nombre
			.toLowerCase()
			.includes(searchTerm.trim().toLowerCase());
		const matchesCountry =
			!countryTerm || normalizeText(country) === normalizeText(countryTerm);
		const matchesCity =
			!cityTerm || normalizeText(city) === normalizeText(cityTerm);
		const matchesFromDate =
			!fromDateValue || (!!eventStartDate && eventStartDate >= fromDateValue);
		const matchesToDate =
			!toDateValue || (!!eventStartDate && eventStartDate <= toDateValue);

		return (
			isCurrentOrFutureEvent &&
			matchesName &&
			matchesCountry &&
			matchesCity &&
			matchesFromDate &&
			matchesToDate
		);
	});

	// function to fetch events
	async function fetchEvents() {
		setLoading(true);
		try {
			const { status, data } = await getEvents();
			if (status === 200 && Array.isArray(data)) {
				setEvents(data);
			} else {
				const msg = data?.error || "Error al cargar eventos";
				setError(msg);
				showToast({
					title: "Error",
					message: msg,
					status: "error"
				});
			}
		} catch {
			setError("Error al cargar eventos");
			showToast({
				title: "Error",
				message: "Error al cargar eventos",
				status: "error"
			});
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchEvents();
	}, []);

	return (
		<section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
			<header>
				<div>
					<h1 className="text-2xl font-semibold text-[#F5E427]">
						Eventos científicos
					</h1>
					<p className="text-slate-300">
						Consulta los eventos disponibles y su ubicación.
					</p>
				</div>
			</header>

			<EventFilters
				searchTerm={searchTerm}
				countryTerm={countryTerm}
				cityTerm={cityTerm}
				fromDate={fromDate}
				toDate={toDate}
				onSearchTermChange={setSearchTerm}
				onCountryTermChange={setCountryTerm}
				onCityTermChange={setCityTerm}
				onFromDateChange={setFromDate}
				onToDateChange={setToDate}
			/>
			{loading ? (
					<div className="flex justify-center items-center min-h-[200px] pt-16">
						<Loader visible={true} />
					</div>
			 ) : error ? (
					<ErrorState
						title="Error al cargar los eventos"
						description="Hubo un problema al cargar los eventos. Por favor, recarga para intentarlo nuevamente."
						buttonText="Volver a intentar"
						onRetry={fetchEvents}
					/>
			 ) : events.length === 0 ? (
					<EmptyState
						title="Aún no hay eventos creados"
						description="Cuando existan eventos, los mostraremos en esta sección."
						animationData={emptyAnimation}
					/>
			) : filteredEvents.length === 0 ? (
					<EmptyState
						title="No se encontraron eventos"
						description="Prueba con otro nombre, país, ciudad, rango de fechas o limpia los filtros."
						animationData={emptyAnimation}
					/>
			) : (
				<div className="mt-6">
					{filteredEvents.map(ev => (
						<EventItem
							key={ev.id_evento}
							id_evento={ev.id_evento}
							nombre={ev.nombre}
							fecha_inicio={ev.fecha_inicio}
							fecha_fin={ev.fecha_fin}
							fecha_cierre_inscripcion={ev.fecha_cierre_inscripcion}
							inscripciones_abiertas={ev.inscripciones_abiertas}
							ubicacion={ev.ubicacion}
						/>
					))}
				</div>
			)}
		</section>
	);
}
