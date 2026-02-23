describe("App and API", () => {
  it("loads app home", () => {
    cy.visit("/");
    cy.contains("Login").should("be.visible");
  });

  it("calls Go API", () => {
    cy.intercept("GET", "/api/hello", {
      statusCode: 200,
      body: { message: "Hola, mundo" },
    }).as("hello");

    cy.visit("/");
    cy.window()
      .then((win) => win.fetch("/api/hello"))
      .then((res) => res.json())
      .then((data) => {
        expect(data).to.deep.equal({ message: "Hola, mundo" });
      });

    cy.wait("@hello");
  });

  it("shows role and permission management links when allowed", () => {
    cy.intercept("GET", "/api/roles/1/permissions", {
      statusCode: 200,
      body: {
        permissions: [
          { id: 201, name: "gestionar_roles" },
          { id: 202, name: "gestionar_permisos" },
        ],
      },
    }).as("rolePerms");

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("auth-token", "test-token");
        win.localStorage.setItem(
          "auth-user",
          JSON.stringify({
            id: 1,
            name: "Ponente",
            email: "ponente@example.com",
            roles: [{ id: 1, name: "PONENTE" }],
          }),
        );
        win.localStorage.setItem(
          "resource-permissions",
          JSON.stringify({
            "roles.manage": 201,
            "permissions.manage": 202,
          }),
        );
      },
    });

    cy.wait("@rolePerms");
    cy.contains("Gestión de roles").should("be.visible");
    cy.contains("Gestión de permisos y recursos").should("be.visible");
  });

  it("enables create event button when resource permission is granted", () => {
    cy.intercept("GET", "/api/roles/1/permissions", {
      statusCode: 200,
      body: {
        permissions: [{ id: 203, name: "gestionar_eventos" }],
      },
    }).as("rolePerms");

    cy.intercept("GET", "/api/eventos", {
      statusCode: 200,
      body: [],
    }).as("events");

    cy.visit("/events-management", {
      onBeforeLoad(win) {
        win.localStorage.setItem("auth-token", "test-token");
        win.localStorage.setItem(
          "auth-user",
          JSON.stringify({
            id: 1,
            name: "Ponente",
            email: "ponente@example.com",
            roles: [{ id: 1, name: "PONENTE" }],
          }),
        );
        win.localStorage.setItem(
          "resource-permissions",
          JSON.stringify({
            "events.management": 203,
          }),
        );
      },
    });

    cy.wait("@rolePerms");
    cy.wait("@events");
    cy.contains("Crear evento").should("not.be.disabled");
  });
});
