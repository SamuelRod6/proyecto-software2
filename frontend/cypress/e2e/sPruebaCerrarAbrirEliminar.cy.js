describe('Prueba 3 en 1: Cerrar, Abrir y Eliminar Evento', () => {
    const adminEmail = 'rafael@yopmail.com';
    const adminPass = 'Prueba1234*';
    const nombreEventoTarget = 'Evento Cientifico';

    it('Debería gestionar el evento usando selectores de texto exacto', () => {
        // 1. LOGIN Y NAVEGACIÓN
        cy.visit('/login');
        cy.get('input[placeholder="usuario@correo.com"]').type(adminEmail);
        cy.get('input[type="password"]').type(adminPass);
        cy.get('button').contains('Ingresar').click();

        cy.url().should('include', '/');
        cy.wait(2000);
        cy.get('body').then(($body) => {
            if ($body.text().includes('Ir a eventos')) {
                cy.contains('Ir a eventos').click({ force: true });
            } else {
                cy.contains('Eventos').click({ force: true });
            }
        });

        // --- ACCIÓN 1: CERRAR INSCRIPCIONES ---
        cy.contains(nombreEventoTarget)
            .closest('div[class*="bg-"], .card, .relative')
            .find('button')
            .eq(-2)
            .click({ force: true });

        // CONFIRMACIÓN EXACTA: Para que no le dé a "Cerrar sesión"
        // ^Cerrar$ significa: que empiece y termine solo con la palabra Cerrar
        cy.contains('button', /^Cerrar$/).click({ force: true });
        cy.wait(1500);

        // --- ACCIÓN 2: ABRIR INSCRIPCIONES ---
        cy.contains(nombreEventoTarget)
            .closest('div[class*="bg-"], .card, .relative')
            .find('button')
            .eq(-2)
            .click({ force: true });

        // CONFIRMACIÓN EXACTA: Solo "Abrir"
        cy.contains('button', /^Abrir$/).click({ force: true });
        cy.wait(1500);

        // --- ACCIÓN 3: ELIMINAR EVENTO ---
        cy.contains(nombreEventoTarget)
            .closest('div[class*="bg-"], .card, .relative')
            .find('button')
            .last()
            .click({ force: true });

        // CONFIRMACIÓN EXACTA: Solo "Eliminar"
        cy.contains('button', /^Eliminar$/).click({ force: true });

        // VERIFICACIÓN
        cy.wait(2000);
        cy.contains(nombreEventoTarget).should('not.exist');
    });
});