import { render, screen, waitFor } from "@testing-library/react";
import MyInscriptionsScreen from "./MyInscriptionsScreen";

let anchorClickSpy: jest.SpyInstance;

jest.mock("../../services/inscriptionServices", () => ({
  getInscriptions: jest.fn(async () => ({
    status: 200,
    data: [
      {
        id_inscripcion: 1,
        id_evento: 2,
        evento_nombre: "Evento A",
        id_usuario: 10,
        nombre_participante: "Mauricio",
        email: "mauricio@test.com",
        afiliacion: "USB",
        comprobante_pago: null,
        fecha_inscripcion: "20/02/2026",
        fecha_limite_pago: "25/02/2026",
        estado: "Pendiente",
      },
    ],
  })),
  getPreferences: jest.fn(async () => ({
    status: 200,
    data: {
      id_usuario: 10,
      frecuencia: "inmediata",
      tipos: "estado",
      habilitado: true,
    },
  })),
  getNotifications: jest.fn(async () => ({ status: 200, data: [] })),
  downloadReceipt: jest.fn(async () => ({
    status: 200,
    data: new Blob(["pdf"], { type: "application/pdf" }),
  })),
  updatePreferences: jest.fn(async () => ({
    status: 200,
    data: {
      id_usuario: 10,
      frecuencia: "inmediata",
      tipos: "estado",
      habilitado: true,
    },
  })),
}));

jest.mock("../../services/inscripcionesServices", () => ({
  getInscripciones: jest.fn(async () => ({
    status: 200,
    data: { eventos_inscritos: [] },
  })),
}));

jest.mock("../../contexts/Toast/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

beforeEach(() => {
  localStorage.setItem(
    "auth-user",
    JSON.stringify({
      id: 10,
      name: "Mauricio",
      email: "mauricio@test.com",
      role: "USER",
    }),
  );
  if (!globalThis.URL.createObjectURL) {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:mock");
  }
  if (!globalThis.URL.revokeObjectURL) {
    globalThis.URL.revokeObjectURL = jest.fn();
  }
  if (!globalThis.open) {
    globalThis.open = jest.fn();
  }
  anchorClickSpy = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
});

afterEach(() => {
  localStorage.clear();
  anchorClickSpy.mockRestore();
});

describe("MyInscriptionsScreen", () => {
  it("shows inscription status and dates", async () => {
    render(<MyInscriptionsScreen />);

    await waitFor(() => {
      expect(screen.getByText("Evento A")).toBeInTheDocument();
    });

    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText(/20\/02\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/25\/02\/2026/)).toBeInTheDocument();

    expect(
      screen.queryByText("Ver historial de cambios"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Historial de cambios del trabajo científico"),
    ).not.toBeInTheDocument();
  });
});
