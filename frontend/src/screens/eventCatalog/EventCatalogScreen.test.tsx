import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventCatalogScreen from "./EventCatalogScreen";
import { getEvents } from "../../services/eventsServices";
import { useToast } from "../../contexts/Toast/ToastContext";

jest.mock("../../services/eventsServices", () => ({
	getEvents: jest.fn(),
}));

jest.mock("../../contexts/Toast/ToastContext", () => ({
	useToast: jest.fn(),
}));

jest.mock("../../components/events/EventFilters", () => {
	return function MockEventFilters({
		searchTerm,
		onSearchTermChange,
	}: {
		searchTerm: string;
		onSearchTermChange: (value: string) => void;
	}) {
		return (
			<div>
				<label htmlFor="search-input">Buscar evento</label>
				<input
					id="search-input"
					value={searchTerm}
					onChange={(event) => onSearchTermChange(event.target.value)}
				/>
			</div>
		);
	};
});

jest.mock("../../components/events/EventItem", () => {
	return function MockEventItem({
		id_evento,
		nombre,
		onActionClick,
	}: {
		id_evento: number;
		nombre: string;
		onActionClick?: (id: number) => void;
	}) {
		return (
			<div data-testid="event-row">
				<span>{nombre}</span>
				<button type="button" onClick={() => onActionClick?.(id_evento)}>
					Inscribir
				</button>
			</div>
		);
	};
});

jest.mock("../../components/ui/Loader", () => {
	return function MockLoader() {
		return <div>Cargando...</div>;
	};
});

jest.mock("../../components/ui/EmptyState", () => {
	return function MockEmptyState({ title }: { title: string }) {
		return <div>{title}</div>;
	};
});

type MockedGetEvents = jest.MockedFunction<typeof getEvents>;
type MockedUseToast = jest.MockedFunction<typeof useToast>;

const mockedGetEvents = getEvents as MockedGetEvents;
const mockedUseToast = useToast as MockedUseToast;

const showToastMock = jest.fn();

const baseEvent = {
	id_evento: 1,
	nombre: "Evento Base",
	fecha_inicio: "2026-05-01",
	fecha_fin: "2026-05-03",
	fecha_cierre_inscripcion: "2026-04-25",
	inscripciones_abiertas: true,
	ubicacion: "Caracas, Venezuela",
};

describe("EventCatalogScreen", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUseToast.mockReturnValue({ showToast: showToastMock });
	});

	it("muestra solo eventos vigentes o futuros", async () => {
		mockedGetEvents.mockResolvedValueOnce({
			status: 200,
			data: [
				{ ...baseEvent, id_evento: 11, nombre: "Evento Pasado", fecha_fin: "2020-01-01" },
				{ ...baseEvent, id_evento: 12, nombre: "Evento Futuro", fecha_fin: "2099-01-01" },
			],
		});

		render(<EventCatalogScreen />);

		expect(await screen.findByText("Evento Futuro")).toBeInTheDocument();
		expect(screen.queryByText("Evento Pasado")).not.toBeInTheDocument();
	});

	it("filtra por nombre usando el panel de búsqueda", async () => {
		const user = userEvent.setup();
		mockedGetEvents.mockResolvedValueOnce({
			status: 200,
			data: [
				{ ...baseEvent, id_evento: 21, nombre: "Congreso de Biología", fecha_fin: "2099-01-01" },
				{ ...baseEvent, id_evento: 22, nombre: "Simposio de Química", fecha_fin: "2099-01-01" },
			],
		});

		render(<EventCatalogScreen />);
		expect(await screen.findByText("Congreso de Biología")).toBeInTheDocument();

		await user.type(screen.getByLabelText("Buscar evento"), "química");

		await waitFor(() => {
			expect(screen.queryByText("Congreso de Biología")).not.toBeInTheDocument();
			expect(screen.getByText("Simposio de Química")).toBeInTheDocument();
		});
	});

	it("muestra estado de error y dispara toast si falla la carga", async () => {
		mockedGetEvents.mockResolvedValueOnce({
			status: 500,
			data: { error: "Fallo backend" },
		});

		render(<EventCatalogScreen />);

		expect(await screen.findByText("Error al cargar los eventos")).toBeInTheDocument();
		expect(showToastMock).toHaveBeenCalledWith({
			title: "Error",
			message: "Fallo backend",
			status: "error",
		});
	});

	it("al hacer clic en inscribir muestra toast informativo", async () => {
		const user = userEvent.setup();
		mockedGetEvents.mockResolvedValueOnce({
			status: 200,
			data: [{ ...baseEvent, id_evento: 99, nombre: "Evento Inscripción", fecha_fin: "2099-01-01" }],
		});

		render(<EventCatalogScreen />);
		expect(await screen.findByText("Evento Inscripción")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Inscribir" }));

		expect(showToastMock).toHaveBeenCalledWith({
			title: "Inscripción pendiente",
			message: "El endpoint de inscripción aún no está listo (evento #99).",
			status: "info",
		});
	});
});
