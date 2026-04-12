describe("Historial de trabajos cientificos", () => {
  it("muestra solo comentario y no actor en historial de estado", () => {
    cy.visit("/scientific-works", {
      onBeforeLoad: (win) => {
        win.localStorage.setItem("auth-token", "test-token");
        win.localStorage.setItem(
          "auth-user",
          JSON.stringify({
            id: 10,
            name: "Laura",
            email: "laura@mail.com",
            roles: ["ADMIN"],
          }),
        );
      },
    });

    cy.intercept("GET", "/api/trabajos-cientificos?user_id=10", {
      statusCode: 200,
      body: [
        {
          id_trabajo: 21,
          id_evento: 4,
          id_usuario: 10,
          titulo: "Trabajo e2e",
          resumen: "Resumen de prueba",
          version_actual: 1,
          estado: "ACTUALIZADO",
          fecha_ultimo_envio: "12/04/2026",
          archivo_actual: { id_version: 32 },
        },
      ],
    }).as("works");

    cy.intercept("GET", "/api/eventos", {
      statusCode: 200,
      body: [{ id_evento: 4, nombre: "Congreso" }],
    }).as("events");

    cy.intercept("GET", "/api/trabajos-cientificos/versiones?id_trabajo=21&user_id=10", {
      statusCode: 200,
      body: [],
    }).as("versions");

    cy.intercept("GET", /\/api\/trabajos-cientificos\/historial\?.*/, {
      statusCode: 200,
      body: [
        {
          id_historial: 1,
          id_trabajo: 21,
          estado_anterior: "PENDIENTE_REVISION",
          estado_nuevo: "ACTUALIZADO",
          tipo_cambio: "DECISION_COMITE",
          nota: "Aprobado por el comite",
          actor: "Comite Central",
          fecha_cambio: "12/04/2026",
        },
      ],
    }).as("history");

    cy.wait("@works");
    cy.wait("@events");

    cy.contains("button", "Ver historial").click();

    cy.wait("@versions");
    cy.wait("@history");

    cy.contains("th", "Comentario").should("be.visible");
    cy.contains("Aprobado por el comite").should("be.visible");
    cy.contains("Comite Central").should("not.exist");
    cy.contains("Comentario / Actor").should("not.exist");
  });
});
