describe("Prueba de Registro y Salida", () => {
  const password = "123456Rad";

  it("Debería registrarse exitosamente y luego cerrar la sesión", () => {
    const emailParaUsar = `fabulosodia1+${Date.now()}@gmail.com`;

    cy.intercept("POST", "/api/auth/register", {
      statusCode: 201,
      body: { message: "Registro exitoso" },
    }).as("register");

    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        payload: {
          token: "test-token",
          user: {
            id: 1,
            name: "Peba",
            email: emailParaUsar,
            roles: [],
          },
        },
      },
    }).as("login");

    // 1. Ir al registro
    cy.visit("/register");

    // 2. Llenar los campos (según tus capturas de pantalla)
    cy.get('input[placeholder="Nombre Apellido"]').type("Peba");
    cy.get('input[placeholder="correo@dominio.com"]').type(emailParaUsar);
    cy.get('input[type="password"]').eq(0).type(password);
    cy.get('input[type="password"]').eq(1).type(password);

    // 3. Click en el botón de registro
    cy.get("button").contains("Registrarme").click();

    cy.wait("@register");
    cy.wait("@login");

    // 4. Verificar que estamos en el Home
    cy.contains("Bienvenido al Home", { timeout: 15000 }).should("be.visible");
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    // 5. CERRAR SESIÓN (Paso final)
    cy.get("button").contains("Cerrar sesión").click();
    cy.contains("h2", "Cerrar sesion").should("be.visible");
    cy.contains("button", "Cerrar sesion").click();

    // 6. Confirmar que volvimos al login o estado inicial
    cy.url().should("include", "/login");
    cy.contains("Ingresa tus credenciales", { matchCase: false }).should(
      "be.visible",
    );
  });
});
