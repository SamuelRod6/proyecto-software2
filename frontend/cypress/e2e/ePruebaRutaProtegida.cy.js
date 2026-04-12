describe("Rutas protegidas", () => {
  it("redirige a login cuando no hay sesion en ruta protegida", () => {
    cy.visit("/scientific-works", {
      onBeforeLoad: (win) => {
        win.localStorage.removeItem("auth-token");
        win.localStorage.removeItem("auth-user");
      },
    });

    cy.url().should("include", "/login");
    cy.contains("Ingresa tus credenciales", { matchCase: false }).should("be.visible");
  });
});
