describe('Prueba de Inicio de Sesión', () => {
    // --- USA UN CORREO QUE YA HAYAS REGISTRADO ANTES ---
    const emailExistente = 'fabulosodia1@gmail.com';
    const passwordCorrecta = '123456Rad';

    it('Debería ingresar al sistema con credenciales válidas', () => {
        cy.intercept("POST", "/api/auth/login", (req) => {
          const { email, password } = req.body || {};
          if (email === emailExistente && password === passwordCorrecta) {
            req.reply({
              statusCode: 200,
              body: {
                payload: {
                  token: "test-token",
                  user: {
                    id: 1,
                    name: "Usuario",
                    email: emailExistente,
                    roles: [],
                  },
                },
              },
            });
            return;
          }
          req.reply({
            statusCode: 401,
            body: { message: "Credenciales invalidas" },
          });
        }).as("login");

        // 1. Visitar la página de login directamente
        cy.visit('/login');

        // 2. Llenar los campos usando los placeholders específicos del Login
        // Según tu Screenshot_123 el placeholder es "usuario@correo.com"
        cy.get('input[placeholder="usuario@correo.com"]').type(emailExistente);
        cy.get('input[type="password"]').type(passwordCorrecta);

        // 3. Hacer clic en el botón amarillo "Ingresar"
        cy.get('button').contains('Ingresar').click();
        cy.wait("@login");

        // 4. Verificaciones de éxito
        // Confirmamos que estamos en el Home
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        // Confirmamos que vemos el mensaje de bienvenida
        cy.contains('Bienvenido al Home').should('be.visible');

        // Verificamos que el botón de "Cerrar sesión" esté presente (lo que indica que estamos logueados)
        cy.get('button').contains('Cerrar sesión').should('be.visible');
    });

    it('Debería mostrar un error con una contraseña incorrecta', () => {
        cy.intercept("POST", "/api/auth/login", {
          statusCode: 401,
          body: { message: "Credenciales invalidas" },
        }).as("loginFail");

        cy.visit('/login');
        cy.get('input[placeholder="usuario@correo.com"]').type(emailExistente);
        cy.get('input[type="password"]').type('clave_falsa_123');
        cy.get('button').contains('Ingresar').click();
        cy.wait("@loginFail");

        // Aquí validamos que NO entramos al home y que aparece un error
        // Ajusta el texto "Error" según lo que devuelva tu backend
        cy.url().should('include', '/login');
        cy.get("p.text-red-300")
          .should("be.visible")
          .invoke("text")
          .should("match", /\S/);
    });
});