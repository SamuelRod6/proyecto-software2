import axios from "axios";
import {
  fetchNotificationsApi,
  markNotificationAsReadApi,
} from "./notificationsServices";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("notificationsServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchNotificationsApi", () => {
    it("should return notifications on success", async () => {
      const payload = [
        {
          id_notificacion: 1,
          id_usuario: 3,
          tipo: "recordatorio_evento",
          mensaje: "El evento inicia manana",
          leida: false,
          createdAt: "2026-03-10T10:00:00Z",
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: payload });

      const result = await fetchNotificationsApi(3);

      expect(result).toEqual({ status: 200, data: payload });
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/notifications/user/3");
    });

    it("should return backend error response", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { error: "No hay notificaciones" } },
      });

      const result = await fetchNotificationsApi(3);

      expect(result).toEqual({ status: 404, data: { error: "No hay notificaciones" } });
    });
  });

  describe("markNotificationAsReadApi", () => {
    it("should mark notification as read", async () => {
      mockedAxios.patch.mockResolvedValueOnce({
        status: 200,
        data: { message: "ok" },
      });

      const result = await markNotificationAsReadApi(11);

      expect(result).toEqual({ status: 200, data: { message: "ok" } });
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/api/notifications/11/leida",
        { leida: true },
      );
    });

    it("should handle network errors", async () => {
      mockedAxios.patch.mockRejectedValueOnce(new Error("Network Error"));

      const result = await markNotificationAsReadApi(11);

      expect(result).toEqual({
        status: 500,
        data: { error: "Error de red o desconocido" },
      });
    });
  });
});
