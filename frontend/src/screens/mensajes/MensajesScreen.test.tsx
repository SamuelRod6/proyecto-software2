import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MensajesScreen from "./MensajesScreen";

jest.mock("../../services/mensajesServices", () => ({
  fetchConversaciones: jest.fn(async () => ({
    status: 200,
    data: [
      {
        id_conversacion: 1,
        asunto: "Proyecto Final",
        participantes: [
          { id_usuario: 2, nombre: "Bob Participante", email: "bob@test.com" },
        ],
        ultimo_mensaje: {
          id_mensaje: 1,
          id_conversacion: 1,
          id_remitente: 2,
          nombre_remitente: "Bob Participante",
          cuerpo: "Hola, cómo estás?",
          created_at: "2026-03-12T10:00:00Z",
        },
        updated_at: "2026-03-12T10:00:00Z",
      },
    ],
  })),
  createConversacion: jest.fn(async () => ({
    status: 201,
    data: { id_conversacion: 2, asunto: "Nueva", participantes: [], updated_at: "" },
  })),
  searchUsuarios: jest.fn(async () => ({ status: 200, data: [] })),
}));

jest.mock("../../contexts/Auth/Authcontext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Alice Admin", email: "alice@test.com", roles: [{ id: 1, name: "ADMIN" }] },
    isAuthenticated: true,
  }),
}));

const renderScreen = () =>
  render(
    <MemoryRouter>
      <MensajesScreen />
    </MemoryRouter>
  );

describe("MensajesScreen", () => {
  it("shows conversation list after load", async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText("Proyecto Final")).toBeInTheDocument();
    });
    expect(screen.getByText("Hola, cómo estás?")).toBeInTheDocument();
  });

  it("shows participant names below the subject", async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText("Bob Participante")).toBeInTheDocument();
    });
  });

  it("shows empty state when no conversations", async () => {
    const { fetchConversaciones } = require("../../services/mensajesServices");
    fetchConversaciones.mockResolvedValueOnce({ status: 200, data: [] });

    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/No tienes conversaciones/)).toBeInTheDocument();
    });
  });

  it("shows Nueva conversación button", async () => {
    renderScreen();
    expect(screen.getByText("+ Nueva conversación")).toBeInTheDocument();
  });

  it("opens modal on Nueva conversación click", async () => {
    renderScreen();
    fireEvent.click(screen.getByText("+ Nueva conversación"));
    await waitFor(() => {
      expect(screen.getByText("Crear conversación")).toBeInTheDocument();
    });
  });
});
