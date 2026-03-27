import axios from "axios";
import {
  assignSpeakersToSession,
  createSession,
  getAvailableSpeakers,
  getEventDetail,
  removeSpeakerFromSession,
  updateSession,
} from "./sessionsServices";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("sessionsServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch event detail", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { id_evento: 4, sesiones: [] } });

    const result = await getEventDetail(4);

    expect(result).toEqual({ status: 200, data: { id_evento: 4, sesiones: [] } });
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/eventos?evento_id=4");
  });

  it("should create a session", async () => {
    const data = {
      titulo: "Sesion 1",
      descripcion: "Descripcion",
      fecha_inicio: "2026-03-20T10:00:00.000Z",
      fecha_fin: "2026-03-20T11:00:00.000Z",
      ubicacion: "Caracas",
    };
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { id_sesion: 99 } });

    const result = await createSession(12, data);

    expect(result).toEqual({ status: 200, data: { id_sesion: 99 } });
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/sesiones?evento=12", data);
  });

  it("should get available speakers", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [{ id_usuario: 3, nombre: "Ana" }] });

    const result = await getAvailableSpeakers(50);

    expect(result).toEqual({ status: 200, data: [{ id_usuario: 3, nombre: "Ana" }] });
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/sesiones/ponibles?sesion_id=50");
  });

  it("should assign speakers to session", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 204, data: null });

    const result = await assignSpeakersToSession(50, [1, 2]);

    expect(result).toEqual({ status: 204, data: null });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/sesiones/asignar-ponentes?sesion_id=50",
      { usuarios: [1, 2] },
    );
  });

  it("should update session data", async () => {
    const payload = { titulo: "Sesion actualizada" };
    mockedAxios.put.mockResolvedValueOnce({ status: 200, data: { ok: true } });

    const result = await updateSession(33, payload);

    expect(result).toEqual({ status: 200, data: { ok: true } });
    expect(mockedAxios.put).toHaveBeenCalledWith("/api/sesiones?sesion_id=33", payload);
  });

  it("should remove one speaker from session", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { removed: true } });

    const result = await removeSpeakerFromSession(70, 14);

    expect(result).toEqual({ status: 200, data: { removed: true } });
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/sesiones/quitar-ponente?sesion_id=70&usuario=14");
  });

  it("should normalize network errors", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

    const result = await getEventDetail(1);

    expect(result).toEqual({ status: 500, data: { error: "Error de red o desconocido" } });
  });
});
