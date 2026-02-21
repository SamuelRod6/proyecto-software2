describe('Prueba de Registro y Salida', () => {
    // --- CAMBIA EL CORREO AQUÍ PARA CADA PRUEBA NUEVA ---
    const emailParaUsar = 'fabulosodia1@gmail.com';
    const password = '123456Rad';

    it('Debería registrarse exitosamente y luego cerrar la sesión', () => {
        // 1. Ir al registro
        cy.visit('/register');

        // 2. Llenar los campos (según tus capturas de pantalla)
        cy.get('input[placeholder="Nombre Apellido"]').type('Peba');
        cy.get('input[placeholder="correo@dominio.com"]').type(emailParaUsar);
        cy.get('input[type="password"]').eq(0).type(password);
        cy.get('input[type="password"]').eq(1).type(password);

        // 3. Click en el botón de registro
        cy.get('button').contains('Registrarme').click();

        // 4. Verificar que el backend respondió bien y estamos en el Home
        // Esperamos a que aparezca el mensaje de éxito y la URL cambie
        cy.contains('Registro exitoso', { timeout: 10000 }).should('be.visible');
        cy.url().should('eq', Cypress.config().baseUrl + '/');
        cy.contains('Bienvenido al Home').should('be.visible');

        // 5. CERRAR SESIÓN (Paso final)
        // Buscamos el botón que dice "Cerrar sesión" y le damos click
        cy.get('button').contains('Cerrar sesión').click();

        // 6. Confirmar que volvimos al login o estado inicial
        cy.url().should('include', '/login');
        cy.contains('Ingresa tus credenciales').should('be.visible');
    });
});