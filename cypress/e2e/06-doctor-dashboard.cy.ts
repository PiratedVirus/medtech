/// <reference types="cypress" />

describe('Doctor Dashboard Workflows', () => {
  beforeEach(() => {
    // Login as doctor before each test
    cy.loginAsDoctor()
    cy.waitForPageLoad()
  })

  describe('Doctor Dashboard Home', () => {
    it('should display doctor dashboard', () => {
      cy.visit('/doctor/home')
      
      // Check if dashboard is displayed
      cy.get('body').should('contain', 'Good morning') // Greeting
      cy.get('body').should('contain', 'Dr.') // Doctor name
    })

    it('should show upcoming appointments', () => {
      cy.visit('/doctor/home')
      
      // Check if upcoming appointments are displayed
      cy.get('[class*="upcoming"], [class*="appointment"]').should('be.visible')
    })

    it('should display quick actions', () => {
      cy.visit('/doctor/home')
      
      // Check if quick action cards are displayed
      cy.get('[class*="action"], [class*="card"]').should('be.visible')
    })

    it('should show patient analytics', () => {
      cy.visit('/doctor/home')
      
      // Check if patient analytics are displayed
      cy.get('[class*="analytics"], [class*="patients"]').should('be.visible')
    })

    it('should display earnings information', () => {
      cy.visit('/doctor/home')
      
      // Check if earnings are displayed
      cy.get('[class*="earnings"], [class*="revenue"]').should('be.visible')
    })

    it('should show video consultation link', () => {
      cy.visit('/doctor/home')
      
      // Check if video consultation is available
      cy.get('[class*="video"], [class*="meeting"]').should('be.visible')
    })
  })

  describe('Patient Management', () => {
    it('should navigate to patients page', () => {
      cy.visit('/doctor/patients')
      
      // Check if patients page is displayed
      cy.get('body').should('contain', 'Patients')
    })

    it('should display patient list', () => {
      cy.visit('/doctor/patients')
      
      // Check if patients are displayed
      cy.get('[class*="patient"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show patient details', () => {
      cy.visit('/doctor/patients')
      
      // Click on a patient
      cy.get('[class*="patient-card"]').first().click()
      
      // Should show patient details
      cy.get('[class*="details"], [class*="profile"]').should('be.visible')
    })

    it('should display patient analytics', () => {
      cy.visit('/doctor/patients')
      cy.get('[class*="patient-card"]').first().click()
      
      // Check if analytics are shown
      cy.get('[class*="analytics"], [class*="charts"]').should('be.visible')
    })

    it('should show patient health metrics', () => {
      cy.visit('/doctor/patients')
      cy.get('[class*="patient-card"]').first().click()
      
      // Check if health metrics are shown
      cy.get('[class*="metrics"], [class*="health"]').should('be.visible')
    })

    it('should display patient history', () => {
      cy.visit('/doctor/patients')
      cy.get('[class*="patient-card"]').first().click()
      
      // Check if history is shown
      cy.get('[class*="history"], [class*="timeline"]').should('be.visible')
    })

    it('should allow searching patients', () => {
      cy.visit('/doctor/patients')
      
      // Look for search input
      cy.get('input[placeholder*="search" i], input[placeholder*="patient" i]').type('John')
      
      // Check if search results are shown
      cy.get('[class*="patient-card"]').should('be.visible')
    })

    it('should filter patients by status', () => {
      cy.visit('/doctor/patients')
      
      // Look for filter options
      cy.get('button').contains('Filter').click()
      
      // Select a status
      cy.get('button').contains('Active').click()
      
      // Check if filtered results are shown
      cy.get('[class*="patient-card"]').should('be.visible')
    })
  })

  describe('Appointment Management', () => {
    it('should navigate to appointments page', () => {
      cy.visit('/doctor/appointments')
      
      // Check if appointments page is displayed
      cy.get('body').should('contain', 'Appointments')
    })

    it('should display appointment list', () => {
      cy.visit('/doctor/appointments')
      
      // Check if appointments are displayed
      cy.get('[class*="appointment"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show appointment details', () => {
      cy.visit('/doctor/appointments')
      
      // Click on an appointment
      cy.get('[class*="appointment-card"]').first().click()
      
      // Should show appointment details
      cy.get('[class*="details"], [class*="modal"]').should('be.visible')
    })

    it('should display patient information in appointment', () => {
      cy.visit('/doctor/appointments')
      cy.get('[class*="appointment-card"]').first().click()
      
      // Check if patient info is shown
      cy.get('[class*="patient"], [class*="info"]').should('be.visible')
    })

    it('should show appointment status', () => {
      cy.visit('/doctor/appointments')
      
      // Check if status is displayed
      cy.get('[class*="status"]').should('be.visible')
    })

    it('should allow updating appointment status', () => {
      cy.visit('/doctor/appointments')
      cy.get('[class*="appointment-card"]').first().click()
      
      // Look for status update button
      cy.get('button').contains('Update').click()
      
      // Should show status options
      cy.get('[class*="status"], [class*="options"]').should('be.visible')
    })

    it('should allow adding notes to appointment', () => {
      cy.visit('/doctor/appointments')
      cy.get('[class*="appointment-card"]').first().click()
      
      // Look for notes section
      cy.get('[class*="notes"], [class*="comments"]').should('be.visible')
      
      // Add a note
      cy.get('textarea[placeholder*="note" i]').type('Patient responded well to treatment')
      
      // Save note
      cy.get('button').contains('Save').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Saved')
    })
  })

  describe('Prescription Creation', () => {
    it('should navigate to prescription page', () => {
      cy.visit('/doctor/prescription')
      
      // Check if prescription page is displayed
      cy.get('body').should('contain', 'Prescription')
    })

    it('should display prescription form', () => {
      cy.visit('/doctor/prescription')
      
      // Check if form is displayed
      cy.get('form').should('be.visible')
    })

    it('should allow selecting patient', () => {
      cy.visit('/doctor/prescription')
      
      // Look for patient selector
      cy.get('select, [class*="select"]').click()
      
      // Select a patient
      cy.get('option, [class*="option"]').first().click()
    })

    it('should allow entering prescription text', () => {
      cy.visit('/doctor/prescription')
      
      // Look for prescription text area
      cy.get('textarea[placeholder*="prescription" i]').type('Metformin 500mg twice daily')
    })

    it('should allow adding medications', () => {
      cy.visit('/doctor/prescription')
      
      // Look for add medication button
      cy.get('button').contains('Add').click()
      
      // Should show medication form
      cy.get('[class*="medication"], [class*="form"]').should('be.visible')
    })

    it('should allow setting medication dosage', () => {
      cy.visit('/doctor/prescription')
      cy.get('button').contains('Add').click()
      
      // Enter dosage
      cy.get('input[placeholder*="dosage" i]').type('500mg')
    })

    it('should allow setting medication frequency', () => {
      cy.visit('/doctor/prescription')
      cy.get('button').contains('Add').click()
      
      // Enter frequency
      cy.get('input[placeholder*="frequency" i]').type('twice daily')
    })

    it('should allow setting medication duration', () => {
      cy.visit('/doctor/prescription')
      cy.get('button').contains('Add').click()
      
      // Enter duration
      cy.get('input[placeholder*="duration" i]').type('30 days')
    })

    it('should allow adding instructions', () => {
      cy.visit('/doctor/prescription')
      
      // Look for instructions field
      cy.get('textarea[placeholder*="instruction" i]').type('Take with food')
    })

    it('should save prescription', () => {
      cy.visit('/doctor/prescription')
      
      // Fill prescription form
      cy.get('textarea[placeholder*="prescription" i]').type('Metformin 500mg twice daily')
      
      // Save prescription
      cy.get('button').contains('Save').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Saved')
    })
  })

  describe('Diet Plan Management (for Dieticians)', () => {
    it('should navigate to diet plans page', () => {
      cy.visit('/doctor/diet-plans')
      
      // Check if diet plans page is displayed
      cy.get('body').should('contain', 'Diet Plans')
    })

    it('should display diet plans list', () => {
      cy.visit('/doctor/diet-plans')
      
      // Check if diet plans are displayed
      cy.get('[class*="diet"], [class*="plan"]').should('have.length.greaterThan', 0)
    })

    it('should create new diet plan', () => {
      cy.visit('/doctor/diet-plans')
      
      // Look for create button
      cy.get('button').contains('Create').click()
      
      // Should show diet plan form
      cy.get('form').should('be.visible')
    })

    it('should allow selecting patient for diet plan', () => {
      cy.visit('/doctor/diet-plans')
      cy.get('button').contains('Create').click()
      
      // Look for patient selector
      cy.get('select, [class*="select"]').click()
      
      // Select a patient
      cy.get('option, [class*="option"]').first().click()
    })

    it('should allow setting meal timings', () => {
      cy.visit('/doctor/diet-plans')
      cy.get('button').contains('Create').click()
      
      // Look for meal timing fields
      cy.get('input[placeholder*="breakfast" i]').type('8:00 AM')
      cy.get('input[placeholder*="lunch" i]').type('1:00 PM')
      cy.get('input[placeholder*="dinner" i]').type('7:00 PM')
    })

    it('should allow adding food items', () => {
      cy.visit('/doctor/diet-plans')
      cy.get('button').contains('Create').click()
      
      // Look for add food button
      cy.get('button').contains('Add Food').click()
      
      // Should show food selection
      cy.get('[class*="food"], [class*="item"]').should('be.visible')
    })

    it('should allow setting portion sizes', () => {
      cy.visit('/doctor/diet-plans')
      cy.get('button').contains('Create').click()
      cy.get('button').contains('Add Food').click()
      
      // Enter portion size
      cy.get('input[placeholder*="portion" i]').type('1 cup')
    })

    it('should save diet plan', () => {
      cy.visit('/doctor/diet-plans')
      cy.get('button').contains('Create').click()
      
      // Fill diet plan form
      cy.get('input[placeholder*="breakfast" i]').type('8:00 AM')
      
      // Save diet plan
      cy.get('button').contains('Save').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Saved')
    })
  })

  describe('Earnings Management', () => {
    it('should navigate to earnings page', () => {
      cy.visit('/doctor/earnings')
      
      // Check if earnings page is displayed
      cy.get('body').should('contain', 'Earnings')
    })

    it('should display earnings summary', () => {
      cy.visit('/doctor/earnings')
      
      // Check if earnings summary is displayed
      cy.get('[class*="summary"], [class*="total"]').should('be.visible')
    })

    it('should show earnings by period', () => {
      cy.visit('/doctor/earnings')
      
      // Check if period selection is available
      cy.get('select, [class*="select"]').should('be.visible')
    })

    it('should display earnings breakdown', () => {
      cy.visit('/doctor/earnings')
      
      // Check if breakdown is shown
      cy.get('[class*="breakdown"], [class*="details"]').should('be.visible')
    })

    it('should show payment history', () => {
      cy.visit('/doctor/earnings')
      
      // Check if payment history is shown
      cy.get('[class*="history"], [class*="payments"]').should('be.visible')
    })
  })

  describe('Slot Management', () => {
    it('should navigate to slots page', () => {
      cy.visit('/doctor/slots')
      
      // Check if slots page is displayed
      cy.get('body').should('contain', 'Slots')
    })

    it('should display available slots', () => {
      cy.visit('/doctor/slots')
      
      // Check if slots are displayed
      cy.get('[class*="slot"], [class*="time"]').should('have.length.greaterThan', 0)
    })

    it('should allow adding new slots', () => {
      cy.visit('/doctor/slots')
      
      // Look for add slot button
      cy.get('button').contains('Add').click()
      
      // Should show slot form
      cy.get('form').should('be.visible')
    })

    it('should allow setting slot time', () => {
      cy.visit('/doctor/slots')
      cy.get('button').contains('Add').click()
      
      // Set slot time
      cy.get('input[type="time"]').type('10:00')
    })

    it('should allow setting slot date', () => {
      cy.visit('/doctor/slots')
      cy.get('button').contains('Add').click()
      
      // Set slot date
      cy.get('input[type="date"]').type('2024-12-31')
    })

    it('should allow setting slot duration', () => {
      cy.visit('/doctor/slots')
      cy.get('button').contains('Add').click()
      
      // Set slot duration
      cy.get('select, [class*="select"]').select('30 minutes')
    })

    it('should save slot', () => {
      cy.visit('/doctor/slots')
      cy.get('button').contains('Add').click()
      
      // Fill slot form
      cy.get('input[type="time"]').type('10:00')
      cy.get('input[type="date"]').type('2024-12-31')
      
      // Save slot
      cy.get('button').contains('Save').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Saved')
    })
  })

  describe('Error Handling', () => {
    it('should handle patient loading errors', () => {
      cy.visit('/doctor/patients')
      
      // Mock API error
      cy.intercept('GET', '**/api/doctor/patients', {
        statusCode: 500,
        body: { success: false, error: 'Failed to load patients' }
      }).as('patientError')
      
      // Should show error state
      cy.get('body').should('contain', 'Error')
    })

    it('should handle appointment loading errors', () => {
      cy.visit('/doctor/appointments')
      
      // Mock API error
      cy.intercept('GET', '**/api/doctor/appointments', {
        statusCode: 500,
        body: { success: false, error: 'Failed to load appointments' }
      }).as('appointmentError')
      
      // Should show error state
      cy.get('body').should('contain', 'Error')
    })

    it('should handle prescription save errors', () => {
      cy.visit('/doctor/prescription')
      
      // Mock API error
      cy.intercept('POST', '**/api/doctor/prescription', {
        statusCode: 500,
        body: { success: false, error: 'Failed to save prescription' }
      }).as('prescriptionError')
      
      // Fill and submit form
      cy.get('textarea[placeholder*="prescription" i]').type('Test prescription')
      cy.get('button').contains('Save').click()
      
      // Should show error message
      cy.get('body').should('contain', 'Error')
    })
  })
})
