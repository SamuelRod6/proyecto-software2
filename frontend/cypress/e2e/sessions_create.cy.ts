/// <reference types="cypress" />

describe("Sessions creation", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/eventos", {
      statusCode: 200,
      body: [
        {
          id_evento: 22,
          nombre: "Evento con Sesiones",
          fecha_inicio: "15/04/2027 09:00:00",
          fecha_fin: "16/04/2027 17:00:00",
          fecha_cierre_inscripcion: "14/04/2027 23:59:00",
          inscripciones_abiertas: true,
          ubicacion: "Barquisimeto, Venezuela",
        },
      ],
    }).as("getEvents");

    cy.intercept("POST", "/api/sesiones?evento=22", {
      statusCode: 200,
      body: { id_sesion: 300 },
    }).as("createSession");

    cy.intercept("GET", "/api/sesiones/ponibles?sesion_id=300", {
      statusCode: 200,
      body: [
        {
          id_usuario: 7,
          nombre: "Laura Perez",
          email: "laura@example.com",
        },
      ],
    }).as("getSpeakers");

    cy.intercept("POST", "/api/sesiones/asignar-ponentes?sesion_id=300", {
      statusCode: 204,
      body: {},
    }).as("assignSpeaker");

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

  it("creates a session and assigns a speaker from the event card", () => {
    cy.get('button[aria-label="Agregar sesión"]').first().click({ force: true });
    cy.contains("Crear Sesión").should("be.visible");

    cy.contains("label", "Título")
      .first()
      .parent()
      .find("input")
      .first()
      .clear()
      .type("Sesion Magistral");

    cy.get('table[role="grid"] button')
      .filter(':not([disabled])')
      .contains(/^15$/)
      .click({ force: true });

    cy.contains("button", "Crear Sesión").click({ force: true });

    cy.wait("@createSession");
    cy.wait("@getSpeakers");
    cy.contains("Asignar Ponente a Sesión").should("be.visible");
    cy.contains("Ahora debes asignar un ponente.").should("be.visible");

    cy.contains("Escoge un ponente").click({ force: true });
    cy.contains("Laura Perez · laura@example.com").click({ force: true });
    cy.contains("button", "Asignar Ponente").click({ force: true });

    cy.wait("@assignSpeaker");
    cy.contains("Ponente asignado exitosamente.", { timeout: 10000 }).should("be.visible");
  });
});