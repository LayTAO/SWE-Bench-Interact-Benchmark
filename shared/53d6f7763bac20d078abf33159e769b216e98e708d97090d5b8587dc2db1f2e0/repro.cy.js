import 'cypress-real-events/support';

describe('DropdownMenu inside Dialog dismissal reproduction', () => {
  it('records the state after clicking inside the dialog but outside the menu', () => {
    cy.visit('/');
    cy.get('#status').should('have.text', 'dialog-closed-menu-closed');
    cy.get('#dialog-trigger').click();
    cy.get('#status').should('have.text', 'dialog-open-menu-closed');
    cy.get('#menu-trigger').click();
    cy.get('#status').should('have.text', 'dialog-open-menu-open');
    cy.get('#dialog-title').realClick();
    cy.get('#status').should('have.text', Cypress.env('EXPECTED_STATE'));
    cy.get('#errors').should('have.text', '');
    cy.screenshot('final-state', { capture: 'viewport' });
  });
});
