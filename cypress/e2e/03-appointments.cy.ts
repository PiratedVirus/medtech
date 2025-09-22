/// <reference types="cypress" />

describe('Appointment Workflows', () => {
  beforeEach(() => {
    // Login as patient before each test
    cy.loginAsPatient()
    cy.waitForPageLoad()
  })

  describe('Doctor Selection', () => {
    it('should display list of available doctors', () => {
      cy.visit('/dashboard/doctors')
      
      // Wait for doctors to load
      cy.wait('@getDoctors')
      
      // Check if doctors are displayed
      cy.get('[class*="doctor-card"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should filter doctors by specialty', () => {
      cy.visit('/dashboard/doctors')
      
      // Look for filter options
      cy.get('button').contains('Filter').click()
      
      // Select a specialty
      cy.get('button').contains('Cardiologist').click()
      
      // Check if filtered results are shown
      cy.get('[class*="doctor-card"]').should('be.visible')
    })

    it('should search for doctors by name', () => {
      cy.visit('/dashboard/doctors')
      
      // Look for search input
      cy.get('input[placeholder*="search" i], input[placeholder*="doctor" i]').type('Dr. Smith')
      
      // Check if search results are shown
      cy.get('[class*="doctor-card"]').should('be.visible')
    })

    it('should display doctor information', () => {
      cy.visit('/dashboard/doctors')
      
      // Check if doctor cards contain required information
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('h3, h4').should('contain', 'Dr.') // Doctor name
        cy.get('p').should('contain', 'Specialty') // Specialty
        cy.get('button').should('contain', 'Book') // Book button
      })
    })

    it('should show doctor availability', () => {
      cy.visit('/dashboard/doctors')
      
      // Check if availability is shown
      cy.get('[class*="availability"], [class*="available"]').should('be.visible')
    })
  })

  describe('Appointment Booking', () => {
    it('should navigate to appointment booking page', () => {
      cy.visit('/dashboard/doctors')
      
      // Click on book appointment button
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Should navigate to booking page
      cy.url().should('include', '/dashboard/appointments/')
    })

    it('should display appointment booking form', () => {
      cy.visit('/dashboard/doctors')
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Check if booking form is displayed
      cy.get('form').should('be.visible')
      cy.get('input[placeholder*="name" i]').should('be.visible')
      cy.get('input[placeholder*="mobile" i]').should('be.visible')
      cy.get('input[placeholder*="email" i]').should('be.visible')
    })

    it('should select consultation type (video/clinic)', () => {
      cy.visit('/dashboard/doctors')
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Select video consultation
      cy.get('button').contains('Video').click()
      
      // Select clinic consultation
      cy.get('button').contains('Clinic').click()
    })

    it('should select appointment date and time', () => {
      cy.visit('/dashboard/doctors')
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Look for date picker
      cy.get('input[type="date"], [class*="date-picker"]').click()
      
      // Select a date
      cy.get('[class*="date-picker"] button').first().click()
      
      // Look for time slots
      cy.get('[class*="time-slot"], [class*="slot"]').first().click()
    })

    it('should fill appointment details', () => {
      cy.visit('/dashboard/doctors')
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill appointment form
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('input[placeholder*="mobile" i]').type('9876543210')
      cy.get('input[placeholder*="email" i]').type('test@example.com')
      
      // Select appointment for
      cy.get('select, [class*="select"]').select('self')
    })

    it('should process payment for appointment', () => {
      cy.visit('/dashboard/doctors')
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill form and select payment method
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('input[placeholder*="mobile" i]').type('9876543210')
      cy.get('input[placeholder*="email" i]').type('test@example.com')
      
      // Select online payment
      cy.get('button').contains('Online').click()
      
      // Click book appointment
      cy.get('button').contains('Book Appointment').click()
      
      // Should show payment options
      cy.get('body').should('contain', 'Payment')
    })

    it('should book appointment with plan', () => {
      cy.visit('/dashboard/doctors')
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill form and select plan payment
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('input[placeholder*="mobile" i]').type('9876543210')
      cy.get('input[placeholder*="email" i]').type('test@example.com')
      
      // Select plan payment
      cy.get('button').contains('Plan').click()
      
      // Click book appointment
      cy.get('button').contains('Book Appointment').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Success')
    })
  })

  describe('Appointment Management', () => {
    it('should display upcoming appointments', () => {
      cy.visit('/dashboard/appointments')
      
      // Wait for appointments to load
      cy.wait('@getAppointments')
      
      // Check if upcoming appointments are displayed
      cy.get('[class*="upcoming"], [class*="appointment"]').should('be.visible')
    })

    it('should display past appointments', () => {
      cy.visit('/dashboard/appointments')
      
      // Look for past appointments section
      cy.get('[class*="past"], [class*="completed"]').should('be.visible')
    })

    it('should show appointment details', () => {
      cy.visit('/dashboard/appointments')
      
      // Click on an appointment
      cy.get('[class*="appointment-card"]').first().click()
      
      // Should show appointment details
      cy.get('[class*="details"], [class*="modal"]').should('be.visible')
    })

    it('should allow rescheduling appointment', () => {
      cy.visit('/dashboard/appointments')
      
      // Look for reschedule button
      cy.get('button').contains('Reschedule').click()
      
      // Should show reschedule form
      cy.get('form, [class*="reschedule"]').should('be.visible')
    })

    it('should allow canceling appointment', () => {
      cy.visit('/dashboard/appointments')
      
      // Look for cancel button
      cy.get('button').contains('Cancel').click()
      
      // Should show confirmation dialog
      cy.get('[class*="confirm"], [class*="dialog"]').should('be.visible')
      
      // Confirm cancellation
      cy.get('button').contains('Yes').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Cancelled')
    })
  })

  describe('Video Consultation', () => {
    it('should join video consultation', () => {
      cy.visit('/dashboard/appointments')
      
      // Look for join meeting button
      cy.get('button').contains('Join').click()
      
      // Should redirect to video consultation
      cy.url().should('include', '/meet')
    })

    it('should display meeting room interface', () => {
      cy.visit('/dashboard/appointments')
      cy.get('button').contains('Join').click()
      
      // Check for video interface elements
      cy.get('[class*="video"], [class*="meeting"]').should('be.visible')
    })

    it('should allow camera and microphone controls', () => {
      cy.visit('/dashboard/appointments')
      cy.get('button').contains('Join').click()
      
      // Look for camera/mic controls
      cy.get('button[aria-label*="camera"], button[aria-label*="microphone"]').should('be.visible')
    })
  })

  describe('Dietician Appointments', () => {
    it('should navigate to dieticians page', () => {
      cy.visit('/dashboard/dieticians')
      
      // Check if dieticians are displayed
      cy.get('[class*="dietician"], [class*="card"]').should('be.visible')
    })

    it('should book dietician appointment', () => {
      cy.visit('/dashboard/dieticians')
      
      // Click on book appointment for dietician
      cy.get('[class*="dietician-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Should show booking form
      cy.get('form').should('be.visible')
    })

    it('should show dietician specialization', () => {
      cy.visit('/dashboard/dieticians')
      
      // Check if specialization is displayed
      cy.get('[class*="specialization"], [class*="specialty"]').should('be.visible')
    })
  })

  describe('Appointment Status', () => {
    it('should show appointment status', () => {
      cy.visit('/dashboard/appointments')
      
      // Check if status is displayed
      cy.get('[class*="status"]').should('be.visible')
    })

    it('should show different statuses', () => {
      cy.visit('/dashboard/appointments')
      
      // Check for different status types
      cy.get('body').should('contain', 'Scheduled')
      cy.get('body').should('contain', 'Completed')
      cy.get('body').should('contain', 'Cancelled')
    })
  })

  describe('Error Handling', () => {
    it('should handle booking errors gracefully', () => {
      cy.visit('/dashboard/doctors')
      
      // Mock API error
      cy.intercept('POST', '**/api/appointments', {
        statusCode: 500,
        body: { success: false, error: 'Booking failed' }
      }).as('bookingError')
      
      cy.get('[class*="doctor-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill form and submit
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('button').contains('Book Appointment').click()
      
      // Should show error message
      cy.get('body').should('contain', 'Error')
    })

    it('should handle network errors', () => {
      cy.visit('/dashboard/appointments')
      
      // Mock network error
      cy.intercept('GET', '**/api/appointments', {
        forceNetworkError: true
      }).as('networkError')
      
      // Should show error state
      cy.get('body').should('contain', 'Error')
    })
  })
})
