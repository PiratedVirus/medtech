// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to login as a patient
Cypress.Commands.add('loginAsPatient', (phoneNumber = '9876543210') => {
  cy.visit('/login')
  
  // Enter phone number
  cy.get('input[type="tel"]').type(phoneNumber)
  cy.get('button').contains('Get OTP').click()
  
  // Wait for OTP step
  cy.get('h2').should('contain', 'Enter OTP')
  
  // Enter OTP (mocked)
  cy.get('input[type="text"]').each(($input, index) => {
    cy.wrap($input).type('1')
  })
  
  cy.get('button').contains('Verify OTP').click()
  
  // Should redirect to dashboard
  cy.url().should('include', '/dashboard')
})

// Custom command to login as a doctor
Cypress.Commands.add('loginAsDoctor', () => {
  cy.visit('/admin/login')
  
  // Fill doctor login form (adjust selectors based on actual form)
  cy.get('input[name="email"]').type('doctor@test.com')
  cy.get('input[name="password"]').type('password123')
  cy.get('button[type="submit"]').click()
  
  // Should redirect to admin dashboard
  cy.url().should('include', '/admin')
})

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.get('[data-testid="loader"], .cd-loader').should('not.exist')
})

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (endpoint: string, response: any) => {
  cy.intercept('GET', `**${endpoint}**`, response).as(`mock${endpoint.replace(/\//g, '')}`)
})

// Custom command to clear local storage
Cypress.Commands.add('clearLocalStorage', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
  })
})

// Custom command to fill registration form
Cypress.Commands.add('fillRegistrationForm', (userData: {
  name: string
  age: string
  gender: 'Male' | 'Female' | 'Other'
  doctorCode?: string
}) => {
  cy.get('input[placeholder="Enter your name"]').type(userData.name)
  cy.get('input[placeholder="Enter your age"]').type(userData.age)
  cy.get(`input[value="${userData.gender}"]`).check()
  
  if (userData.doctorCode) {
    cy.get('input[placeholder="Enter doctor code"]').type(userData.doctorCode)
  }
})

// Custom command to select doctor
Cypress.Commands.add('selectDoctor', (doctorName: string) => {
  cy.get('button').contains(doctorName).click()
})

// Custom command to book appointment
Cypress.Commands.add('bookAppointment', (appointmentData: {
  appointmentFor: string
  fullName: string
  mobile: string
  email: string
  consultationType: 'video' | 'clinic'
}) => {
  cy.get('input[placeholder*="name" i]').type(appointmentData.fullName)
  cy.get('input[placeholder*="mobile" i]').type(appointmentData.mobile)
  cy.get('input[placeholder*="email" i]').type(appointmentData.email)
  
  if (appointmentData.consultationType === 'video') {
    cy.get('button').contains('Video').click()
  } else {
    cy.get('button').contains('Clinic').click()
  }
  
  cy.get('button').contains('Book').click()
})

// Custom command to upload file
Cypress.Commands.add('uploadFile', (selector: string, filePath: string) => {
  cy.get(selector).selectFile(filePath, { force: true })
})

// Custom command to wait for API call
Cypress.Commands.add('waitForApiCall', (alias: string) => {
  cy.wait(`@${alias}`)
})
