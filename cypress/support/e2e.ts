import '@cypress/code-coverage/support';
import '@testing-library/cypress/add-commands';

declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom commands here if needed
    }
  }
}

// Prevent TypeScript errors when accessing error messages in tests
Cypress.on('uncaught:exception', (err) => {
  return false;
}); 