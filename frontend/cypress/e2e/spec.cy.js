describe("App and API", () => {
  it("loads app home", () => {
    cy.visit("/");
    cy.contains("Hola desde React").should("be.visible");
  });

  it("calls Go API", () => {
    cy.request("http://localhost:8080/api/hello")
      .its("body")
      .should("deep.equal", { message: "Hola, mundo" });
  });
});
