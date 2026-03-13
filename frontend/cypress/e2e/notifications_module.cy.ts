/// <reference types="cypress" />

describe("Notifications module", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/notifications/user/1", {
      statusCode: 200,
      body: [
        {
          id: 100,
          type: "recordatorio_evento",
          read: false,
          message: "Recuerda asistir al evento.",
          created_at: "2026-03-13T15:30:00Z",
        },
      ],
    }).as("getNotifications");

    cy.intercept("PATCH", "/api/notifications/100/leida", {
      statusCode: 200,
      body: { message: "ok" },
    }).as("markRead");

    cy.visit("/", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("auth-token", "test-token");
        win.localStorage.setItem(
          "auth-user",
          JSON.stringify({
            id: 1,
            name: "Usuario Prueba",
            email: "user@example.com",
            roles: [{ id: 1, name: "ADMIN" }],
          }),
        );
      },
    });

    cy.wait("@getNotifications");
  });

  it("opens tray and marks unread notification as read", () => {
    cy.get('button[aria-label="Notificaciones"]').click();
    cy.contains("Notificaciones").should("be.visible");
    cy.contains("Recordatorio de evento").click();

    cy.wait("@markRead");
    cy.contains("Recuerda asistir al evento.").should("be.visible");
  });
});
