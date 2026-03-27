import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CreateSessionModal from "./CreateSessionModal";

const mockCreateSession = jest.fn();
const mockGetAvailableSpeakers = jest.fn();
const mockAssignSpeakersToSession = jest.fn();
const mockShowToast = jest.fn();
const mockShowLoader = jest.fn();
const mockHideLoader = jest.fn();

jest.mock("../../services/sessionsServices", () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  getAvailableSpeakers: (...args: unknown[]) => mockGetAvailableSpeakers(...args),
  assignSpeakersToSession: (...args: unknown[]) => mockAssignSpeakersToSession(...args),
  getEventDetail: jest.fn(),
}));

jest.mock("../../contexts/Toast/ToastContext", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("../../contexts/Loader/LoaderContext", () => ({
  useLoader: () => ({ showLoader: mockShowLoader, hideLoader: mockHideLoader }),
}));

jest.mock("../ui/DayPickerSingle", () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelect(new Date(2027, 3, 15))}>
      Seleccionar fecha valida
    </button>
  ),
}));

jest.mock("../ui/TimeRangePicker", () => ({
  __esModule: true,
  default: () => <div>Time range picker</div>,
}));

jest.mock("../ui/SelectorInput", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (value: string) => void }) => (
    <button type="button" onClick={() => onChange("7")}>
      Escoger ponente
    </button>
  ),
}));

describe("CreateSessionModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSession.mockResolvedValue({ status: 200, data: { id_sesion: 99 } });
    mockGetAvailableSpeakers.mockResolvedValue({
      status: 200,
      data: [{ id_usuario: 7, nombre: "Laura Perez", email: "laura@test.com" }],
    });
    mockAssignSpeakersToSession.mockResolvedValue({ status: 204, data: null });
  });

  it("creates a session and advances to speaker assignment", async () => {
    render(
      <CreateSessionModal
        open={true}
        onClose={jest.fn()}
        onSessionCreated={jest.fn()}
        event={{
          id_evento: 22,
          id: 22,
          ubicacion: "Caracas, Venezuela",
          fecha_inicio: "15/04/2027",
          fecha_fin: "16/04/2027",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Sesion magistral" },
    });
    fireEvent.click(screen.getByText("Seleccionar fecha valida"));
    fireEvent.click(screen.getByRole("button", { name: "Crear Sesión" }));

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith(
        22,
        expect.objectContaining({
          titulo: "Sesion magistral",
          ubicacion: "Caracas, Venezuela",
        }),
      );
    });

    await waitFor(() => {
      expect(mockGetAvailableSpeakers).toHaveBeenCalledWith(99);
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Sesión creada",
        status: "info",
      }),
    );
    expect(screen.getByRole("button", { name: "Asignar Ponente" })).toBeDisabled();
  });
});