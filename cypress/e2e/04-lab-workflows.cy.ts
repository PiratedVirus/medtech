/// <reference types="cypress" />

describe('Lab Workflows', () => {
  beforeEach(() => {
    // Login as patient before each test
    cy.loginAsPatient()
    cy.waitForPageLoad()
  })

  describe('Lab Package Selection', () => {
    it('should display available lab packages', () => {
      cy.visit('/dashboard/labs')
      
      // Wait for labs to load
      cy.wait('@getLabs')
      
      // Check if lab packages are displayed
      cy.get('[class*="lab-card"], [class*="package"]').should('have.length.greaterThan', 0)
    })

    it('should show lab package details', () => {
      cy.visit('/dashboard/labs')
      
      // Check if package details are shown
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('h3, h4').should('contain', 'Package') // Package name
        cy.get('p').should('contain', 'Tests') // Test details
        cy.get('span').should('contain', '₹') // Price
        cy.get('button').should('contain', 'Book') // Book button
      })
    })

    it('should filter lab packages by category', () => {
      cy.visit('/dashboard/labs')
      
      // Look for filter options
      cy.get('button').contains('Filter').click()
      
      // Select a category
      cy.get('button').contains('Diabetes').click()
      
      // Check if filtered results are shown
      cy.get('[class*="lab-card"]').should('be.visible')
    })

    it('should search lab packages', () => {
      cy.visit('/dashboard/labs')
      
      // Look for search input
      cy.get('input[placeholder*="search" i], input[placeholder*="lab" i]').type('diabetes')
      
      // Check if search results are shown
      cy.get('[class*="lab-card"]').should('be.visible')
    })

    it('should show package pricing', () => {
      cy.visit('/dashboard/labs')
      
      // Check if pricing is displayed
      cy.get('[class*="price"], [class*="cost"]').should('be.visible')
    })
  })

  describe('Lab Booking', () => {
    it('should navigate to lab booking page', () => {
      cy.visit('/dashboard/labs')
      
      // Click on book lab test button
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Should navigate to booking page
      cy.url().should('include', '/dashboard/labs/')
    })

    it('should display lab booking form', () => {
      cy.visit('/dashboard/labs')
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Check if booking form is displayed
      cy.get('form').should('be.visible')
      cy.get('input[placeholder*="name" i]').should('be.visible')
      cy.get('input[placeholder*="mobile" i]').should('be.visible')
      cy.get('input[placeholder*="email" i]').should('be.visible')
    })

    it('should fill lab booking details', () => {
      cy.visit('/dashboard/labs')
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill booking form
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('input[placeholder*="mobile" i]').type('9876543210')
      cy.get('input[placeholder*="email" i]').type('test@example.com')
      cy.get('textarea[placeholder*="address" i]').type('Test Address')
    })

    it('should select appointment date', () => {
      cy.visit('/dashboard/labs')
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Look for date picker
      cy.get('input[type="date"], [class*="date-picker"]').click()
      
      // Select a date
      cy.get('[class*="date-picker"] button').first().click()
    })

    it('should select payment method', () => {
      cy.visit('/dashboard/labs')
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Select online payment
      cy.get('button').contains('Online').click()
      
      // Select plan payment
      cy.get('button').contains('Plan').click()
    })

    it('should process lab booking payment', () => {
      cy.visit('/dashboard/labs')
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill form and submit
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('input[placeholder*="mobile" i]').type('9876543210')
      cy.get('input[placeholder*="email" i]').type('test@example.com')
      cy.get('textarea[placeholder*="address" i]').type('Test Address')
      
      // Click book lab test
      cy.get('button').contains('Book Lab Test').click()
      
      // Should show payment options
      cy.get('body').should('contain', 'Payment')
    })

    it('should book lab test with plan', () => {
      cy.visit('/dashboard/labs')
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill form and select plan payment
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('input[placeholder*="mobile" i]').type('9876543210')
      cy.get('input[placeholder*="email" i]').type('test@example.com')
      cy.get('textarea[placeholder*="address" i]').type('Test Address')
      
      // Select plan payment
      cy.get('button').contains('Plan').click()
      
      // Click book lab test
      cy.get('button').contains('Book Lab Test').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Success')
    })
  })

  describe('Report Upload', () => {
    it('should display report upload button', () => {
      cy.visit('/dashboard/labs')
      
      // Look for upload button
      cy.get('button').contains('Upload').should('be.visible')
    })

    it('should open file upload dialog', () => {
      cy.visit('/dashboard/labs')
      
      // Click upload button
      cy.get('button').contains('Upload').click()
      
      // Should show file upload dialog
      cy.get('[class*="upload"], [class*="modal"]').should('be.visible')
    })

    it('should upload lab report file', () => {
      cy.visit('/dashboard/labs')
      
      // Click upload button
      cy.get('button').contains('Upload').click()
      
      // Upload file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-lab-report.pdf', { force: true })
      
      // Click upload
      cy.get('button').contains('Upload Report').click()
      
      // Should show success message
      cy.get('body').should('contain', 'Uploaded')
    })

    it('should validate file type', () => {
      cy.visit('/dashboard/labs')
      
      // Click upload button
      cy.get('button').contains('Upload').click()
      
      // Try to upload invalid file type
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample.txt', { force: true })
      
      // Should show error message
      cy.get('body').should('contain', 'Invalid file type')
    })

    it('should validate file size', () => {
      cy.visit('/dashboard/labs')
      
      // Click upload button
      cy.get('button').contains('Upload').click()
      
      // Try to upload large file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/large-file.pdf', { force: true })
      
      // Should show error message
      cy.get('body').should('contain', 'File too large')
    })
  })

  describe('Report Analysis', () => {
    it('should display uploaded reports', () => {
      cy.visit('/dashboard/labs')
      
      // Check if reports are displayed
      cy.get('[class*="report"], [class*="uploaded"]').should('be.visible')
    })

    it('should show report analysis status', () => {
      cy.visit('/dashboard/labs')
      
      // Check if analysis status is shown
      cy.get('[class*="status"], [class*="analysis"]').should('be.visible')
    })

    it('should view report analysis', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a report
      cy.get('[class*="report-card"]').first().click()
      
      // Should show analysis details
      cy.get('[class*="analysis"], [class*="details"]').should('be.visible')
    })

    it('should display AI-generated insights', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a report
      cy.get('[class*="report-card"]').first().click()
      
      // Check for AI insights
      cy.get('[class*="insights"], [class*="ai"]').should('be.visible')
    })

    it('should show health recommendations', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a report
      cy.get('[class*="report-card"]').first().click()
      
      // Check for recommendations
      cy.get('[class*="recommendations"], [class*="suggestions"]').should('be.visible')
    })

    it('should allow downloading report', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a report
      cy.get('[class*="report-card"]').first().click()
      
      // Look for download button
      cy.get('button').contains('Download').click()
      
      // Should trigger download
      cy.get('body').should('contain', 'Download')
    })
  })

  describe('Lab Test History', () => {
    it('should display lab test history', () => {
      cy.visit('/dashboard/labs')
      
      // Check if history is displayed
      cy.get('[class*="history"], [class*="past"]').should('be.visible')
    })

    it('should show test results', () => {
      cy.visit('/dashboard/labs')
      
      // Check if test results are shown
      cy.get('[class*="results"], [class*="values"]').should('be.visible')
    })

    it('should display test dates', () => {
      cy.visit('/dashboard/labs')
      
      // Check if dates are shown
      cy.get('[class*="date"], [class*="time"]').should('be.visible')
    })

    it('should show test status', () => {
      cy.visit('/dashboard/labs')
      
      // Check if status is shown
      cy.get('[class*="status"]').should('be.visible')
    })
  })

  describe('Lab Package Details', () => {
    it('should show package information', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a package
      cy.get('[class*="lab-card"]').first().click()
      
      // Should show package details
      cy.get('[class*="details"], [class*="info"]').should('be.visible')
    })

    it('should display included tests', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a package
      cy.get('[class*="lab-card"]').first().click()
      
      // Check for included tests
      cy.get('[class*="tests"], [class*="included"]').should('be.visible')
    })

    it('should show preparation instructions', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a package
      cy.get('[class*="lab-card"]').first().click()
      
      // Check for preparation instructions
      cy.get('[class*="preparation"], [class*="instructions"]').should('be.visible')
    })

    it('should display pricing breakdown', () => {
      cy.visit('/dashboard/labs')
      
      // Click on a package
      cy.get('[class*="lab-card"]').first().click()
      
      // Check for pricing breakdown
      cy.get('[class*="pricing"], [class*="breakdown"]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle booking errors gracefully', () => {
      cy.visit('/dashboard/labs')
      
      // Mock API error
      cy.intercept('POST', '**/api/lab-bookings', {
        statusCode: 500,
        body: { success: false, error: 'Booking failed' }
      }).as('bookingError')
      
      cy.get('[class*="lab-card"]').first().within(() => {
        cy.get('button').contains('Book').click()
      })
      
      // Fill form and submit
      cy.get('input[placeholder*="name" i]').type('Test Patient')
      cy.get('button').contains('Book Lab Test').click()
      
      // Should show error message
      cy.get('body').should('contain', 'Error')
    })

    it('should handle upload errors', () => {
      cy.visit('/dashboard/labs')
      
      // Mock upload error
      cy.intercept('POST', '**/api/reports/upload', {
        statusCode: 500,
        body: { success: false, error: 'Upload failed' }
      }).as('uploadError')
      
      // Click upload button
      cy.get('button').contains('Upload').click()
      
      // Upload file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-lab-report.pdf', { force: true })
      cy.get('button').contains('Upload Report').click()
      
      // Should show error message
      cy.get('body').should('contain', 'Error')
    })

    it('should handle network errors', () => {
      cy.visit('/dashboard/labs')
      
      // Mock network error
      cy.intercept('GET', '**/api/labs', {
        forceNetworkError: true
      }).as('networkError')
      
      // Should show error state
      cy.get('body').should('contain', 'Error')
    })
  })
})
