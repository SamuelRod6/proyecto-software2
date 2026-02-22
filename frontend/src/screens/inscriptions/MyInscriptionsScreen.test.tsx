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
    downloadReceipt: jest.fn(async () => ({ status: 200, data: new Blob(["pdf"], { type: "application/pdf" }) })),
    updatePreferences: jest.fn(async () => ({ status: 200, data: { id_usuario: 10, frecuencia: "inmediata", tipos: "estado", habilitado: true } })),
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
});
