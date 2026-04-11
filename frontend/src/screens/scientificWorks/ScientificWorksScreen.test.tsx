/*
File: ScientificWorksScreen.test.tsx

Contains:
Validation test for scientific work creation form constraints.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ScientificWorksScreen from "./ScientificWorksScreen";

const mockShowToast = jest.fn();
const mockCreateScientificWork = jest.fn();
const mockListScientificWorks = jest.fn();
const mockGetEvents = jest.fn();

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
  listScientificWorkVersions: jest.fn(),
  compareScientificWorkVersions: jest.fn(),
  downloadScientificWorkVersion: jest.fn(),
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
  });

  it("blocks work creation when the title contains numbers", async () => {
    // Build a valid 100-word summary and keep only title rule failing.
    const summary = Array.from({ length: 100 }, (_, index) => `palabra${index}`).join(" ");

    render(<ScientificWorksScreen />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Adjuntar trabajo" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Adjuntar trabajo" }));
    const eventCombobox = screen.getAllByRole("combobox")[1];
    fireEvent.mouseDown(eventCombobox);
    fireEvent.click(screen.getByText("Congreso Andino"));
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

    // The submit path must stop on title validation before calling service.
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
});