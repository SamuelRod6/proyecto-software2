/// <reference types="cypress" />

describe('Crear Evento Spec', () => {
    beforeEach(() => {
        let created = false;
        let createdEventName = 'Evento Test Cypress';

        cy.intercept('GET', '/api/eventos/fechas-ocupadas', {
            statusCode: 200,
            body: [],
        }).as('occupiedDates');

        cy.intercept('GET', '/api/eventos', (req) => {
            req.reply({
                statusCode: 200,
                body: created
                    ? [{
                        id_evento: 700,
                        nombre: createdEventName,
                        fecha_inicio: '10/03/2026',
                        fecha_fin: '12/03/2026',
                        fecha_cierre_inscripcion: '09/03/2026',
                        inscripciones_abiertas: true,
                        ubicacion: 'Caracas, Venezuela',
                    }]
                    : [],
            });
        }).as('events');

        cy.intercept('POST', '/api/eventos', (req) => {
            created = true;
            createdEventName = req.body?.nombre || createdEventName;
            req.reply({ statusCode: 200, body: { message: 'ok' } });
        }).as('createEvent');

        cy.visit('http://localhost:5173/events-management', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('auth-token', 'test-token');
                win.localStorage.setItem(
                    'auth-user',
                    JSON.stringify({
                        id: 1,
                        name: 'Admin',
                        email: 'admin@example.com',
                        roles: [{ id: 1, name: 'ADMIN' }],
                    }),
                );
            }
        });

        cy.wait('@events');
    });

    it('should create a new event successfully', () => {
        cy.url().should('include', '/events-management');

        cy.contains('button', /Crear evento/i, { timeout: 10000 }).should('be.visible').click();
        cy.wait('@occupiedDates');

        cy.get('h2').contains('Crear evento').should('be.visible');
        cy.get('form').should('be.visible');

        const uniqueName = `Evento Test ${Date.now()}`;
        cy.get('input[placeholder="Ej: Expo de galaxias"]').should('be.visible').type(uniqueName);

        cy.contains('Selecciona el país').click({ force: true });
        cy.contains('Venezuela').click({ force: true });
        cy.contains('Selecciona o escribe la ciudad').click({ force: true });
        cy.contains('Caracas').click({ force: true });

        cy.get('table[role="grid"] button')
            .filter(':not([disabled])')
            .eq(0)
            .click();
        cy.get('table[role="grid"] button')
            .filter(':not([disabled])')
            .eq(2)
            .click();

        cy.contains('button', 'Siguiente').click({ force: true });

        cy.get('table[role="grid"] button')
            .filter(':not([disabled])')
            .first()
            .click();

        cy.contains('button', 'Cancelar').prev('button').click({ force: true });

        cy.wait('@createEvent');
        cy.wait('@events');
        cy.contains('El evento ha sido creado exitosamente.', { timeout: 10000 }).should('be.visible');
        cy.contains(uniqueName, { timeout: 10000 }).should('exist');
    });
});
