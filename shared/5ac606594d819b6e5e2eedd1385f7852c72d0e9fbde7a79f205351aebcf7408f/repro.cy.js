describe('DismissableLayer stale Escape handler reproduction', () => {
  it('records the state after blocking Escape and pressing Escape', () => {
    cy.visit('/');
    cy.get('#status').should('have.text', 'open-unblocked');
    cy.get('#block').click();
    cy.get('#status').should('have.text', 'open-blocked');
    cy.get('body').type('{esc}');
    cy.get('#status').should('have.text', Cypress.env('EXPECTED_STATE'));
    cy.get('#errors').should('have.text', '');
    cy.screenshot('final-state', { capture: 'viewport' });
  });
});
