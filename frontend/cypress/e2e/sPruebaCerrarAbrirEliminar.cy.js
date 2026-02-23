describe('Prueba 3 en 1: Cerrar, Abrir y Eliminar Evento', () => {
    it('Debería gestionar el evento usando selectores de texto exacto', () => {
      let inscripcionesAbiertas = true;
      let deleted = false;

      const buildEvento = () => ({
        id_evento: 101,
        nombre: "Evento Cientifico Cypress",
        fecha_inicio: "10/03/2026",
        fecha_fin: "12/03/2026",
        fecha_cierre_inscripcion: "09/03/2026",
        inscripciones_abiertas: inscripcionesAbiertas,
        ubicacion: "Caracas, Venezuela",
      });

      cy.intercept("GET", "/api/eventos", (req) => {
        req.reply({
          statusCode: 200,
          body: deleted ? [] : [buildEvento()],
        });
      }).as("events");

      cy.intercept(
        "PATCH",
        /\/api\/eventos\?id=\d+&action=(abrir|cerrar)/,
        (req) => {
          const action = req.query?.action;
          if (action === "cerrar") {
            inscripcionesAbiertas = false;
          }
          if (action === "abrir") {
            inscripcionesAbiertas = true;
          }
          req.reply({ statusCode: 200, body: { message: "ok" } });
        },
      ).as("toggleInscripciones");

      cy.intercept("DELETE", /\/api\/eventos\?id=\d+/, (req) => {
        deleted = true;
        req.reply({ statusCode: 204, body: {} });
      }).as("deleteEvent");

      // 1. Acceso directo como admin
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
      cy.contains("h1", "Eventos científicos").should("be.visible");
      cy.wait("@events");

      cy.get("h2.text-xl")
        .first()
        .should("be.visible")
        .invoke("text")
        .then((text) => {
          const eventName = text.replace("Inscrito", "").trim();

          // --- ACCIÓN 1: CERRAR INSCRIPCIONES ---
          cy.contains("h2", eventName)
            .closest("div.rounded-lg")
            .find('button[title*="inscripciones"]')
            .first()
            .click({ force: true });

          // CONFIRMACIÓN EXACTA: Para que no le dé a "Cerrar sesión"
          // ^Cerrar$ significa: que empiece y termine solo con la palabra Cerrar
          cy.contains("button", /^Cerrar$/).click({ force: true });
          cy.wait("@toggleInscripciones");
          cy.wait(1500);

          // --- ACCIÓN 2: ABRIR INSCRIPCIONES ---
          cy.contains("h2", eventName)
            .closest("div.rounded-lg")
            .find('button[title*="inscripciones"]')
            .first()
            .click({ force: true });

          // CONFIRMACIÓN EXACTA: Solo "Abrir"
          cy.contains("button", /^Abrir$/).click({ force: true });
          cy.wait("@toggleInscripciones");
          cy.wait(1500);

          // --- ACCIÓN 3: ELIMINAR EVENTO ---
          cy.contains("h2", eventName)
            .closest("div.rounded-lg")
            .find('button[title="Eliminar"]')
            .click({ force: true });

          // CONFIRMACIÓN EXACTA: Solo "Eliminar"
          cy.contains("button", /^Eliminar$/).click({ force: true });
          cy.wait("@deleteEvent");

          // VERIFICACIÓN
          cy.wait(2000);
          cy.contains("h2", eventName).should("not.exist");
        });
    });
});