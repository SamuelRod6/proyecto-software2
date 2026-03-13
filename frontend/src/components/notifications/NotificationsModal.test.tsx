import { fireEvent, render, screen } from "@testing-library/react";
import NotificationsModal from "./NotificationsModal";
import { NotificationContext } from "../../contexts/Notifications/NotificationContext";

describe("NotificationsModal", () => {
  it("marks unread notifications as read, shows detail, and removes items", () => {
    const markAsRead = jest.fn();
    const removeNotification = jest.fn();

    render(
      <NotificationContext.Provider
        value={{
          notifications: [
            {
              id: 1,
              type: "recordatorio_evento",
              title: "Recordatorio",
              content: "Tu sesion inicia pronto.",
              read: false,
              createdAt: "2026-03-13T10:00:00.000Z",
            },
            {
              id: 2,
              type: "mensaje",
              title: "Mensaje anterior",
              content: "Contenido antiguo",
              read: true,
              createdAt: "2026-03-12T10:00:00.000Z",
            },
          ],
          unreadCount: 1,
          markAsRead,
          removeNotification,
          clearNotifications: jest.fn(),
          refreshNotifications: jest.fn(),
          loading: false,
          error: null,
        }}
      >
        <NotificationsModal open={true} onClose={jest.fn()} />
      </NotificationContext.Provider>,
    );

    fireEvent.click(screen.getByText("Recordatorio"));

    expect(markAsRead).toHaveBeenCalledWith(1);
    expect(screen.getByText("Tu sesion inicia pronto.")).toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText("Quitar notificacion")[0]);

    expect(removeNotification).toHaveBeenCalledWith(1);
  });

  it("shows empty state when there are no notifications", () => {
    render(
      <NotificationContext.Provider
        value={{
          notifications: [],
          unreadCount: 0,
          markAsRead: jest.fn(),
          removeNotification: jest.fn(),
          clearNotifications: jest.fn(),
          refreshNotifications: jest.fn(),
          loading: false,
          error: null,
        }}
      >
        <NotificationsModal open={true} onClose={jest.fn()} />
      </NotificationContext.Provider>,
    );

    expect(screen.getByText("No hay notificaciones.")).toBeInTheDocument();
    expect(screen.getByText("No hay notificacion seleccionada")).toBeInTheDocument();
  });
});