import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InscriptionAdminScreen from "./InscriptionAdminScreen";

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
    updateInscriptionStatus: jest.fn(async () => ({ status: 200, data: {} })),
}));

jest.mock("../../services/eventsServices", () => ({
    getEvents: jest.fn(async () => ({
        status: 200,
        data: [{ id_evento: 2, nombre: "Evento A" }],
    })),
}));

jest.mock("../../contexts/Toast/ToastContext", () => ({
    useToast: () => ({ showToast: jest.fn() }),
}));

beforeEach(() => {
    localStorage.setItem(
        "auth-user",
        JSON.stringify({ id: 10, name: "Admin", email: "admin@test.com", role: "ADMIN" })
    );
});

afterEach(() => {
    localStorage.clear();
});

describe("InscriptionAdminScreen", () => {
    it("updates status with note", async () => {
        const { updateInscriptionStatus } = jest.requireMock("../../services/inscriptionServices");
        render(<InscriptionAdminScreen />);

        await waitFor(() => {
            expect(screen.getByText("Mauricio")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Mauricio"));
        const statusInput = screen.getAllByRole("combobox")[2] as HTMLInputElement;
        fireEvent.change(statusInput, { target: { value: "Pagado" } });
        fireEvent.change(screen.getByLabelText("Notas"), {
            target: { value: "Validado" },
        });
        fireEvent.click(screen.getByText("Guardar"));

        await waitFor(() => {
            expect(updateInscriptionStatus).toHaveBeenCalled();
        });
    });
});
