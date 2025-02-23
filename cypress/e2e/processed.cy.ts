describe('Processed Emails Page', () => {
  beforeEach(() => {
    cy.visit('/processed', { timeout: 10000 } );
  });

  it('displays the processed emails layout correctly', () => {
    cy.get('h1').should('contain', 'Processed Emails');
    cy.get('[data-testid="rules-list"]').should('exist');
  });

  it('shows empty state when no processed emails', () => {
    cy.get('[data-testid="rules-list"]').within(() => {
      cy.contains('No processed emails found').should('exist');
    });
  });

  it('loads and displays processed emails grouped by rules', () => {
    cy.get('[data-testid="rules-list"]').within(() => {
      cy.get('[data-testid="rule-item"]').should('have.length.at.least', 1);
      cy.get('[data-testid="rule-item"]').first().click();
      cy.get('[data-testid="processed-emails"]').should('exist');
    });
  });

  it('shows email details when clicked', () => {
    cy.get('[data-testid="rule-item"]').first().click();
    cy.get('[data-testid="email-item"]').first().click();
    cy.get('[data-testid="email-detail"]').should('exist');
    cy.get('[data-testid="email-detail-subject"]').should('exist');
    cy.get('[data-testid="email-detail-content"]').should('exist');
  });

  it('displays processing status and details', () => {
    cy.get('[data-testid="rule-item"]').first().click();
    cy.get('[data-testid="email-item"]').first().click();
    cy.get('[data-testid="email-detail"]').within(() => {
      cy.contains('Rule:').should('exist');
      cy.contains('Status:').should('exist');
      cy.contains('Processed At:').should('exist');
    });
  });

  it('allows toggling between rules', () => {
    cy.get('[data-testid="rule-item"]').first().click();
    cy.get('[data-testid="processed-emails"]').should('be.visible');
    cy.get('[data-testid="rule-item"]').last().click();
    cy.get('[data-testid="processed-emails"]').should('be.visible');
  });

  it('shows rule details and actions taken', () => {
    cy.get('[data-testid="rule-item"]').first().click();
    cy.get('[data-testid="email-item"]').first().click();
    cy.get('[data-testid="email-detail"]').within(() => {
      cy.contains('Rule:').should('exist');
      cy.contains('Status:').should('exist');
      cy.contains('Processed At:').should('exist');
    });
  });

  it('is responsive on different viewports', () => {
    // Desktop view
    cy.viewport(1024, 768);
    cy.get('[data-testid="rules-list"]').should('be.visible');
    cy.get('[data-testid="email-detail"]').should('be.visible');

    // Mobile view
    cy.viewport(375, 667);
    cy.get('[data-testid="rules-list"]').should('be.visible');
    cy.get('[data-testid="email-detail"]').should('be.visible');
  });
}); 