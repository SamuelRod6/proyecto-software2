import "./commands";

beforeEach(() => {
  cy.intercept("GET", "/api/**", (req) => {
    req.reply({ statusCode: 200, body: {} });
  }).as("apiGet");

  cy.intercept("POST", "/api/**", (req) => {
    req.reply({ statusCode: 200, body: {} });
  }).as("apiPost");

  cy.intercept("PATCH", "/api/**", (req) => {
    req.reply({ statusCode: 200, body: {} });
  }).as("apiPatch");

  cy.intercept("DELETE", "/api/**", (req) => {
    req.reply({ statusCode: 200, body: {} });
  }).as("apiDelete");
});
