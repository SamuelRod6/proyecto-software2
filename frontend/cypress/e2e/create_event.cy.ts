/// <reference types="cypress" />

describe('Crear Evento Spec', () => {
    beforeEach(() => {
        // Bypass client-side auth using onBeforeLoad
        cy.visit('http://localhost:5173/events', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem("auth-demo", "true");
            }
        });
    });

    it('should create a new event successfully', () => {
        // Verify we are on the events page (auth bypass worked)
        cy.url().should('include', '/events');

        // 1. Open the modal
        cy.contains('button', /Crear evento/i, { timeout: 10000 }).should('be.visible').click();

        // 2. Check modal is open and form visible
        cy.get('h2').contains('Crear evento').should('be.visible');
        cy.get('form').should('be.visible');

        // 3. Fill the form

        // Name
        const uniqueName = `Evento Test ${Date.now()}`;
        cy.get('input[placeholder="Ej: Expo de galaxias"]').should('be.visible').type(uniqueName);

        // Date Range - Find the calendar more robustly
        cy.get('body').then($body => {
            if ($body.find('.rdp').length === 0) {
                cy.log('Calendar .rdp not found, looking for alternative...');
                cy.contains(/inicio/i).should('be.visible');
            } else {
                cy.get('.rdp').should('be.visible');
                cy.get('.rdp-day_today').first().click();
                cy.get('.rdp-day_today').first().click();
            }
        });

        // Country (React Select)
        cy.contains('label', /País/i).should('be.visible');
        cy.contains('label', /País/i).parent().find('.react-select__control').click();
        cy.get('.react-select__menu', { timeout: 10000 }).should('be.visible');
        cy.get('.react-select__option').contains('Venezuela').click();

        // City (React Select)
        cy.contains('label', /Ciudad/i).should('be.visible');
        cy.contains('label', /Ciudad/i).parent().find('.react-select__control').click();
        cy.get('.react-select__menu', { timeout: 10000 }).should('be.visible');
        cy.get('.react-select__option').contains('Caracas').click();

        // 4. Submit
        cy.get('form').find('button[type="submit"]').contains(/Crear evento/i).click();

        // 5. Verify success
        cy.contains('div', 'El evento ha sido creado exitosamente.').should('be.visible');
        cy.contains(uniqueName).should('be.visible');
    });
});
