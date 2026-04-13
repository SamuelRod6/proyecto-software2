/// <reference types="cypress" />

describe("Events validation", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/eventos/fechas-ocupadas", {
      statusCode: 200,
      body: [],
    }).as("occupiedDates");

    cy.intercept("GET", "/api/eventos", {
      statusCode: 200,
      body: [
        {
          id_evento: 321,
          nombre: "Congreso Existente",
          fecha_inicio: "10/05/2027",
          fecha_fin: "12/05/2027",
          fecha_cierre_inscripcion: "08/05/2027",
          inscripciones_abiertas: true,
          ubicacion: "Caracas, Venezuela",
        },
      ],
    }).as("getEvents");

    cy.intercept("POST", "/api/eventos", {
      statusCode: 409,
      body: { message: "Ya existe un evento con ese nombre." },
    }).as("createEventConflict");

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

  it("shows backend validation error when creating a duplicated event", () => {
    cy.contains("button", /Crear evento/i).click({ force: true });
    cy.wait("@occupiedDates");

    cy.get('input[placeholder="Ej: Expo de galaxias"]').type("Congreso Existente");

    cy.contains("Selecciona el país").click({ force: true });
    cy.contains("Venezuela").click({ force: true });
    cy.contains("Selecciona o escribe la ciudad").click({ force: true });
    cy.contains("Caracas").click({ force: true });

    cy.get('table[role="grid"] button')
      .filter(':not([disabled])')
      .eq(0)
      .click();
    cy.get('table[role="grid"] button')
      .filter(':not([disabled])')
      .eq(2)
      .click();

    cy.contains("button", "Siguiente").click({ force: true });

    cy.get('table[role="grid"] button')
      .filter(':not([disabled])')
      .first()
      .click();

    cy.contains("button", "Cancelar").prev("button").click({ force: true });

    cy.wait("@createEventConflict");
    cy.contains("Ya existe un evento con ese nombre.", { timeout: 10000 }).should("be.visible");
    cy.contains("Congreso Existente").should("exist");
  });
});