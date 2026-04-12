import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ScientificWorksScreen from "./ScientificWorksScreen";

const mockShowToast = jest.fn();
const mockCreateScientificWork = jest.fn();
const mockListScientificWorks = jest.fn();
const mockGetEvents = jest.fn();
const mockListScientificWorkVersions = jest.fn();
const mockGetScientificWorkHistory = jest.fn();
const mockDownloadScientificWorkHistoryPDF = jest.fn();

jest.mock("../../contexts/Toast/ToastContext", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("../../utils/accessControl", () => ({
  getStoredAuthUser: () => ({ id: 10, name: "Laura" }),
}));

jest.mock("../../services/scientificWorkServices", () => ({
  listScientificWorks: (...args: unknown[]) => mockListScientificWorks(...args),
  createScientificWork: (...args: unknown[]) => mockCreateScientificWork(...args),
  uploadScientificWorkVersion: jest.fn(),
  listScientificWorkVersions: (...args: unknown[]) => mockListScientificWorkVersions(...args),
  compareScientificWorkVersions: jest.fn(),
  downloadScientificWorkVersion: jest.fn(),
  getScientificWorkHistory: (...args: unknown[]) => mockGetScientificWorkHistory(...args),
  downloadScientificWorkHistoryPDF: (...args: unknown[]) => mockDownloadScientificWorkHistoryPDF(...args),
}));

jest.mock("../../services/eventsServices", () => ({
  getEvents: (...args: unknown[]) => mockGetEvents(...args),
}));

describe("ScientificWorksScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListScientificWorks.mockResolvedValue({ status: 200, data: [] });
    mockGetEvents.mockResolvedValue({
      status: 200,
      data: [{ id_evento: 4, nombre: "Congreso Andino" }],
    });
    mockCreateScientificWork.mockResolvedValue({ status: 200, data: { ok: true } });
    mockListScientificWorkVersions.mockResolvedValue({ status: 200, data: [] });
    mockGetScientificWorkHistory.mockResolvedValue({ status: 200, data: [] });
    mockDownloadScientificWorkHistoryPDF.mockResolvedValue({ status: 200, data: new Blob(["pdf"]) });
  });

  it("blocks work creation when the title contains numbers", async () => {
    const summary = Array.from({ length: 100 }, (_, index) => `palabra${index}`).join(" ");

    render(<ScientificWorksScreen />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Adjuntar trabajo" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Adjuntar trabajo" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Trabajo 2026" },
    });
    fireEvent.change(screen.getByPlaceholderText("Describe objetivos, metodología, resultados y conclusiones."), {
      target: { value: summary },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    const pdfFile = new File(["pdf"], "trabajo.pdf", { type: "application/pdf" });
    const fileInput = screen
      .getByText("Archivo PDF")
      .closest("label")
      ?.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: { files: [pdfFile] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enviar trabajo" }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Validación",
          message: "El título solo puede contener letras y espacios.",
          status: "error",
        }),
      );
    });

    expect(mockCreateScientificWork).not.toHaveBeenCalled();
  });

  it("renders status change history in work history modal", async () => {
    mockListScientificWorks.mockResolvedValueOnce({
      status: 200,
      data: [
        {
          id_trabajo: 20,
          id_evento: 4,
          id_usuario: 10,
          titulo: "Trabajo de Prueba",
          resumen: "Resumen de prueba",
          version_actual: 1,
          estado: "PENDIENTE_REVISION",
          fecha_ultimo_envio: "11/04/2026",
          archivo_actual: { id_version: 31 },
        },
      ],
    });

    render(<ScientificWorksScreen />);

    await waitFor(() => {
      expect(screen.getByText("Trabajo de Prueba")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver historial" }));

    await waitFor(() => {
      expect(screen.getByText("Historial de cambios de estado")).toBeInTheDocument();
    });

    expect(mockGetScientificWorkHistory).toHaveBeenCalledWith(20, 10, {});
  });
});