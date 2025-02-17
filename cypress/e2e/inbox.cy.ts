describe('Inbox Page', () => {
  beforeEach(() => {
    cy.visit('/inbox');
  });

  it('displays the inbox layout correctly', () => {
    cy.get('h1').should('contain', 'Inbox');
    cy.get('div[data-testid="email-list"]').should('exist');
  });

  it('loads and displays emails', () => {
    cy.get('div[data-testid="email-list"]').within(() => {
      cy.get('div[data-testid="email-item"]').should('have.length.at.least', 1);
      cy.get('div[data-testid="email-item"]').first().within(() => {
        cy.get('[data-testid="email-subject"]').should('exist');
        cy.get('[data-testid="email-sender"]').should('exist');
      });
    });
  });

  it('shows email details when clicked', () => {
    cy.get('div[data-testid="email-item"]').first().click();
    cy.get('div[data-testid="email-detail"]').should('exist');
    cy.get('[data-testid="email-detail-subject"]').should('exist');
    cy.get('[data-testid="email-detail-content"]').should('exist');
  });

  it('marks emails as read when opened', () => {
    cy.get('div[data-testid="email-item"]').first().within(() => {
      cy.get('[data-testid="unread-indicator"]').should('exist');
    });
    cy.get('div[data-testid="email-item"]').first().click();
    cy.get('div[data-testid="email-item"]').first().within(() => {
      cy.get('[data-testid="unread-indicator"]').should('not.exist');
    });
  });

  it('handles search functionality', () => {
    cy.get('input[type="search"]').type('test');
    cy.url().should('include', 'q=test');
    cy.get('div[data-testid="email-list"]').should('exist');
  });

  it('implements infinite scroll', () => {
    cy.get('div[data-testid="email-list"]').within(() => {
      cy.get('div[data-testid="email-item"]').its('length').as('initialCount');
      cy.get('div[data-testid="email-list"]').scrollTo('bottom', { ensureScrollable: false });
      cy.get('@initialCount').then((initialCount) => {
        cy.get('div[data-testid="email-item"]').should('have.length.greaterThan', initialCount);
      });
    });
  });

  it('is responsive on different viewports', () => {
    // Desktop view
    cy.viewport(1024, 768);
    cy.get('div[data-testid="email-list"]').should('be.visible');
    cy.get('div[data-testid="email-item"]').first().click({ force: true });
    cy.get('div[data-testid="email-detail"]').should('be.visible');

    // Mobile view
    cy.viewport(375, 667);
    cy.get('div[data-testid="email-list"]').should('be.visible');
    cy.get('div[data-testid="email-item"]').first().click({ force: true });
    cy.get('div[data-testid="email-detail"]').should('be.visible');
  });
}); 