describe("Prueba de Registro y Salida", () => {
  const password = "123456Rad";
  const mockedTemporaryKey = "ABCD1234";

  it("Debería registrarse exitosamente y luego cerrar la sesión", () => {
    const emailParaUsar = `fabulosodia1+${Date.now()}@gmail.com`;

    cy.intercept("POST", "/api/auth/register/request-key", (req) => {
      expect(req.body).to.deep.equal({
        name: "Peba",
        email: emailParaUsar,
      });

      req.reply({
        statusCode: 200,
        body: {
          message: "Se envio una clave temporal",
          payload: { temporaryKey: mockedTemporaryKey },
        },
      });
    }).as("requestRegisterKey");

    cy.intercept("POST", "/api/auth/register/verify-key", (req) => {
      expect(req.body).to.deep.equal({
        email: emailParaUsar,
        temporaryKey: mockedTemporaryKey,
      });

      req.reply({
        statusCode: 200,
        body: { payload: { valid: true } },
      });
    }).as("verifyRegisterKey");

    cy.intercept("POST", "/api/auth/register", (req) => {
      expect(req.body).to.deep.equal({
        name: "Peba",
        email: emailParaUsar,
        password,
        temporaryKey: mockedTemporaryKey,
      });

      req.reply({
        statusCode: 201,
        body: { message: "Registro exitoso" },
      });
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

    // 2. Solicitar clave temporal
    cy.get('input[placeholder="Nombre Apellido"]').type("Peba");
    cy.get('input[placeholder="correo@dominio.com"]').type(emailParaUsar);
    cy.contains("button", "Enviar clave temporal").click();

    cy.wait("@requestRegisterKey");

    // 3. Verificar clave temporal mockeada
    cy.get('input[placeholder="ABCD1234"]').type(mockedTemporaryKey);
    cy.contains("button", "Validar clave").click();

    cy.wait("@verifyRegisterKey");

    // 4. Crear cuenta con contraseña
    cy.get('input[type="password"]').eq(0).type(password);
    cy.get('input[type="password"]').eq(1).type(password);
    cy.contains("button", "Crear cuenta").click();

    cy.wait("@register");
    cy.wait("@login");

    // 5. Verificar que estamos en el Home
    cy.contains("Bienvenido al Home", { timeout: 15000 }).should("be.visible");
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    // 6. CERRAR SESIÓN (Paso final)
    cy.get("button").contains("Cerrar sesión").click();
    cy.contains("h2", "Cerrar sesion").should("be.visible");
    cy.contains("button", "Cerrar sesion").click();

    // 7. Confirmar que volvimos al login o estado inicial
    cy.url().should("include", "/login");
    cy.contains("Ingresa tus credenciales", { matchCase: false }).should(
      "be.visible",
    );
  });
});
