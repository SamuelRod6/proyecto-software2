describe('Prueba de Gestión de Eventos - Admin', () => {
    const adminEmail = 'rafael@yopmail.com';
    const adminPass = 'Prueba1234*';

    // Generador de nombre: Solo letras y espacios
    const letras = 'abcdefghijklmnopqrstuvwxyz';
    const sufijo = Array.from({ length: 5 }, () => letras.charAt(Math.floor(Math.random() * letras.length))).join('');
    const nombreEvento = `Evento Cientifico ${sufijo}`;

    it('Debería crear el evento exitosamente', () => {
        // 1. LOGIN
        cy.visit('/login');
        cy.get('input[placeholder="usuario@correo.com"]').type(adminEmail);
        cy.get('input[type="password"]').type(adminPass);
        cy.get('button').contains('Ingresar').click();

        // 2. NAVEGACIÓN (Restaurada la que funcionaba)
        cy.url().should('include', '/');
        cy.wait(2000); // Pequeña espera para que cargue el DOM

        cy.get('body').then(($body) => {
            if ($body.text().includes('Ir a eventos')) {
                cy.contains('Ir a eventos').click({ force: true });
            } else {
                // Selector lateral más genérico por si acaso
                cy.contains('Eventos').click({ force: true });
            }
        });

        // 3. ABRIR FORMULARIO DE CREACIÓN
        cy.contains('button', 'Crear evento', { timeout: 10000 }).should('be.visible').click({ force: true });

        // 4. PASO 1: DATOS (Nombre, País, Ciudad)
        cy.get('input').filter(':visible').first().clear().type(nombreEvento);

        // Dropdowns manuales
        cy.contains('Selecciona el país').click({ force: true });
        cy.contains('Venezuela').click({ force: true });
        cy.contains('Selecciona o escribe la ciudad').click({ force: true });
        cy.contains('Caracas').click({ force: true });

        // Fechas del evento (Futuras)
        cy.get('button, span, .day').contains('25').click({ force: true });
        cy.get('button, span, .day').contains('28').click({ force: true });

        cy.contains('button', 'Siguiente').click({ force: true });

        // 5. PASO 2: CIERRE DE INSCRIPCIÓN
        cy.contains('Fecha de cierre').should('be.visible');
        cy.get('button, span, .day').contains('24').click({ force: true });

        // 6. BOTÓN FINAL (El amarillo a la izquierda de Cancelar)
        // Buscamos el botón cancelar y luego el botón que está justo antes (prev) que es el de Crear
        cy.contains('button', 'Cancelar')
            .prev('button')
            .click({ force: true });

        // 7. VERIFICACIÓN FINAL
        cy.contains('exitosamente', { timeout: 15000 }).should('be.visible');
        cy.contains(nombreEvento).should('be.visible');
    });
});