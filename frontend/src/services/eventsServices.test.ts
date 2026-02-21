import axios from "axios";
import { getEvents, createEvent } from "./eventsServices";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("eventsServices", () => {
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
        const payload = { nombre: "New", fecha_inicio: "2023-01-01", fecha_fin: "2023-01-02", ubicacion: "Loc" };

        it("should create event on success", async () => {
            mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { success: true } });

            const result = await createEvent(payload);
            expect(result.status).toBe(200);
            expect(result.data).toEqual({ success: true });
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
});
