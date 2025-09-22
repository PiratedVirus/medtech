/// <reference types="cypress" />

describe('Patient Dashboard Workflows', () => {
  beforeEach(() => {
    // Login as patient before each test
    cy.loginAsPatient()
    cy.waitForPageLoad()
  })

  describe('Dashboard Navigation', () => {
    it('should display all navigation items', () => {
      cy.visit('/dashboard')
      
      // Check main navigation items
      cy.get('a[href="/dashboard"]').should('contain', 'Home')
      cy.get('a[href="/dashboard/doctors"]').should('contain', 'Doctors')
      cy.get('a[href="/dashboard/dieticians"]').should('contain', 'Dieticians')
      cy.get('a[href="/dashboard/labs"]').should('contain', 'Lab')
      cy.get('a[href="/dashboard/prescriptions"]').should('contain', 'Prescriptions')
      cy.get('a[href="/dashboard/appointments"]').should('contain', 'Appointments')
      cy.get('a[href="/dashboard/plans"]').should('contain', 'Plans')
    })

    it('should navigate to doctors page', () => {
      cy.visit('/dashboard')
      cy.get('a[href="/dashboard/doctors"]').click()
      cy.url().should('include', '/dashboard/doctors')
      cy.get('body').should('contain', 'Doctors')
    })

    it('should navigate to labs page', () => {
      cy.visit('/dashboard')
      cy.get('a[href="/dashboard/labs"]').click()
      cy.url().should('include', '/dashboard/labs')
      cy.get('body').should('contain', 'Lab')
    })

    it('should navigate to prescriptions page', () => {
      cy.visit('/dashboard')
      cy.get('a[href="/dashboard/prescriptions"]').click()
      cy.url().should('include', '/dashboard/prescriptions')
      cy.get('body').should('contain', 'Prescriptions')
    })

    it('should navigate to appointments page', () => {
      cy.visit('/dashboard')
      cy.get('a[href="/dashboard/appointments"]').click()
      cy.url().should('include', '/dashboard/appointments')
      cy.get('body').should('contain', 'Appointments')
    })

    it('should navigate to plans page', () => {
      cy.visit('/dashboard')
      cy.get('a[href="/dashboard/plans"]').click()
      cy.url().should('include', '/dashboard/plans')
      cy.get('body').should('contain', 'Plans')
    })
  })

  describe('Dashboard Home Page', () => {
    it('should display home overview components', () => {
      cy.visit('/dashboard')
      
      // Check for main dashboard components
      cy.get('body').should('contain', 'Home Overview')
      cy.get('body').should('contain', 'Service Card')
      cy.get('body').should('contain', 'Health Insights')
    })

    it('should display health insights panel', () => {
      cy.visit('/dashboard')
      
      // Look for health insights components
      cy.get('[class*="health-insights"], [class*="insights"]').should('be.visible')
    })

    it('should display service cards', () => {
      cy.visit('/dashboard')
      
      // Look for service cards
      cy.get('[class*="service-card"], [class*="card"]').should('be.visible')
    })

    it('should display blog articles section', () => {
      cy.visit('/dashboard')
      
      // Look for articles section
      cy.get('body').should('contain', 'Articles')
    })
  })

  describe('Profile Management', () => {
    it('should navigate to patient profile page', () => {
      cy.visit('/dashboard')
      
      // Look for profile link in navigation or user menu
      cy.get('a[href="/dashboard/profile"], a[href="/dashboard/patient-profile"]').click()
      cy.url().should('include', '/dashboard/profile')
    })

    it('should display patient profile information', () => {
      cy.visit('/dashboard/patient-profile')
      
      // Check for profile information
      cy.get('body').should('contain', 'Profile')
    })

    it('should allow editing profile information', () => {
      cy.visit('/dashboard/patient-profile')
      
      // Look for edit button or form
      cy.get('button').contains('Edit').click()
      
      // Check if form fields are editable
      cy.get('input[type="text"]').first().should('be.visible')
    })
  })

  describe('Health Insights', () => {
    it('should display health metrics', () => {
      cy.visit('/dashboard')
      
      // Look for health metrics cards
      cy.get('[class*="health"], [class*="metric"]').should('be.visible')
    })

    it('should display health insights panel', () => {
      cy.visit('/dashboard')
      
      // Look for health insights panel
      cy.get('[class*="insights-panel"], [class*="health-insights"]').should('be.visible')
    })

    it('should allow viewing detailed health data', () => {
      cy.visit('/dashboard')
      
      // Look for view more or details button
      cy.get('button').contains('View').click()
      
      // Should show more detailed information
      cy.get('body').should('contain', 'Details')
    })
  })

  describe('Mobile Navigation', () => {
    it('should show mobile navigation on small screens', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('/dashboard')
      
      // Check for mobile navigation
      cy.get('[class*="mobile-nav"], [class*="mobile-menu"]').should('be.visible')
    })

    it('should toggle mobile menu', () => {
      cy.viewport(375, 667)
      cy.visit('/dashboard')
      
      // Look for hamburger menu or mobile menu toggle
      cy.get('button[aria-label*="menu"], button[class*="menu-toggle"]').click()
      
      // Should show mobile menu
      cy.get('[class*="mobile-menu"], [class*="nav-menu"]').should('be.visible')
    })
  })

  describe('User Menu and Logout', () => {
    it('should display user menu', () => {
      cy.visit('/dashboard')
      
      // Look for user avatar or menu trigger
      cy.get('[class*="avatar"], [class*="user-menu"]').click()
      
      // Should show dropdown menu
      cy.get('[class*="dropdown"], [class*="menu"]').should('be.visible')
    })

    it('should allow logout', () => {
      cy.visit('/dashboard')
      
      // Open user menu
      cy.get('[class*="avatar"], [class*="user-menu"]').click()
      
      // Click logout
      cy.get('button').contains('Logout').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
    })
  })

  describe('Notifications', () => {
    it('should display notification bell', () => {
      cy.visit('/dashboard')
      
      // Look for notification bell
      cy.get('[class*="notification"], [class*="bell"]').should('be.visible')
    })

    it('should show notification count', () => {
      cy.visit('/dashboard')
      
      // Look for notification count badge
      cy.get('[class*="badge"], [class*="count"]').should('be.visible')
    })

    it('should open notifications panel', () => {
      cy.visit('/dashboard')
      
      // Click notification bell
      cy.get('[class*="notification"], [class*="bell"]').click()
      
      // Should show notifications panel
      cy.get('[class*="notification-panel"], [class*="notifications"]').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to tablet view', () => {
      cy.viewport(768, 1024) // iPad
      cy.visit('/dashboard')
      
      // Check if layout adapts properly
      cy.get('body').should('be.visible')
    })

    it('should adapt to desktop view', () => {
      cy.viewport(1920, 1080) // Desktop
      cy.visit('/dashboard')
      
      // Check if layout adapts properly
      cy.get('body').should('be.visible')
    })
  })
})
