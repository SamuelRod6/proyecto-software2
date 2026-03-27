/// <reference types="cypress" />

describe("Trabajos module", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/trabajos-cientificos?user_id=1", {
      statusCode: 200,
      body: [
        {
          id_trabajo: 501,
          id_evento: 3,
          id_usuario: 1,
          titulo: "Analisis de Datos Clinicos",
          resumen: "Resumen de prueba para validar listado de trabajos.",
          version_actual: 2,
          estado: "EN_REVISION",
          fecha_ultimo_envio: "2026-03-10",
          archivo_actual: { id_version: 901 },
        },
      ],
    }).as("listWorks");

    cy.intercept("GET", "/api/eventos", {
      statusCode: 200,
      body: [
        {
          id_evento: 3,
          nombre: "Congreso de Salud",
          fecha_inicio: "20/04/2026 08:00:00",
          fecha_fin: "21/04/2026 17:00:00",
          fecha_cierre_inscripcion: "18/04/2026 23:59:00",
          inscripciones_abiertas: true,
          ubicacion: "Caracas, Venezuela",
        },
      ],
    }).as("getEvents");

    cy.intercept("GET", "/api/trabajos-cientificos/versiones?id_trabajo=501&user_id=1", {
      statusCode: 200,
      body: [
        {
          id_version: 901,
          id_trabajo: 501,
          numero_version: 1,
          nombre_archivo: "trabajo-v1.pdf",
          tamano_bytes: 1024,
          mime_type: "application/pdf",
          descripcion_cambios: "Version inicial",
          es_actual: false,
          fecha_envio: "2026-03-01",
        },
        {
          id_version: 902,
          id_trabajo: 501,
          numero_version: 2,
          nombre_archivo: "trabajo-v2.pdf",
          tamano_bytes: 2048,
          mime_type: "application/pdf",
          descripcion_cambios: "Se ajusto metodologia",
          es_actual: true,
          fecha_envio: "2026-03-10",
        },
      ],
    }).as("getVersions");

    cy.intercept(
      "GET",
      "/api/trabajos-cientificos/versiones/comparar?id_trabajo=501&user_id=1&from=1&to=2",
      {
        statusCode: 200,
        body: {
          id_trabajo: 501,
          resumen: ["Se actualizo la seccion de resultados"],
        },
      },
    ).as("compareVersions");

    cy.visit("/scientific-works", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("auth-token", "test-token");
        win.localStorage.setItem(
          "auth-user",
          JSON.stringify({
            id: 1,
            name: "Comite",
            email: "comite@example.com",
            roles: [{ id: 1, name: "ADMIN" }],
          }),
        );
      },
    });

    cy.wait("@listWorks");
    cy.wait("@getEvents");
  });

  it("shows versions history and compares selected versions", () => {
    cy.contains("Analisis de Datos Clinicos").should("be.visible");
    cy.contains("button", "Ver historial").click();

    cy.wait("@getVersions");
    cy.contains("Historial de versiones").should("be.visible");

    cy.get('select').eq(0).select('1');
    cy.get('select').eq(1).select('2');
    cy.contains("button", "Comparar").click();

    cy.wait("@compareVersions");
    cy.contains("Resultado de comparación").should("be.visible");
    cy.contains("Se actualizo la seccion de resultados").should("be.visible");
  });
});
