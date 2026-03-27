/// <reference types="cypress" />

describe("Scientific works validation", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/trabajos-cientificos?user_id=1", {
      statusCode: 200,
      body: [],
    }).as("listWorks");

    cy.intercept("GET", "/api/eventos", {
      statusCode: 200,
      body: [
        {
          id_evento: 3,
          nombre: "Congreso de Salud",
          fecha_inicio: "20/04/2027 08:00:00",
          fecha_fin: "21/04/2027 17:00:00",
          fecha_cierre_inscripcion: "18/04/2027 23:59:00",
          inscripciones_abiertas: true,
          ubicacion: "Caracas, Venezuela",
        },
      ],
    }).as("getEvents");

    cy.intercept("POST", "/api/trabajos-cientificos", {
      statusCode: 200,
      body: { ok: true },
    }).as("createWork");

    cy.visit("/scientific-works", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("auth-token", "test-token");
        win.localStorage.setItem(
          "auth-user",
          JSON.stringify({
            id: 1,
            name: "Ponente",
            email: "ponente@example.com",
            roles: [{ id: 1, name: "ADMIN" }],
          }),
        );
      },
    });

    cy.wait("@listWorks");
    cy.wait("@getEvents");
  });

  it("blocks submission when the title contains numbers", () => {
    const summary = Array.from({ length: 100 }, (_, index) => `palabra${index}`).join(" ");

    cy.contains("button", "Adjuntar trabajo").click();
    cy.contains("Enviar trabajo científico").should("be.visible");

    cy.get("select").select("3");
    cy.get('input[placeholder="Solo letras y espacios"]').type("Trabajo 2027");
    cy.get('textarea[placeholder="Describe objetivos, metodología, resultados y conclusiones."]').type(summary, {
      parseSpecialCharSequences: false,
    });
    cy.get('input[type="checkbox"]').check({ force: true });
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from("pdf-content"),
      fileName: "trabajo.pdf",
      mimeType: "application/pdf",
    }, { force: true });

    cy.contains("button", "Enviar trabajo").click({ force: true });

    cy.contains("El título solo puede contener letras y espacios.", { timeout: 10000 }).should("be.visible");
    cy.get("@createWork.all").should("have.length", 0);
  });
});