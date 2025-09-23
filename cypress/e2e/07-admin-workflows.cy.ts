/// <reference types="cypress" />

describe('Admin Workflows', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/admin/login')
    
    // Fill admin login form
    cy.get('input[name="email"], input[type="email"]').type('admin@test.com')
    cy.get('input[name="password"], input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    
    // Should redirect to admin dashboard
    cy.url().should('include', '/admin')
  })

  describe('Admin Dashboard', () => {
    it('should display admin dashboard', () => {
      cy.visit('/admin')
      
      // Check if admin dashboard is displayed
      cy.get('body').should('contain', 'Admin')
    })

    it('should show navigation sidebar', () => {
      cy.visit('/admin')
      
      // Check if sidebar navigation is displayed
      cy.get('[class*="sidebar"], [class*="nav"]').should('be.visible')
    })

    it('should display dashboard statistics', () => {
      cy.visit('/admin')
      
      // Check if statistics are displayed
      cy.get('[class*="stat"], [class*="metric"]').should('be.visible')
    })

    it('should show recent activity', () => {
      cy.visit('/admin')
      
      // Check if recent activity is displayed
      cy.get('[class*="activity"], [class*="recent"]').should('be.visible')
    })
  })

  describe('User Management', () => {
    it('should navigate to users page', () => {
      cy.visit('/admin/users')
      
      // Check if users page is displayed
      cy.get('body').should('contain', 'Users')
    })

    it('should display users list', () => {
      cy.visit('/admin/users')
      
      // Check if users are displayed
      cy.get('[class*="user"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show user details', () => {
      cy.visit('/admin/users')
      
      // Click on a user
      cy.get('[class*="user-card"]').first().click()
      
      // Should show user details
      cy.get('[class*="details"], [class*="profile"]').should('be.visible')
    })

    it('should allow searching users', () => {
      cy.visit('/admin/users')
      
      // Look for search input
      cy.get('input[placeholder*="search" i], input[placeholder*="user" i]').type('john')
      
      // Check if search results are shown
      cy.get('[class*="user-card"]').should('be.visible')
    })

    it('should allow filtering users by role', () => {
      cy.visit('/admin/users')
      
      // Look for filter options
      cy.get('button').contains('Filter').click()
      
      // Select a role
      cy.get('button').contains('Patient').click()
      
      // Check if filtered results are shown
      cy.get('[class*="user-card"]').should('be.visible')
    })

    it('should allow editing user details', () => {
      cy.visit('/admin/users')
      cy.get('[class*="user-card"]').first().click()
      
      // Look for edit button
      cy.get('button').contains('Edit').click()
      
      // Should show edit form
      cy.get('form').should('be.visible')
    })

    it('should allow deactivating users', () => {
      cy.visit('/admin/users')
      cy.get('[class*="user-card"]').first().click()
      
      // Look for deactivate button
      cy.get('button').contains('Deactivate').click()
      
      // Should show confirmation dialog
      cy.get('[class*="confirm"], [class*="dialog"]').should('be.visible')
    })
  })

  describe('Patient Management', () => {
    it('should navigate to patients page', () => {
      cy.visit('/admin/patients')
      
      // Check if patients page is displayed
      cy.get('body').should('contain', 'Patients')
    })

    it('should display patients list', () => {
      cy.visit('/admin/patients')
      
      // Check if patients are displayed
      cy.get('[class*="patient"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show patient details', () => {
      cy.visit('/admin/patients')
      
      // Click on a patient
      cy.get('[class*="patient-card"]').first().click()
      
      // Should show patient details
      cy.get('[class*="details"], [class*="profile"]').should('be.visible')
    })

    it('should display patient health data', () => {
      cy.visit('/admin/patients')
      cy.get('[class*="patient-card"]').first().click()
      
      // Check if health data is shown
      cy.get('[class*="health"], [class*="data"]').should('be.visible')
    })

    it('should show patient appointments', () => {
      cy.visit('/admin/patients')
      cy.get('[class*="patient-card"]').first().click()
      
      // Check if appointments are shown
      cy.get('[class*="appointments"]').should('be.visible')
    })

    it('should show patient prescriptions', () => {
      cy.visit('/admin/patients')
      cy.get('[class*="patient-card"]').first().click()
      
      // Check if prescriptions are shown
      cy.get('[class*="prescriptions"]').should('be.visible')
    })

    it('should allow exporting patient data', () => {
      cy.visit('/admin/patients')
      
      // Look for export button
      cy.get('button').contains('Export').click()
      
      // Should show export options
      cy.get('[class*="export"], [class*="modal"]').should('be.visible')
    })
  })

  describe('Doctor Management', () => {
    it('should navigate to doctors page', () => {
      cy.visit('/admin/doctors')
      
      // Check if doctors page is displayed
      cy.get('body').should('contain', 'Doctors')
    })

    it('should display doctors list', () => {
      cy.visit('/admin/doctors')
      
      // Check if doctors are displayed
      cy.get('[class*="doctor"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show doctor details', () => {
      cy.visit('/admin/doctors')
      
      // Click on a doctor
      cy.get('[class*="doctor-card"]').first().click()
      
      // Should show doctor details
      cy.get('[class*="details"], [class*="profile"]').should('be.visible')
    })

    it('should allow adding new doctor', () => {
      cy.visit('/admin/doctors')
      
      // Look for add button
      cy.get('button').contains('Add').click()
      
      // Should show doctor form
      cy.get('form').should('be.visible')
    })

    it('should allow editing doctor details', () => {
      cy.visit('/admin/doctors')
      cy.get('[class*="doctor-card"]').first().click()
      
      // Look for edit button
      cy.get('button').contains('Edit').click()
      
      // Should show edit form
      cy.get('form').should('be.visible')
    })

    it('should allow managing doctor availability', () => {
      cy.visit('/admin/doctors')
      cy.get('[class*="doctor-card"]').first().click()
      
      // Look for availability section
      cy.get('[class*="availability"]').should('be.visible')
    })

    it('should show doctor earnings', () => {
      cy.visit('/admin/doctors')
      cy.get('[class*="doctor-card"]').first().click()
      
      // Check if earnings are shown
      cy.get('[class*="earnings"], [class*="revenue"]').should('be.visible')
    })
  })

  describe('Appointment Management', () => {
    it('should navigate to appointments page', () => {
      cy.visit('/admin/appointments')
      
      // Check if appointments page is displayed
      cy.get('body').should('contain', 'Appointments')
    })

    it('should display appointments list', () => {
      cy.visit('/admin/appointments')
      
      // Check if appointments are displayed
      cy.get('[class*="appointment"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show appointment details', () => {
      cy.visit('/admin/appointments')
      
      // Click on an appointment
      cy.get('[class*="appointment-card"]').first().click()
      
      // Should show appointment details
      cy.get('[class*="details"], [class*="modal"]').should('be.visible')
    })

    it('should allow filtering appointments by status', () => {
      cy.visit('/admin/appointments')
      
      // Look for filter options
      cy.get('button').contains('Filter').click()
      
      // Select a status
      cy.get('button').contains('Scheduled').click()
      
      // Check if filtered results are shown
      cy.get('[class*="appointment-card"]').should('be.visible')
    })

    it('should allow filtering appointments by date', () => {
      cy.visit('/admin/appointments')
      
      // Look for date filter
      cy.get('input[type="date"]').type('2024-12-31')
      
      // Check if filtered results are shown
      cy.get('[class*="appointment-card"]').should('be.visible')
    })

    it('should allow updating appointment status', () => {
      cy.visit('/admin/appointments')
      cy.get('[class*="appointment-card"]').first().click()
      
      // Look for status update button
      cy.get('button').contains('Update Status').click()
      
      // Should show status options
      cy.get('[class*="status"], [class*="options"]').should('be.visible')
    })

    it('should allow canceling appointments', () => {
      cy.visit('/admin/appointments')
      cy.get('[class*="appointment-card"]').first().click()
      
      // Look for cancel button
      cy.get('button').contains('Cancel').click()
      
      // Should show confirmation dialog
      cy.get('[class*="confirm"], [class*="dialog"]').should('be.visible')
    })
  })

  describe('Lab Management', () => {
    it('should navigate to labs page', () => {
      cy.visit('/admin/labs')
      
      // Check if labs page is displayed
      cy.get('body').should('contain', 'Labs')
    })

    it('should display labs list', () => {
      cy.visit('/admin/labs')
      
      // Check if labs are displayed
      cy.get('[class*="lab"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show lab details', () => {
      cy.visit('/admin/labs')
      
      // Click on a lab
      cy.get('[class*="lab-card"]').first().click()
      
      // Should show lab details
      cy.get('[class*="details"], [class*="profile"]').should('be.visible')
    })

    it('should allow adding new lab', () => {
      cy.visit('/admin/labs')
      
      // Look for add button
      cy.get('button').contains('Add').click()
      
      // Should show lab form
      cy.get('form').should('be.visible')
    })

    it('should allow editing lab details', () => {
      cy.visit('/admin/labs')
      cy.get('[class*="lab-card"]').first().click()
      
      // Look for edit button
      cy.get('button').contains('Edit').click()
      
      // Should show edit form
      cy.get('form').should('be.visible')
    })

    it('should show lab bookings', () => {
      cy.visit('/admin/lab-bookings')
      
      // Check if lab bookings are displayed
      cy.get('[class*="booking"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should allow managing lab assignments', () => {
      cy.visit('/admin/lab-bookings')
      
      // Look for assignment options
      cy.get('[class*="assignment"], [class*="assign"]').should('be.visible')
    })
  })

  describe('Payment Management', () => {
    it('should navigate to payments page', () => {
      cy.visit('/admin/payments')
      
      // Check if payments page is displayed
      cy.get('body').should('contain', 'Payments')
    })

    it('should display payments list', () => {
      cy.visit('/admin/payments')
      
      // Check if payments are displayed
      cy.get('[class*="payment"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show payment details', () => {
      cy.visit('/admin/payments')
      
      // Click on a payment
      cy.get('[class*="payment-card"]').first().click()
      
      // Should show payment details
      cy.get('[class*="details"], [class*="modal"]').should('be.visible')
    })

    it('should allow filtering payments by status', () => {
      cy.visit('/admin/payments')
      
      // Look for filter options
      cy.get('button').contains('Filter').click()
      
      // Select a status
      cy.get('button').contains('Paid').click()
      
      // Check if filtered results are shown
      cy.get('[class*="payment-card"]').should('be.visible')
    })

    it('should show payment analytics', () => {
      cy.visit('/admin/payments')
      
      // Check if analytics are displayed
      cy.get('[class*="analytics"], [class*="chart"]').should('be.visible')
    })
  })

  describe('Plans Management', () => {
    it('should navigate to plans page', () => {
      cy.visit('/admin/plans')
      
      // Check if plans page is displayed
      cy.get('body').should('contain', 'Plans')
    })

    it('should display plans list', () => {
      cy.visit('/admin/plans')
      
      // Check if plans are displayed
      cy.get('[class*="plan"], [class*="card"]').should('have.length.greaterThan', 0)
    })

    it('should show plan details', () => {
      cy.visit('/admin/plans')
      
      // Click on a plan
      cy.get('[class*="plan-card"]').first().click()
      
      // Should show plan details
      cy.get('[class*="details"], [class*="profile"]').should('be.visible')
    })

    it('should allow adding new plan', () => {
      cy.visit('/admin/plans')
      
      // Look for add button
      cy.get('button').contains('Add').click()
      
      // Should show plan form
      cy.get('form').should('be.visible')
    })

    it('should allow editing plan details', () => {
      cy.visit('/admin/plans')
      cy.get('[class*="plan-card"]').first().click()
      
      // Look for edit button
      cy.get('button').contains('Edit').click()
      
      // Should show edit form
      cy.get('form').should('be.visible')
    })
  })

  describe('LLM Playground', () => {
    it('should navigate to LLM playground', () => {
      cy.visit('/admin/llm-playground')
      
      // Check if LLM playground is displayed
      cy.get('body').should('contain', 'LLM Playground')
    })

    it('should display LLM interface', () => {
      cy.visit('/admin/llm-playground')
      
      // Check if LLM interface is displayed
      cy.get('[class*="llm"], [class*="playground"]').should('be.visible')
    })

    it('should allow inputting text for processing', () => {
      cy.visit('/admin/llm-playground')
      
      // Look for input area
      cy.get('textarea[placeholder*="input" i]').type('Test prescription text')
    })

    it('should allow selecting input type', () => {
      cy.visit('/admin/llm-playground')
      
      // Look for input type selector
      cy.get('select, [class*="select"]').click()
      
      // Select an input type
      cy.get('option, [class*="option"]').first().click()
    })

    it('should process LLM request', () => {
      cy.visit('/admin/llm-playground')
      
      // Fill form and submit
      cy.get('textarea[placeholder*="input" i]').type('Test prescription text')
      cy.get('button').contains('Process').click()
      
      // Should show processing status
      cy.get('[class*="processing"], [class*="status"]').should('be.visible')
    })

    it('should display LLM results', () => {
      cy.visit('/admin/llm-playground')
      
      // Process a request
      cy.get('textarea[placeholder*="input" i]').type('Test prescription text')
      cy.get('button').contains('Process').click()
      
      // Should show results
      cy.get('[class*="results"], [class*="output"]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle admin login errors', () => {
      cy.visit('/admin/login')
      
      // Enter invalid credentials
      cy.get('input[name="email"], input[type="email"]').type('invalid@test.com')
      cy.get('input[name="password"], input[type="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Should show error message
      cy.get('body').should('contain', 'Error')
    })

    it('should handle data loading errors', () => {
      cy.visit('/admin/users')
      
      // Mock API error
      cy.intercept('GET', '**/api/admin/users', {
        statusCode: 500,
        body: { success: false, error: 'Failed to load users' }
      }).as('usersError')
      
      // Should show error state
      cy.get('body').should('contain', 'Error')
    })

    it('should handle form submission errors', () => {
      cy.visit('/admin/doctors')
      cy.get('button').contains('Add').click()
      
      // Mock API error
      cy.intercept('POST', '**/api/admin/doctors', {
        statusCode: 500,
        body: { success: false, error: 'Failed to create doctor' }
      }).as('doctorError')
      
      // Fill and submit form
      cy.get('input[placeholder*="name" i]').type('Dr. Test')
      cy.get('button').contains('Save').click()
      
      // Should show error message
      cy.get('body').should('contain', 'Error')
    })
  })
})
