import {
  CLEAR_NOTIFICATIONS,
  MARK_AS_READ,
  REFRESH_NOTIFICATIONS,
  REMOVE_NOTIFICATION,
  clearNotifications,
  fetchNotifications,
  markAsRead,
  refreshNotifications,
  removeNotification,
} from "./actions";
import { fetchNotificationsApi } from "../../services/notificationsServices";

jest.mock("../../services/notificationsServices", () => ({
  fetchNotificationsApi: jest.fn(),
}));

const mockedFetchNotificationsApi = fetchNotificationsApi as jest.MockedFunction<typeof fetchNotificationsApi>;

describe("Notifications actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates basic notification actions", () => {
    expect(refreshNotifications([{ id: 1 }])).toEqual({ type: REFRESH_NOTIFICATIONS, payload: [{ id: 1 }] });
    expect(markAsRead(3)).toEqual({ type: MARK_AS_READ, payload: 3 });
    expect(removeNotification("9")).toEqual({ type: REMOVE_NOTIFICATION, payload: "9" });
    expect(clearNotifications()).toEqual({ type: CLEAR_NOTIFICATIONS });
  });

  it("maps API notifications and resolves default title by type", async () => {
    mockedFetchNotificationsApi.mockResolvedValue({
      status: 200,
      data: [
        {
          id: 1,
          type: "inscripcion",
          title: "   ",
          read: false,
          event_id: 20,
          message: "Inscrito",
          created_at: "2026-04-12",
        },
        {
          id: 2,
          type: "ROLE_UPDATE",
          title: "  Cambio manual  ",
          read: true,
          event_id: null,
          message: "Roles cambiados",
          created_at: "2026-04-12",
        },
      ],
    } as never);

    const result = await fetchNotifications(8);

    expect(result).toEqual([
      {
        id: 1,
        type: "inscripcion",
        title: "Inscripcion Exitosa",
        read: false,
        eventId: 20,
        content: "Inscrito",
        createdAt: "2026-04-12",
      },
      {
        id: 2,
        type: "ROLE_UPDATE",
        title: "Cambio manual",
        read: true,
        eventId: null,
        content: "Roles cambiados",
        createdAt: "2026-04-12",
      },
    ]);
  });

  it("returns empty array on non-200 API result", async () => {
    mockedFetchNotificationsApi.mockResolvedValue({ status: 500, data: { message: "error" } } as never);

    await expect(fetchNotifications(5)).resolves.toEqual([]);
  });
});
