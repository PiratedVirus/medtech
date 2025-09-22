/// <reference types="cypress" />

describe('Authentication Workflows', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  describe('Patient Login Flow', () => {
    it('should successfully login with valid phone number and OTP', () => {
      cy.visit('/login')
      
      // Check if we're on the login page
      cy.get('h1').should('contain', 'Sign in')
      
      // Enter phone number
      cy.get('input[type="tel"]')
        .should('be.visible')
        .type('9876543210')
      
      // Click Get OTP button
      cy.get('button').contains('Get OTP').click()
      
      // Wait for OTP step
      cy.get('h2').should('contain', 'Enter OTP')
      
      // Enter OTP (mocked response)
      cy.get('input[type="text"]').each(($input, index) => {
        cy.wrap($input).type('1')
      })
      
      // Click Verify OTP
      cy.get('button').contains('Verify OTP').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('body').should('contain', 'Dashboard')
    })

    it('should show error for invalid phone number', () => {
      cy.visit('/login')
      
      // Enter invalid phone number
      cy.get('input[type="tel"]').type('123')
      cy.get('button').contains('Get OTP').click()
      
      // Should show error message
      cy.get('p').should('contain', 'Please enter a valid 10-digit phone number')
    })

    it('should show error for invalid OTP', () => {
      cy.visit('/login')
      
      // Enter valid phone number
      cy.get('input[type="tel"]').type('9876543210')
      cy.get('button').contains('Get OTP').click()
      
      // Enter invalid OTP
      cy.get('input[type="text"]').each(($input, index) => {
        cy.wrap($input).type('0')
      })
      
      cy.get('button').contains('Verify OTP').click()
      
      // Should show error message
      cy.get('p').should('contain', 'Failed to verify OTP')
    })

    it('should allow resending OTP', () => {
      cy.visit('/login')
      
      // Enter phone number and get OTP
      cy.get('input[type="tel"]').type('9876543210')
      cy.get('button').contains('Get OTP').click()
      
      // Click resend OTP
      cy.get('button').contains('Resend OTP').click()
      
      // Should show success message or stay on OTP page
      cy.get('h2').should('contain', 'Enter OTP')
    })
  })

  describe('Patient Registration Flow', () => {
    it('should successfully register new user', () => {
      cy.visit('/login')
      
      // Complete login flow first
      cy.get('input[type="tel"]').type('9876543210')
      cy.get('button').contains('Get OTP').click()
      
      // Mock new user response
      cy.intercept('POST', '**/api/auth/verify-otp', {
        success: true,
        userExists: false
      }).as('verifyOtpNewUser')
      
      cy.get('input[type="text"]').each(($input, index) => {
        cy.wrap($input).type('1')
      })
      cy.get('button').contains('Verify OTP').click()
      
      // Should show registration form
      cy.get('h1').should('contain', 'Register')
      
      // Fill registration form
      cy.get('input[placeholder="Enter your name"]').type('Test Patient')
      cy.get('input[placeholder="Enter your age"]').type('25')
      cy.get('input[value="Male"]').check()
      cy.get('input[placeholder="Enter doctor code"]').type('DOC123')
      
      // Submit registration
      cy.get('button').contains('Register').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
    })

    it('should validate registration form fields', () => {
      cy.visit('/login')
      
      // Complete login flow
      cy.get('input[type="tel"]').type('9876543210')
      cy.get('button').contains('Get OTP').click()
      
      cy.intercept('POST', '**/api/auth/verify-otp', {
        success: true,
        userExists: false
      }).as('verifyOtpNewUser')
      
      cy.get('input[type="text"]').each(($input, index) => {
        cy.wrap($input).type('1')
      })
      cy.get('button').contains('Verify OTP').click()
      
      // Try to submit empty form
      cy.get('button').contains('Register').click()
      
      // Should show validation errors
      cy.get('p').should('contain', 'Name must be at least 2 characters')
    })

    it('should validate doctor code format', () => {
      cy.visit('/login')
      
      // Complete login flow
      cy.get('input[type="tel"]').type('9876543210')
      cy.get('button').contains('Get OTP').click()
      
      cy.intercept('POST', '**/api/auth/verify-otp', {
        success: true,
        userExists: false
      }).as('verifyOtpNewUser')
      
      cy.get('input[type="text"]').each(($input, index) => {
        cy.wrap($input).type('1')
      })
      cy.get('button').contains('Verify OTP').click()
      
      // Enter invalid doctor code
      cy.get('input[placeholder="Enter doctor code"]').type('123')
      cy.get('button').contains('Register').click()
      
      // Should show validation error
      cy.get('p').should('contain', 'Doctor code must be 6 characters long')
    })
  })

  describe('Mobile vs Desktop Login', () => {
    it('should show mobile layout on small screens', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('/login')
      
      // Should show mobile sign in component
      cy.get('img[alt="Logo"]').should('be.visible')
      cy.get('h1').should('contain', 'Care Diabetics')
    })

    it('should show desktop layout on large screens', () => {
      cy.viewport(1280, 720) // Desktop
      cy.visit('/login')
      
      // Should show desktop layout with hero section
      cy.get('h1').should('contain', 'Sign in')
      cy.get('input[type="tel"]').should('be.visible')
    })
  })

  describe('Doctor Login Flow', () => {
    it('should successfully login as doctor', () => {
      cy.visit('/admin/login')
      
      // Check if we're on admin login page
      cy.get('body').should('contain', 'Admin Login')
      
      // Fill login form (adjust selectors based on actual form)
      cy.get('input[name="email"], input[type="email"]').type('doctor@test.com')
      cy.get('input[name="password"], input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to admin dashboard
      cy.url().should('include', '/admin')
    })
  })

  describe('Navigation and Links', () => {
    it('should navigate to terms and conditions', () => {
      cy.visit('/login')
      
      cy.get('a').contains('Terms and Conditions').click()
      cy.url().should('include', '/about/policies#terms-conditions')
    })

    it('should navigate to privacy policy', () => {
      cy.visit('/login')
      
      cy.get('a').contains('Privacy Policy').click()
      cy.url().should('include', '/about/policies#privacy-policy')
    })

    it('should show doctor sign in link', () => {
      cy.visit('/login')
      
      cy.get('a').contains('Sign In').should('be.visible')
    })
  })
})
