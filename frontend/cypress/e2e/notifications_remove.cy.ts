/// <reference types="cypress" />

describe("Notifications removal", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/notifications/user/1", {
      statusCode: 200,
      body: [
        {
          id: 100,
          type: "recordatorio_evento",
          read: true,
          message: "Recuerda asistir al evento.",
          created_at: "2026-03-13T15:30:00Z",
        },
      ],
    }).as("getNotifications");

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

  it("removes a notification from the tray and shows the empty state", () => {
    cy.get('button[aria-label="Notificaciones"]').click();
    cy.contains("Notificaciones").should("be.visible");
    cy.contains("Recordatorio de evento").should("be.visible");

    cy.get('button[aria-label="Quitar notificacion"]').click({ force: true });

    cy.contains("No hay notificaciones.", { timeout: 10000 }).should("be.visible");
  });
});