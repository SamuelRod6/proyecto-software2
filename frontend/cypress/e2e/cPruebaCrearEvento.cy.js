describe("Prueba de Gestión de Eventos - Admin", () => {
  // Generador de nombre: Solo letras y espacios
  const letras = "abcdefghijklmnopqrstuvwxyz";
  const sufijo = Array.from({ length: 5 }, () =>
    letras.charAt(Math.floor(Math.random() * letras.length)),
  ).join("");
  const nombreEvento = `Evento Cientifico ${sufijo}`;

  it("Debería crear el evento exitosamente", () => {
    let created = false;

    cy.intercept("GET", "/api/eventos/fechas-ocupadas", {
      statusCode: 200,
      body: [],
    }).as("occupiedDates");

    cy.intercept("GET", "/api/eventos", (req) => {
      req.reply({
        statusCode: 200,
        body: created
          ? [
              {
                id_evento: 500,
                nombre: nombreEvento,
                fecha_inicio: "10/03/2026",
                fecha_fin: "12/03/2026",
                fecha_cierre_inscripcion: "09/03/2026",
                inscripciones_abiertas: true,
                ubicacion: "Caracas, Venezuela",
              },
            ]
          : [],
      });
    }).as("events");

    cy.intercept("POST", "/api/eventos", (req) => {
      created = true;
      req.reply({ statusCode: 200, body: { message: "ok" } });
    }).as("createEvent");

    // 1. Acceso directo a Gestión de eventos
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

    // 3. ABRIR FORMULARIO DE CREACIÓN
    cy.contains("button", "Crear evento", { timeout: 10000 })
      .should("be.visible")
      .and("not.be.disabled")
      .click({ force: true });
    cy.contains("h2", "Crear evento").should("be.visible");
    cy.wait("@occupiedDates");

    // 4. PASO 1: DATOS (Nombre, País, Ciudad)
    cy.get('input[placeholder="Ej: Expo de galaxias"]')
      .should("be.visible")
      .clear()
      .type(nombreEvento);

    // Dropdowns manuales
    cy.contains("Selecciona el país").click({ force: true });
    cy.contains("Venezuela").click({ force: true });
    cy.contains("Selecciona o escribe la ciudad").click({ force: true });
    cy.contains("Caracas").click({ force: true });

    // Fechas del evento (Futuras)
    cy.contains("Fechas del evento").should("be.visible");
    cy.get('table[role="grid"]', { timeout: 10000 }).should("be.visible");
    cy.get('table[role="grid"] button')
      .filter(":not([disabled])")
      .eq(0)
      .click();
    cy.get('table[role="grid"] button')
      .filter(":not([disabled])")
      .eq(2)
      .click();

    cy.contains("button", "Siguiente").click({ force: true });

    // 5. PASO 2: CIERRE DE INSCRIPCIÓN
    cy.contains("Fecha de cierre").should("be.visible");
    cy.get('table[role="grid"]', { timeout: 10000 }).should("be.visible");
    cy.get('table[role="grid"] button')
      .filter(":not([disabled])")
      .first()
      .click();

    // 6. BOTÓN FINAL (El amarillo a la izquierda de Cancelar)
    // Buscamos el botón cancelar y luego el botón que está justo antes (prev) que es el de Crear
    cy.contains("button", "Cancelar").prev("button").click({ force: true });
    cy.wait("@createEvent");
    cy.wait("@events");

    // 7. VERIFICACIÓN FINAL
    cy.contains(nombreEvento, { timeout: 10000 }).should("be.visible");
  });
});
