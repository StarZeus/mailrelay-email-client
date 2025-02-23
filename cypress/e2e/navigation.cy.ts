describe('Navigation Menu', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays all navigation links', () => {
    cy.get('nav').within(() => {
      cy.contains('Inbox').should('exist');
      cy.contains('Processed').should('exist');
      cy.contains('Filters & Actions').should('exist');
    });
  });

  it('highlights active link based on current route', () => {
    // increase timeout
    cy.visit('/inbox', { timeout: 10000 });
    cy.get('nav').within(() => {
      cy.get('a').contains('Inbox').should('have.class', 'bg-blue-50');
    });

    cy.visit('/processed', { timeout: 10000 });
    cy.get('nav').within(() => {
      cy.get('a').contains('Processed').should('have.class', 'bg-blue-50');
    });

    cy.visit('/settings/filters', { timeout: 10000 });
    cy.get('nav').within(() => {
      cy.get('a').contains('Filters & Actions').should('have.class', 'bg-blue-50');
    });
  });

  it('navigates to correct routes when clicked', () => {
    cy.get('nav').within(() => {
      cy.contains('Inbox').click();
      cy.url().should('include', '/inbox');

      cy.contains('Processed').click();
      cy.url().should('include', '/processed');

      cy.contains('Filters & Actions').click();
      cy.url().should('include', '/settings/filters');
    });
  });

  it('displays icons for each menu item', () => {
    cy.get('nav').within(() => {
      cy.get('svg').should('have.length', 3);
    });
  });

  it('is responsive on different viewports', () => {
    // Desktop view
    cy.viewport(1024, 768);
    cy.get('nav').should('be.visible');

    // Mobile view
    cy.viewport(375, 667);
    cy.get('nav').should('be.visible');
  });
});

describe('Navigation', () => {
  it('redirects root to inbox', () => {
    cy.visit('/');
    cy.url().should('include', '/inbox');
  });

  // ... existing tests ...
}); 