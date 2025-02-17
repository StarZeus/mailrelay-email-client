describe('Navigation Menu', () => {
  beforeEach(() => {
    cy.visit('/inbox');
  });

  it('displays all navigation links', () => {
    cy.contains('a', 'Inbox').should('be.visible');
    cy.contains('a', 'Processed').should('be.visible');
    cy.contains('a', 'Filters & Actions').should('be.visible');
  });

  it('highlights active link based on current route', () => {
    // Already on inbox route
    cy.contains('a', 'Inbox').should('have.class', 'bg-accent');
    cy.contains('a', 'Processed').should('not.have.class', 'bg-accent');

    // Check processed route
    cy.visit('/processed');
    cy.contains('a', 'Processed').should('have.class', 'bg-accent');
    cy.contains('a', 'Inbox').should('not.have.class', 'bg-accent');

    // Check filters route
    cy.visit('/settings/filters');
    cy.contains('a', 'Filters & Actions').should('have.class', 'bg-accent');
    cy.contains('a', 'Inbox').should('not.have.class', 'bg-accent');
  });

  it('navigates to correct routes when clicked', () => {
    // Already on inbox page, click processed
    cy.contains('a', 'Processed').click();
    cy.url().should('include', '/processed');

    // Click filters link
    cy.contains('a', 'Filters & Actions').click();
    cy.url().should('include', '/settings/filters');

    // Click back to inbox
    cy.contains('a', 'Inbox').click();
    cy.url().should('include', '/inbox');
  });

  it('displays icons for each menu item', () => {
    cy.get('a').each(($link) => {
      cy.wrap($link).find('svg').should('be.visible');
    });
  });

  it('is responsive on different viewports', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.contains('a', 'Inbox').should('be.visible');
    cy.contains('a', 'Processed').should('be.visible');
    cy.contains('a', 'Filters & Actions').should('be.visible');

    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.contains('a', 'Inbox').should('be.visible');
    cy.contains('a', 'Processed').should('be.visible');
    cy.contains('a', 'Filters & Actions').should('be.visible');
  });
});

describe('Navigation', () => {
  it('redirects root to inbox', () => {
    cy.visit('/');
    cy.url().should('include', '/inbox');
    cy.get('h1').should('contain', 'Inbox');
  });

  // ... existing tests ...
}); 