describe('Processed Emails Page', () => {
  beforeEach(() => {
    cy.visit('/processed');
  });

  it('displays the processed emails layout correctly', () => {
    cy.get('h1').should('contain', 'Processed Emails');
    cy.get('div[data-testid="rules-list"]').should('exist');
    cy.get('div[data-testid="processed-emails"]').should('exist');
  });

  it('loads and displays processed emails grouped by rules', () => {
    cy.get('div[data-testid="rules-list"]').within(() => {
      cy.get('div[data-testid="rule-item"]').should('have.length.at.least', 1);
    });
    cy.get('div[data-testid="processed-emails"]').within(() => {
      cy.get('div[data-testid="email-item"]').should('have.length.at.least', 1);
    });
  });

  it('shows email details when clicked', () => {
    cy.get('div[data-testid="email-item"]').first().click();
    cy.get('div[data-testid="email-detail"]').should('exist');
    cy.get('[data-testid="email-detail-subject"]').should('exist');
    cy.get('[data-testid="email-detail-content"]').should('exist');
  });

  it('displays processing status and details', () => {
    cy.get('div[data-testid="email-item"]').first().click();
    cy.get('[data-testid="processing-status"]').should('exist');
    cy.get('[data-testid="processing-details"]').should('exist');
  });

  it('allows toggling between rules', () => {
    cy.get('div[data-testid="rule-item"]').first().click();
    cy.get('div[data-testid="processed-emails"]').should('exist');
    cy.get('div[data-testid="email-item"]').should('have.length.at.least', 1);

    cy.get('div[data-testid="rule-item"]').eq(1).click();
    cy.get('div[data-testid="processed-emails"]').should('exist');
    cy.get('div[data-testid="email-item"]').should('have.length.at.least', 1);
  });

  it('shows rule details and actions taken', () => {
    cy.get('div[data-testid="rule-item"]').first().click();
    cy.get('[data-testid="rule-details"]').should('exist');
    cy.get('[data-testid="rule-actions"]').should('exist');
  });

  it('is responsive on different viewports', () => {
    // Desktop view
    cy.viewport(1024, 768);
    cy.get('div[data-testid="rules-list"]').should('be.visible');
    cy.get('div[data-testid="processed-emails"]').should('be.visible');
    cy.get('div[data-testid="email-item"]').first().click({ force: true });
    cy.get('div[data-testid="email-detail"]').should('be.visible');

    // Mobile view
    cy.viewport(375, 667);
    cy.get('div[data-testid="rules-list"]').should('be.visible');
    cy.get('div[data-testid="processed-emails"]').should('be.visible');
    cy.get('div[data-testid="email-item"]').first().click({ force: true });
    cy.get('div[data-testid="email-detail"]').should('be.visible');
  });
}); 