import axios from "axios";
import {
    createEvent,
    deleteEvent,
    fetchFechasOcupadas,
    getEvents,
    patchEvent,
    patchInscriptionDate,
} from "./eventsServices";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("eventsServices", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getEvents", () => {
        it("should return events on success", async () => {
            const mockEvents = [
                { id_evento: 1, nombre: "Event 1", fecha_inicio: "2023-01-01", fecha_fin: "2023-01-02", ubicacion: "Loc 1" }
            ];
            mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockEvents });

            const result = await getEvents();
            expect(result.status).toBe(200);
            expect(result.data).toEqual(mockEvents);
            expect(mockedAxios.get).toHaveBeenCalledWith("/api/eventos");
        });

        it("should handle 404 error", async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 404, data: { error: "No eventos" } }
            });

            const result = await getEvents();
            expect(result.status).toBe(404);
            expect(result.data).toEqual({ error: "No eventos" });
        });

        it("should handle network error", async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

            const result = await getEvents();
            expect(result.status).toBe(500);
            expect(result.data.error).toBe("Error de red o desconocido");
        });
    });

    describe("createEvent", () => {
        const payload = {
            nombre: "New",
            fecha_inicio: "2023-01-01",
            fecha_fin: "2023-01-02",
            fecha_cierre_inscripcion: "2022-12-30",
            ubicacion: "Loc",
        };

        it("should create event on success", async () => {
            mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { success: true } });

            const result = await createEvent(payload);
            expect(result.status).toBe(200);
            expect(result.data).toEqual({ success: true });
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/eventos", payload);
        });

        it("should handle validation error", async () => {
            mockedAxios.post.mockRejectedValueOnce({
                response: { status: 400, data: { error: "Invalid" } }
            });

            const result = await createEvent(payload);
            expect(result.status).toBe(400);
            expect(result.data).toEqual({ error: "Invalid" });
        });
    });

    describe("patchEvent", () => {
        const payload = {
            nombre: "Evento Editado",
            fecha_inicio: "2026-04-01",
            fecha_fin: "2026-04-02",
            fecha_cierre_inscripcion: "2026-03-30",
            ubicacion: "Caracas, Venezuela",
        };

        it("should patch an event successfully", async () => {
            mockedAxios.put.mockResolvedValueOnce({ status: 200, data: { updated: true } });

            const result = await patchEvent(12, payload);

            expect(result).toEqual({ status: 200, data: { updated: true } });
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/eventos?id=12", payload);
        });
    });

    describe("patchInscriptionDate", () => {
        it("should patch inscription action successfully", async () => {
            mockedAxios.patch.mockResolvedValueOnce({ status: 200, data: { ok: true } });

            const result = await patchInscriptionDate(7, "abrir");

            expect(result).toEqual({ status: 200, data: { ok: true } });
            expect(mockedAxios.patch).toHaveBeenCalledWith("/api/eventos?id=7&action=abrir");
        });

        it("should return backend error for patch inscription action", async () => {
            mockedAxios.patch.mockRejectedValueOnce({
                response: { status: 409, data: { error: "Estado inválido" } },
            });

            const result = await patchInscriptionDate(7, "cerrar");

            expect(result).toEqual({ status: 409, data: { error: "Estado inválido" } });
        });
    });

    describe("deleteEvent", () => {
        it("should delete an event successfully", async () => {
            mockedAxios.delete.mockResolvedValueOnce({ status: 204, data: null });

            const result = await deleteEvent(99);

            expect(result).toEqual({ status: 204, data: null });
            expect(mockedAxios.delete).toHaveBeenCalledWith("/api/eventos?id=99");
        });
    });

    describe("fetchFechasOcupadas", () => {
        it("should fetch occupied date ranges", async () => {
            const mockRanges = [
                { fecha_inicio: "01/03/2026", fecha_fin: "03/03/2026" },
                { fecha_inicio: "10/03/2026", fecha_fin: "11/03/2026" },
            ];
            mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockRanges });

            const result = await fetchFechasOcupadas();

            expect(result).toEqual({ status: 200, data: mockRanges });
            expect(mockedAxios.get).toHaveBeenCalledWith("/api/eventos/fechas-ocupadas");
        });

        it("should handle network errors for occupied dates", async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

            const result = await fetchFechasOcupadas();

            expect(result.status).toBe(500);
            expect(result.data.error).toBe("Error de red o desconocido");
        });
    });
});
