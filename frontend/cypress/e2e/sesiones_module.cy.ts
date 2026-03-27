/// <reference types="cypress" />

describe("Sesiones module", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/eventos", {
      statusCode: 200,
      body: [
        {
          id_evento: 22,
          nombre: "Evento con Sesiones",
          fecha_inicio: "15/04/2026 09:00:00",
          fecha_fin: "15/04/2026 17:00:00",
          fecha_cierre_inscripcion: "14/04/2026 23:59:00",
          inscripciones_abiertas: true,
          ubicacion: "Barquisimeto, Venezuela",
        },
      ],
    }).as("getEvents");

    cy.intercept("GET", "/api/eventos?evento_id=22", {
      statusCode: 200,
      body: {
        id_evento: 22,
        nombre: "Evento con Sesiones",
        fecha_inicio: "15/04/2026 09:00:00",
        fecha_fin: "15/04/2026 17:00:00",
        fecha_cierre_inscripcion: "14/04/2026 23:59:00",
        inscripciones_abiertas: true,
        ubicacion: "Barquisimeto, Venezuela",
        sesiones: [
          {
            id_sesion: 300,
            titulo: "Sesion de Apertura",
            fecha_inicio: "15/04/2026 09:30:00",
            fecha_fin: "15/04/2026 10:30:00",
            ubicacion: "Auditorio A",
            ponentes: [{ id_usuario: 7, nombre: "Laura Perez" }],
          },
        ],
      },
    }).as("getEventDetail");

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

  it("shows event sessions in detail modal", () => {
    cy.contains("Evento con Sesiones").click({ force: true });

    cy.wait("@getEventDetail");
    cy.contains("Detalle del evento", { timeout: 10000 }).should("exist");
    cy.contains("Sesiones del evento", { timeout: 10000 }).should("exist");
    cy.contains("Sesion de Apertura", { timeout: 10000 }).scrollIntoView().should("exist");
    cy.contains("Laura Perez", { timeout: 10000 }).scrollIntoView().should("exist");
  });
});
