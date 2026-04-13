import axios from "axios";
import { getApiBaseUrl } from "../utils/env";
import {
  fetchConversaciones,
  fetchMensajes,
  createConversacion,
  sendMensaje,
  searchUsuarios,
  uploadAdjunto,
  resolveAdjuntoUrl,
} from "./mensajesServices";

jest.mock("axios");
jest.mock("../utils/env", () => ({
  getApiBaseUrl: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetApiBaseUrl = getApiBaseUrl as jest.MockedFunction<
  typeof getApiBaseUrl
>;

describe("mensajesServices", () => {
  describe("fetchConversaciones", () => {
    it("returns conversations on success", async () => {
      const data = [{ id_conversacion: 1, asunto: "Test", participantes: [], updated_at: "" }];
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data });

      const result = await fetchConversaciones(1);
      expect(result.status).toBe(200);
      expect(result.data).toEqual(data);
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/mensajes/conversaciones?user_id=1");
    });

    it("handles 401 error", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401, data: { error: "Unauthorized" } },
      });
      const result = await fetchConversaciones(1);
      expect(result.status).toBe(401);
    });

    it("handles network error", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
      const result = await fetchConversaciones(1);
      expect(result.status).toBe(500);
      expect(result.data.error).toBe("Error de red o desconocido");
    });
  });

  describe("fetchMensajes", () => {
    it("returns messages on success", async () => {
      const data = [{ id_mensaje: 1, id_conversacion: 1, id_remitente: 2, nombre_remitente: "Alice", cuerpo: "Hola", created_at: "" }];
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data });

      const result = await fetchMensajes(1);
      expect(result.status).toBe(200);
      expect(result.data).toEqual(data);
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/mensajes/conversaciones/1/mensajes");
    });

    it("handles 404 error", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { error: "Not found" } },
      });
      const result = await fetchMensajes(99);
      expect(result.status).toBe(404);
    });

    it("handles network error", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
      const result = await fetchMensajes(1);
      expect(result.status).toBe(500);
    });
  });

  describe("createConversacion", () => {
    it("creates conversation on success", async () => {
      const data = { id_conversacion: 1, asunto: "Nueva", participantes: [], updated_at: "" };
      mockedAxios.post.mockResolvedValueOnce({ status: 201, data });

      const result = await createConversacion("Nueva", [1, 2]);
      expect(result.status).toBe(201);
      expect(result.data).toEqual(data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/mensajes/conversaciones",
        { asunto: "Nueva", participante_ids: [1, 2] }
      );
    });

    it("handles validation error", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 400, data: { error: "se requieren al menos 2 participantes" } },
      });
      const result = await createConversacion("X", [1]);
      expect(result.status).toBe(400);
    });

    it("handles network error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));
      const result = await createConversacion("X", [1, 2]);
      expect(result.status).toBe(500);
    });
  });

  describe("sendMensaje", () => {
    it("sends message on success", async () => {
      const data = { id_mensaje: 5, id_conversacion: 1, id_remitente: 2, nombre_remitente: "Bob", cuerpo: "Hola", created_at: "" };
      mockedAxios.post.mockResolvedValueOnce({ status: 201, data });

      const result = await sendMensaje(1, 2, "Hola");
      expect(result.status).toBe(201);
      expect(result.data.cuerpo).toBe("Hola");
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/mensajes/conversaciones/1/mensajes",
        expect.objectContaining({ cuerpo: "Hola", id_remitente: 2 })
      );
    });

    it("sends message with attachment", async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 201, data: {} });
      await sendMensaje(1, 2, "Adjunto", "/uploads/file.pdf", "file.pdf");
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/mensajes/conversaciones/1/mensajes",
        expect.objectContaining({ adjunto_url: "/uploads/file.pdf", adjunto_nombre: "file.pdf" })
      );
    });

    it("handles server error", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 500, data: { error: "Internal error" } },
      });
      const result = await sendMensaje(1, 2, "Hola");
      expect(result.status).toBe(500);
    });

    it("handles network error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));
      const result = await sendMensaje(1, 2, "Hola");
      expect(result.status).toBe(500);
      expect(result.data.error).toBe("Error de red o desconocido");
    });
  });

  describe("searchUsuarios", () => {
    it("returns users on success", async () => {
      const data = [{ id_usuario: 1, nombre: "Alice", email: "alice@test.com" }];
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data });

      const result = await searchUsuarios("alice");
      expect(result.status).toBe(200);
      expect(result.data).toEqual(data);
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/mensajes/usuarios/buscar?q=alice");
    });

    it("encodes special characters in query", async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [] });
      await searchUsuarios("alice garcia");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/api/mensajes/usuarios/buscar?q=alice%20garcia"
      );
    });

    it("handles network error", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
      const result = await searchUsuarios("x");
      expect(result.status).toBe(500);
    });
  });

  describe("uploadAdjunto", () => {
    it("uploads form data without forcing content-type", async () => {
      const file = new File(["pdf-data"], "archivo.pdf", {
        type: "application/pdf",
      });
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: { url: "/uploads/mensajes/abc.pdf", nombre: "archivo.pdf" },
      });

      const result = await uploadAdjunto(file);

      expect(result).toEqual({
        url: "/uploads/mensajes/abc.pdf",
        nombre: "archivo.pdf",
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/mensajes/adjuntos",
        expect.any(FormData),
      );
    });
  });

  describe("resolveAdjuntoUrl", () => {
    it("returns absolute url for relative upload paths", () => {
      mockedGetApiBaseUrl.mockReturnValue("http://localhost:8080/api");
      expect(resolveAdjuntoUrl("/uploads/mensajes/file.pdf")).toBe(
        "http://localhost:8080/uploads/mensajes/file.pdf",
      );
    });

    it("keeps absolute urls unchanged", () => {
      mockedGetApiBaseUrl.mockReturnValue("http://localhost:8080/api");
      expect(resolveAdjuntoUrl("https://cdn.example.com/file.pdf")).toBe(
        "https://cdn.example.com/file.pdf",
      );
    });
  });
});
