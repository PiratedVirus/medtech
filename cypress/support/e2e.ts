// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Custom commands for CareDB application
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsPatient(phoneNumber?: string): Chainable<void>
      loginAsDoctor(): Chainable<void>
      waitForPageLoad(): Chainable<void>
      mockApiResponse(endpoint: string, response: any): Chainable<void>
      clearLocalStorage(): Chainable<void>
    }
  }
}

// Global before hook
beforeEach(() => {
  // Clear all cookies and local storage before each test
  cy.clearCookies()
  cy.clearLocalStorage()
  
  // Mock external services
  cy.intercept('POST', '**/api/auth/send-otp', { 
    fixture: 'auth/send-otp-success.json' 
  }).as('sendOtp')
  
  cy.intercept('POST', '**/api/auth/verify-otp', { 
    fixture: 'auth/verify-otp-success.json' 
  }).as('verifyOtp')
  
  cy.intercept('POST', '**/api/auth/register', { 
    fixture: 'auth/register-success.json' 
  }).as('register')
  
  // Mock dashboard data
  cy.intercept('GET', '**/api/doctors/get-doctors*', { 
    fixture: 'doctors/doctors-list.json' 
  }).as('getDoctors')
  
  cy.intercept('GET', '**/api/labs*', { 
    fixture: 'labs/labs-data.json' 
  }).as('getLabs')
  
  cy.intercept('GET', '**/api/appointments*', { 
    fixture: 'appointments/appointments-list.json' 
  }).as('getAppointments')
})

// Global after hook
afterEach(() => {
  // Clean up after each test
  cy.clearLocalStorage()
})
