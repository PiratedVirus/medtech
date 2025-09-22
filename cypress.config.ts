import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      // Test data
      testPhoneNumber: '9876543210',
      testOtp: '1234',
      testPatientName: 'Test Patient',
      testPatientAge: '25',
      testPatientGender: 'Male',
      testDoctorCode: 'DOC123',
      
      // API endpoints
      apiBaseUrl: 'http://localhost:3000/api',
      
      // Test flags
      skipAuth: false,
      mockApiCalls: true
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
