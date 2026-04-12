import { notificationReducer, initialState } from "./reducer";
import {
  CLEAR_NOTIFICATIONS,
  MARK_AS_READ,
  REFRESH_NOTIFICATIONS,
  REMOVE_NOTIFICATION,
} from "./actions";

describe("Notifications reducer", () => {
  const seeded = {
    notifications: [
      { id: 1, type: "inscripcion", title: "A", read: false },
      { id: 2, type: "recordatorio_evento", title: "B", read: false },
    ],
  };

  it("replaces notification list", () => {
    const payload = [{ id: 9, type: "x", read: false }];
    expect(notificationReducer(initialState, { type: REFRESH_NOTIFICATIONS, payload })).toEqual({ notifications: payload });
  });

  it("marks one notification as read", () => {
    const result = notificationReducer(seeded, { type: MARK_AS_READ, payload: 2 });
    expect(result.notifications.find((n) => n.id === 2)?.read).toBe(true);
    expect(result.notifications.find((n) => n.id === 1)?.read).toBe(false);
  });

  it("removes one notification", () => {
    const result = notificationReducer(seeded, { type: REMOVE_NOTIFICATION, payload: 1 });
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].id).toBe(2);
  });

  it("clears all notifications", () => {
    expect(notificationReducer(seeded, { type: CLEAR_NOTIFICATIONS })).toEqual({ notifications: [] });
  });
});
