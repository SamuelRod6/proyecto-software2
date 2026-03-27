import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EventCreateModal from "./EventCreateModal";

const mockCreateEvent = jest.fn();
const mockFetchFechasOcupadas = jest.fn();
const mockShowToast = jest.fn();
const mockShowLoader = jest.fn();
const mockHideLoader = jest.fn();

jest.mock("../../services/eventsServices", () => ({
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  fetchFechasOcupadas: (...args: unknown[]) => mockFetchFechasOcupadas(...args),
}));

jest.mock("../../contexts/Toast/ToastContext", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("../../contexts/Loader/LoaderContext", () => ({
  useLoader: () => ({ showLoader: mockShowLoader, hideLoader: mockHideLoader }),
}));

jest.mock("../ui/DateRangePicker", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (range: { from: Date; to: Date }) => void }) => (
    <button type="button" onClick={() => onChange({ from: new Date(2027, 2, 10), to: new Date(2027, 2, 12) })}>
      Seleccionar rango
    </button>
  ),
}));

jest.mock("../ui/DayPickerSingle", () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect(new Date(2027, 2, 9))}>
      Seleccionar cierre
    </button>
  ),
}));

jest.mock("../ui/SelectorInput", () => ({
  __esModule: true,
  default: ({ inputLabel, onChange }: { inputLabel: string; onChange: (value: string) => void }) => (
    <button type="button" onClick={() => onChange(inputLabel === "País" ? "Venezuela" : "Caracas")}>
      {inputLabel}
    </button>
  ),
}));

describe("EventCreateModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFechasOcupadas.mockResolvedValue({ status: 200, data: [] });
    mockCreateEvent.mockResolvedValue({ status: 200, data: { id_evento: 1 } });
  });

  it("fetches occupied dates when opened and creates an event with the expected payload", async () => {
    const onClose = jest.fn();

    render(<EventCreateModal open={true} onClose={onClose} />);

    await waitFor(() => {
      expect(mockFetchFechasOcupadas).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText("Ej: Expo de galaxias"), {
      target: { value: "Congreso Cientifico" },
    });
    fireEvent.click(screen.getByText("Seleccionar rango"));
    fireEvent.click(screen.getByText("País"));
    fireEvent.click(screen.getByText("Ciudad"));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    fireEvent.click(screen.getByText("Seleccionar cierre"));
    fireEvent.click(screen.getByRole("button", { name: "Crear evento" }));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        nombre: "Congreso Cientifico",
        fecha_inicio: "10/03/2027 00:00:00",
        fecha_fin: "12/03/2027 23:59:00",
        ubicacion: "Caracas, Venezuela",
        fecha_cierre_inscripcion: "09/03/2027 23:59:00",
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Evento creado",
        status: "success",
      }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(mockShowLoader).toHaveBeenCalled();
    expect(mockHideLoader).toHaveBeenCalled();
  });
});