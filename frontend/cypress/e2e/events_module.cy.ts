/// <reference types="cypress" />

describe("Events module", () => {
  beforeEach(() => {
    let inscriptionsOpen = true;

    cy.intercept("GET", "/api/eventos", (req) => {
      req.reply({
        statusCode: 200,
        body: [
          {
            id_evento: 1,
            nombre: "Evento Modulo Eventos",
            fecha_inicio: "10/04/2026 08:00:00",
            fecha_fin: "10/04/2026 16:00:00",
            fecha_cierre_inscripcion: "09/04/2026 23:59:00",
            inscripciones_abiertas: inscriptionsOpen,
            ubicacion: "Caracas, Venezuela",
          },
        ],
      });
    }).as("getEvents");

    cy.intercept("PATCH", /\/api\/eventos\?id=1&action=cerrar/, (req) => {
      inscriptionsOpen = false;
      req.reply({ statusCode: 200, body: { message: "ok" } });
    }).as("closeInscriptions");

    cy.visit("/events-management", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("auth-token", "test-token");
        win.localStorage.setItem(
          "auth-user",
          JSON.stringify({
            id: 1,
            name: "Admin",
            email: "admin@example.com",
            roles: [{ id: 1, name: "ADMIN" }],
          }),
        );
      },
    });

    cy.wait("@getEvents");
  });

  it("allows admin to close inscriptions", () => {
    cy.contains("h2", "Evento Modulo Eventos")
      .closest("div.rounded-lg")
      .find('button[title*="inscripciones"]')
      .first()
      .click({ force: true });

    cy.contains("button", /^Cerrar$/).click({ force: true });

    cy.wait("@closeInscriptions");
    cy.contains("Las inscripciones fueron cerradas.", { timeout: 10000 }).should("be.visible");
  });
});
