import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InscriptionCreateModal from "./InscriptionCreateModal";

jest.mock("../../services/inscriptionServices", () => ({
    createInscription: jest.fn(async () => ({ status: 200, data: { id_inscripcion: 1 } })),
}));

const mockShowToast = jest.fn();

jest.mock("../../contexts/Toast/ToastContext", () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...(jest.requireActual("react-router-dom") as object),
    useNavigate: () => mockNavigate,
}));

describe("InscriptionCreateModal", () => {
    it("shows summary and allows edit", async () => {
        render(
            <InscriptionCreateModal
                open={true}
                onClose={jest.fn()}
                eventoId={1}
                eventoNombre="Evento X"
                userId={10}
                userEmail="mauricio@test.com"
                userName="Mauricio"
            />
        );

        fireEvent.change(screen.getByLabelText("Nombre"), {
            target: { value: "Mauricio Admin" },
        });
        fireEvent.change(screen.getByLabelText("Correo"), {
            target: { value: "mauricio@correo.com" },
        });
        fireEvent.change(screen.getByLabelText("Afiliación"), {
            target: { value: "USB" },
        });

        fireEvent.click(screen.getByText("Revisar inscripción"));
        expect(screen.getByText("Resumen")).toBeInTheDocument();
        expect(screen.getByText(/Mauricio Admin/)).toBeInTheDocument();

        fireEvent.click(screen.getByText("Editar"));
        expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    });

    it("confirms and redirects", async () => {
        render(
            <InscriptionCreateModal
                open={true}
                onClose={jest.fn()}
                eventoId={1}
                eventoNombre="Evento X"
                userId={10}
                userEmail="mauricio@test.com"
                userName="Mauricio"
            />
        );

        fireEvent.change(screen.getByLabelText("Nombre"), {
            target: { value: "Mauricio Admin" },
        });
        fireEvent.change(screen.getByLabelText("Correo"), {
            target: { value: "mauricio@correo.com" },
        });
        fireEvent.change(screen.getByLabelText("Afiliación"), {
            target: { value: "USB" },
        });

        fireEvent.click(screen.getByText("Revisar inscripción"));
        fireEvent.click(screen.getByText("Confirmar inscripción"));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    it("blocks invalid email", async () => {
        render(
            <InscriptionCreateModal
                open={true}
                onClose={jest.fn()}
                eventoId={1}
                eventoNombre="Evento X"
                userId={10}
                userEmail=""
                userName="Mauricio"
            />
        );

        fireEvent.change(screen.getByLabelText("Nombre"), {
            target: { value: "Mauricio Admin" },
        });
        fireEvent.change(screen.getByLabelText("Correo"), {
            target: { value: "correo-invalido" },
        });
        fireEvent.change(screen.getByLabelText("Afiliación"), {
            target: { value: "USB" },
        });

        const reviewBtn = screen.getByText("Revisar inscripción") as HTMLButtonElement;
        expect(reviewBtn.disabled).toBe(true);
    });

    it("blocks invalid file type", async () => {
        render(
            <InscriptionCreateModal
                open={true}
                onClose={jest.fn()}
                eventoId={1}
                eventoNombre="Evento X"
                userId={10}
                userEmail="mauricio@test.com"
                userName="Mauricio"
            />
        );

        const fileInput = screen.getByLabelText("Comprobante de pago (opcional)") as HTMLInputElement;
        const file = new File(["data"], "test.txt", { type: "text/plain" });
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(mockShowToast).toHaveBeenCalled();
    });
});
