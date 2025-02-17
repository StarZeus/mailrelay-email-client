describe('Filters & Actions Page', () => {
  beforeEach(() => {
    cy.visit('/settings/filters');
  });

  it('displays the filters page layout correctly', () => {
    cy.get('h1').should('contain', 'Filter Rules');
    cy.get('button').should('contain', 'New Rule');
  });

  it('lists existing filters', () => {
    cy.get('div[data-testid="filter-list"]').should('exist');
    cy.get('div[data-testid="filter-item"]').should('have.length.at.least', 1);
  });

  it('allows adding a new filter', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('form[data-testid="filter-form"]').should('exist');
    cy.get('input[name="name"]').type('Test Filter');
    cy.get('input[name="condition"]').type('subject:test');
    cy.get('button[type="submit"]').click();
    cy.get('div[data-testid="filter-item"]').should('contain', 'Test Filter');
  });

  it('allows editing existing filters', () => {
    cy.get('div[data-testid="filter-item"]').first().click();
    cy.get('button').contains('Edit').click();
    cy.get('form[data-testid="filter-form"]').should('exist');
    cy.get('input[name="name"]').clear().type('Updated Filter');
    cy.get('button[type="submit"]').click();
    cy.get('div[data-testid="filter-item"]').should('contain', 'Updated Filter');
  });

  it('allows deleting filters', () => {
    cy.get('div[data-testid="filter-item"]').then($items => {
      const initialCount = $items.length;
      cy.get('div[data-testid="filter-item"]').first().click();
      cy.get('button').contains('Delete').click();
      cy.get('button').contains('Confirm').click();
      cy.get('div[data-testid="filter-item"]').should('have.length', initialCount - 1);
    });
  });

  it('allows toggling filter status', () => {
    cy.get('div[data-testid="filter-item"]').first().within(() => {
      cy.get('button[data-testid="toggle-status"]').click();
      cy.get('[data-testid="status-indicator"]').should('have.class', 'bg-red-500');
    });
  });

  it('validates filter form inputs', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]').should('exist');
  });

  it('is responsive on different viewports', () => {
    // Test desktop view
    cy.viewport(1024, 768);
    cy.get('div[data-testid="filter-list"]').should('be.visible');
    cy.get('button').contains('New Rule').should('be.visible');

    // Test mobile view
    cy.viewport(375, 667);
    cy.get('div[data-testid="filter-list"]').should('be.visible');
    cy.get('button').contains('New Rule').should('be.visible');
  });
}); 