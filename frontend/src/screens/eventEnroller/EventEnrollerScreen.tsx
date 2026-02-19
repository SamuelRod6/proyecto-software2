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
import {
	normalizeText,
	parseFlexibleDate,
	parseLocationParts,
	toStartOfLocalDay
} from "../../utils/dataParsing";

export default function EventEnrollerScreen(): JSX.Element {
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

	function handleInscripcionClick(idEvento: number) {
		showToast({
			title: "Inscripción pendiente",
			message: `El endpoint de inscripción aún no está listo (evento #${idEvento}).`,
			status: "info"
		});
	}

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
				<div className="mt-6 overflow-hidden rounded-[0.5rem] border border-slate-700 bg-slate-800/40">
					<div className="hidden border-b border-slate-700 bg-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300 md:grid md:gap-2 md:[grid-template-columns:90px_minmax(280px,2fr)_120px_120px_160px_130px_150px]">
						<span>#ID</span>
						<span>Nombre del Evento</span>
						<span>Fecha Inicio</span>
						<span>Fecha Fin</span>
						<span className="text-center">Inscritos</span>
						<span className="text-center">Estado</span>
						<span className="text-center">Acción</span>
					</div>

					{filteredEvents.map((ev, index) => (
						<EventItem
							key={ev.id_evento}
							isLastRow={index === filteredEvents.length - 1}
							id_evento={ev.id_evento}
							nombre={ev.nombre}
							fecha_inicio={ev.fecha_inicio}
							fecha_fin={ev.fecha_fin}
							fecha_cierre_inscripcion={ev.fecha_cierre_inscripcion}
							inscripciones_abiertas={ev.inscripciones_abiertas}
							ubicacion={ev.ubicacion}
							category={ev.category}
							current_enrolled={ev.current_enrolled}
							max_enrolled={ev.max_enrolled}
							is_enrolled={ev.is_enrolled}
							showEnrolledButton
							showActionButton
							onActionClick={handleInscripcionClick}
						/>
					))}
				</div>
			)}
		</section>
	);
}
