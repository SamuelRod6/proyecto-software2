import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MyInscriptionsScreen from "./MyInscriptionsScreen";

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
        data: { id_usuario: 10, frecuencia: "inmediata", tipos: "estado", habilitado: true },
    })),
    getNotifications: jest.fn(async () => ({ status: 200, data: [] })),
    getInscriptionHistory: jest.fn(async () => ({
        status: 200,
        data: [
            {
                id_historial: 33,
                id_inscripcion: 1,
                estado_anterior: "Pendiente",
                estado_nuevo: "Aprobado",
                tipo_cambio: "Retroalimentación",
                nota: "Ajustes solicitados",
                actor: "admin",
                fecha_cambio: "21/02/2026",
            },
        ],
    })),
    downloadInscriptionHistoryPDF: jest.fn(async () => ({
        status: 200,
        data: new Blob(["pdf"], { type: "application/pdf" }),
    })),
    downloadReceipt: jest.fn(async () => ({ status: 200, data: new Blob(["pdf"], { type: "application/pdf" }) })),
    updatePreferences: jest.fn(async () => ({ status: 200, data: { id_usuario: 10, frecuencia: "inmediata", tipos: "estado", habilitado: true } })),
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
        JSON.stringify({ id: 10, name: "Mauricio", email: "mauricio@test.com", role: "USER" })
    );
    if (!window.URL.createObjectURL) {
        window.URL.createObjectURL = jest.fn(() => "blob:mock");
    }
    if (!window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL = jest.fn();
    }
    if (!window.open) {
        window.open = jest.fn();
    }
});

afterEach(() => {
    localStorage.clear();
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
    });

    it("allows receipt download", async () => {
        render(<MyInscriptionsScreen />);

        await waitFor(() => {
            expect(screen.getByText("Descargar comprobante")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Descargar comprobante"));
    });

    it("shows change history fields", async () => {
        render(<MyInscriptionsScreen />);

        await waitFor(() => {
            expect(screen.getByText("Ver historial de cambios")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Ver historial de cambios"));

        await waitFor(() => {
            expect(screen.getByText("Historial de cambios del trabajo científico")).toBeInTheDocument();
            expect(screen.getByText("21/02/2026")).toBeInTheDocument();
            expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0);
            expect(screen.getByText("Aprobado")).toBeInTheDocument();
            expect(screen.getByText("Retroalimentación")).toBeInTheDocument();
            expect(screen.getByText("Ajustes solicitados")).toBeInTheDocument();
        });
    });

    it("applies history filters and search", async () => {
        const { getInscriptionHistory } = jest.requireMock("../../services/inscriptionServices");
        render(<MyInscriptionsScreen />);

        await waitFor(() => {
            expect(screen.getByText("Ver historial de cambios")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Ver historial de cambios"));

        await waitFor(() => {
            expect(screen.getByLabelText("Buscar")).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText("Buscar"), {
            target: { value: "Ajustes" },
        });
        fireEvent.change(screen.getByLabelText("Fecha desde"), {
            target: { value: "2026-02-01" },
        });
        fireEvent.change(screen.getByLabelText("Fecha hasta"), {
            target: { value: "2026-02-28" },
        });

        fireEvent.click(screen.getByText("Aplicar filtros"));

        await waitFor(() => {
            expect(getInscriptionHistory).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    q: "Ajustes",
                    desde: "01/02/2026",
                    hasta: "28/02/2026",
                }),
            );
        });
    });
});
