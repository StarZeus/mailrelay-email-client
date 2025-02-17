describe('Header Component', () => {
  beforeEach(() => {
    cy.visit('/inbox');
  });

  it('displays the logo and title', () => {
    cy.contains('MailRelay').should('be.visible');
    cy.contains('SMTP Client').should('be.visible');
    cy.contains('Secure Email Processing').should('be.visible');
  });

  it('has a working search functionality', () => {
    const searchTerm = 'test search';
    cy.get('input[placeholder="Type to search..."]')
      .should('be.visible')
      .type(searchTerm);

    // Wait for debounce
    cy.wait(300);

    // Check URL parameters
    cy.url().should('include', `q=${searchTerm.replace(' ', '+')}`);
  });

  it('preserves existing URL parameters when searching', () => {
    // Visit with existing parameter
    cy.visit('/inbox?existing=param');

    const searchTerm = 'test search';
    cy.get('input[placeholder="Type to search..."]')
      .should('be.visible')
      .type(searchTerm);

    // Wait for debounce
    cy.wait(300);

    // Check that both parameters exist
    cy.url().should('include', 'existing=param');
    cy.url().should('include', `q=${searchTerm.replace(' ', '+')}`);
  });

  it('is responsive', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.contains('MailRelay').should('be.visible');
    cy.get('input[placeholder="Type to search..."]').should('be.visible');

    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.contains('MailRelay').should('be.visible');
    cy.get('input[placeholder="Type to search..."]').should('be.visible');

    // Test on desktop viewport
    cy.viewport(1280, 720);
    cy.contains('MailRelay').should('be.visible');
    cy.get('input[placeholder="Type to search..."]').should('be.visible');
  });
}); 