describe('Inbox Page', () => {
  beforeEach(() => {
    cy.visit('/inbox');
  });

  it('displays the inbox layout correctly', () => {
    cy.get('h1').should('contain', 'Inbox');
    cy.get('[data-testid="email-list"]').should('exist');
  });

  it('loads and displays emails', () => {
    cy.get('[data-testid="email-list"]').within(() => {
      cy.get('[data-testid="email-item"]').should('have.length.at.least', 1);
      cy.get('[data-testid="email-item"]').first().within(() => {
        cy.get('[data-testid="email-subject"]').should('exist');
        cy.get('[data-testid="email-sender"]').should('exist');
      });
    });
  });

  it('shows email details when clicked', () => {
    cy.get('[data-testid="email-item"]').first().click();
    cy.get('[data-testid="email-detail"]').should('exist');
    cy.get('[data-testid="email-detail-subject"]').should('exist');
    cy.get('[data-testid="email-detail-content"]').should('exist');
  });

  it('handles search functionality', () => {
    cy.get('input[type="search"]').type('test');
    cy.url().should('include', 'q=test');
    cy.get('[data-testid="email-list"]').should('exist');
  });

  it('implements infinite scroll', () => {
    cy.get('[data-testid="email-list"]').scrollTo('bottom');
    cy.get('[data-testid="email-item"]').its('length').should('be.gt', 0);
  });

  it('is responsive on different viewports', () => {
    // Desktop view
    cy.viewport(1024, 768);
    cy.get('[data-testid="email-list"]').should('be.visible');
    cy.get('[data-testid="email-item"]').first().click({ force: true });
    cy.get('[data-testid="email-detail"]').should('be.visible');

    // Mobile view
    cy.viewport(375, 667);
    cy.get('[data-testid="email-list"]').should('be.visible');
    cy.get('[data-testid="email-item"]').first().click({ force: true });
    cy.get('[data-testid="email-detail"]').should('be.visible');
  });
}); 