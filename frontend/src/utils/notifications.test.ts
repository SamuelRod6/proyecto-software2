import {
  addUserNotification,
  clearNotificationsForUser,
  getNotifications,
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsUpdatedEvent,
  removeNotification,
} from "./notifications";

describe("notifications utils", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(1710000000000);
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("adds and reads notifications by user", () => {
    addUserNotification(10, "Mensaje A");
    addUserNotification(20, "Mensaje B");

    expect(getNotifications()).toHaveLength(2);
    expect(getNotificationsForUser(10)).toHaveLength(1);
    expect(getNotificationsForUser(10)[0].message).toBe("Mensaje A");
  });

  it("marks notifications as read", () => {
    addUserNotification(10, "Mensaje A");
    const [created] = getNotificationsForUser(10);

    markNotificationRead(created.id);
    expect(getNotificationsForUser(10)[0].read).toBe(true);

    addUserNotification(10, "Mensaje B");
    markAllNotificationsRead(10);
    expect(getNotificationsForUser(10).every((n) => n.read)).toBe(true);
  });

  it("removes and clears notifications", () => {
    addUserNotification(10, "Mensaje A");
    addUserNotification(20, "Mensaje B");
    const [created] = getNotificationsForUser(10);

    removeNotification(created.id);
    expect(getNotificationsForUser(10)).toHaveLength(0);

    clearNotificationsForUser(20);
    expect(getNotifications()).toHaveLength(0);
  });

  it("exposes update event name", () => {
    expect(notificationsUpdatedEvent()).toBe("notifications:updated");
  });
});
