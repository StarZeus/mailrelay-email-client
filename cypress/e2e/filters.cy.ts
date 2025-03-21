describe('Filters & Actions Page', () => {
  beforeEach(() => {
    cy.visit('/actions');
  });

  it('displays the filters page layout correctly', () => {
    cy.get('h1').should('contain', 'Filters & Actions');
    cy.get('button').contains('New Rule').should('exist');
  });

  it('lists existing filters', () => {
    cy.get('[data-testid="filter-list"]').should('exist');
    cy.get('[data-testid="filter-item"]').should('have.length.at.least', 0);
  });

  it('allows adding a new filter with pattern matching', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('[data-testid="filter-form"]').within(() => {
      cy.get('input').first().type('Test Pattern Filter');
      cy.get('input[name="fromPattern"]').type('*@important.com');
      cy.get('input[name="toPattern"]').type('*@test.com');
      cy.get('input[name="condition"]').type('/URGENT:.*/');
    });
    cy.get('button').contains('Save').click();
  });

  it('allows adding email relay action with MJML template', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('[data-testid="filter-form"]').within(() => {
      cy.get('input').first().type('Test MJML Action');
      cy.get('button').contains('Add Action').click();
      cy.get('button[role="combobox"]').last().click();
    });
    cy.get('[role="option"]').contains('Email Relay').click();
    cy.get('button[role="combobox"]').last().click();
    cy.get('[role="option"]').contains('MJML Template').click();
    cy.get('textarea').first().type('<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>');
    cy.get('input').last().type('email.toEmail');
    cy.get('button').contains('Save').click();
  });

  it('allows adding email relay action with HTML template', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('[data-testid="filter-form"]').within(() => {
      cy.get('input').first().type('Test HTML Action');
      cy.get('button').contains('Add Action').click();
      cy.get('button[role="combobox"]').last().click();
    });
    cy.get('[role="option"]').contains('Email Relay').click();
    cy.get('button[role="combobox"]').last().click();
    cy.get('[role="option"]').contains('HTML Template').click();
    cy.get('textarea').first().type('<!DOCTYPE html><html><body>Test</body></html>');
    cy.get('input').last().type('email.toEmail');
    cy.get('button').contains('Save').click();
  });

  it('validates required fields for email relay action', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('button').contains('Save').click();
    cy.get('[data-testid="error-message"]').should('contain', 'Name is required');
  });

  it('allows toggling filter status', () => {
    cy.get('[data-testid="filter-item"]').first().within(() => {
      cy.get('button[role="switch"]').click();
    });
  });

  it('allows drag and drop of template files', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('[data-testid="filter-form"]').within(() => {
      cy.get('input').first().type('Test Template Drop');
      cy.get('button').contains('Add Action').click();
      cy.get('button[role="combobox"]').last().click();
    });
    cy.get('[role="option"]').contains('Email Relay').click();

    // Test HTML template drop
    const htmlContent = '<!DOCTYPE html><html><body>Test HTML</body></html>';
    const htmlFile = new File([htmlContent], 'template.html', { type: 'text/html' });
    cy.get('textarea').first().parent().trigger('dragover')
      .trigger('drop', { 
        dataTransfer: { 
          files: [htmlFile],
          types: ['Files']
        }
      });

    // Switch to MJML and test MJML template drop
    cy.get('button[role="combobox"]').first().click();
    cy.get('[role="option"]').contains('MJML Template').click();
    
    const mjmlContent = '<mjml><mj-body><mj-text>Test MJML</mj-text></mj-body></mjml>';
    const mjmlFile = new File([mjmlContent], 'template.mjml', { type: 'text/plain' });
    cy.get('textarea').first().parent().trigger('dragover')
      .trigger('drop', { 
        dataTransfer: { 
          files: [mjmlFile],
          types: ['Files']
        }
      });
  });

  it('shows available email variables for templates', () => {
    cy.get('button').contains('New Rule').click();
    cy.get('[data-testid="filter-form"]').within(() => {
      cy.get('button').contains('Add Action').click();
      cy.get('button[role="combobox"]').last().click();
    });
    cy.get('[role="option"]').contains('Email Relay').click();
    cy.get('textarea').first().should('have.attr', 'placeholder').and('contain', 'email.subject');
  });

  it('is responsive on different viewports', () => {
    // Desktop view
    cy.viewport(1024, 768);
    cy.get('[data-testid="filter-list"]').should('be.visible');
    cy.get('button').contains('New Rule').should('be.visible');

    // Mobile view
    cy.viewport(375, 667);
    cy.get('[data-testid="filter-list"]').should('be.visible');
    cy.get('button').contains('New Rule').should('be.visible');
  });
}); 