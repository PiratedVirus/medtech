# CareDB Cypress E2E Tests

This directory contains comprehensive end-to-end tests for the CareDB healthcare application using Cypress.

## 📁 Test Structure

```
cypress/
├── e2e/                          # Test files
│   ├── 01-authentication.cy.ts   # Authentication workflows
│   ├── 02-patient-dashboard.cy.ts # Patient dashboard workflows
│   ├── 03-appointments.cy.ts     # Appointment booking and management
│   ├── 04-lab-workflows.cy.ts    # Lab booking and report management
│   ├── 05-prescriptions.cy.ts    # Prescription viewing and processing
│   ├── 06-doctor-dashboard.cy.ts # Doctor dashboard workflows
│   └── 07-admin-workflows.cy.ts  # Admin panel workflows
├── fixtures/                     # Test data and mock responses
│   ├── auth/                     # Authentication fixtures
│   ├── doctors/                  # Doctor data fixtures
│   ├── labs/                     # Lab data fixtures
│   └── appointments/             # Appointment data fixtures
├── support/                      # Support files
│   ├── commands.ts               # Custom Cypress commands
│   └── e2e.ts                   # Global configuration
└── cypress.config.ts            # Cypress configuration
```

## 🚀 Getting Started

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npm run dev
   ```

3. **Install Cypress** (if not already installed)
   ```bash
   npm install cypress --save-dev
   ```

### Running Tests

#### Open Cypress Test Runner
```bash
npm run cypress:open
# or
npm run test:e2e:open
```

#### Run Tests in Headless Mode
```bash
npm run cypress:run
# or
npm run test:e2e
```

#### Run Tests in Specific Browser
```bash
npm run cypress:run:chrome
npm run cypress:run:firefox
npm run cypress:run:edge
```

#### Run Tests with Head (Visible Browser)
```bash
npm run cypress:run:headed
```

## 🧪 Test Workflows

### 1. Authentication Tests (`01-authentication.cy.ts`)
- **Patient Login Flow**: Phone number → OTP → Dashboard
- **Patient Registration Flow**: Phone number → OTP → Registration form → Dashboard
- **Doctor Login Flow**: Admin panel access
- **Mobile vs Desktop Login**: Different UI components
- **Form Validation**: Error handling for invalid inputs
- **Navigation Links**: Terms, Privacy Policy, Doctor sign-in

### 2. Patient Dashboard Tests (`02-patient-dashboard.cy.ts`)
- **Dashboard Navigation**: All main navigation items
- **Home Page Components**: Overview, health insights, service cards
- **Profile Management**: View and edit patient profile
- **Health Insights**: View health metrics and detailed data
- **Mobile Navigation**: Responsive design testing
- **User Menu**: Logout functionality
- **Notifications**: Notification bell and panel

### 3. Appointment Tests (`03-appointments.cy.ts`)
- **Doctor Selection**: Browse, filter, and search doctors
- **Appointment Booking**: Complete booking flow with form validation
- **Consultation Types**: Video and clinic consultation selection
- **Payment Processing**: Online and plan payment options
- **Appointment Management**: View, reschedule, cancel appointments
- **Video Consultation**: Join meeting rooms and controls
- **Dietician Appointments**: Specialized dietician booking
- **Error Handling**: Network and API error scenarios

### 4. Lab Workflow Tests (`04-lab-workflows.cy.ts`)
- **Lab Package Selection**: Browse and filter lab packages
- **Lab Booking**: Complete booking flow with address and payment
- **Report Upload**: File upload with validation
- **Report Analysis**: AI-generated insights and recommendations
- **Lab Test History**: View past tests and results
- **Package Details**: Information, tests included, preparation instructions
- **Error Handling**: Booking and upload error scenarios

### 5. Prescription Tests (`05-prescriptions.cy.ts`)
- **Prescription Viewing**: List and detailed view of prescriptions
- **Prescription Processing**: AI analysis status and progress
- **Medicine Search**: Search and view medicine details
- **Prescription Actions**: Download, share, print, regenerate
- **Prescription History**: Timeline and chronological view
- **Error Handling**: Loading and analysis error scenarios

### 6. Doctor Dashboard Tests (`06-doctor-dashboard.cy.ts`)
- **Dashboard Home**: Upcoming appointments, quick actions, analytics
- **Patient Management**: View patients, analytics, health metrics
- **Appointment Management**: View, update status, add notes
- **Prescription Creation**: Create and manage prescriptions
- **Diet Plan Management**: Create diet plans (for dieticians)
- **Earnings Management**: View earnings and payment history
- **Slot Management**: Add and manage appointment slots
- **Error Handling**: API error scenarios

### 7. Admin Workflow Tests (`07-admin-workflows.cy.ts`)
- **Admin Dashboard**: Statistics and recent activity
- **User Management**: View, search, filter, edit users
- **Patient Management**: View patients, health data, export
- **Doctor Management**: Add, edit, manage doctors
- **Appointment Management**: View, filter, update appointments
- **Lab Management**: Manage labs and lab bookings
- **Payment Management**: View payments and analytics
- **Plans Management**: Manage subscription plans
- **LLM Playground**: Test AI processing capabilities
- **Error Handling**: Login and data loading errors

## 🔧 Custom Commands

The test suite includes several custom commands for common operations:

### Authentication Commands
- `cy.loginAsPatient(phoneNumber?)` - Login as a patient
- `cy.loginAsDoctor()` - Login as a doctor

### Utility Commands
- `cy.waitForPageLoad()` - Wait for page to fully load
- `cy.mockApiResponse(endpoint, response)` - Mock API responses
- `cy.clearLocalStorage()` - Clear browser storage
- `cy.fillRegistrationForm(userData)` - Fill registration form
- `cy.selectDoctor(doctorName)` - Select a doctor
- `cy.bookAppointment(appointmentData)` - Book an appointment
- `cy.uploadFile(selector, filePath)` - Upload files

## 📊 Test Data and Fixtures

### Mock API Responses
- **Authentication**: OTP sending, verification, registration
- **Doctors**: Doctor list with specialties and availability
- **Labs**: Lab packages and test results
- **Appointments**: Upcoming and past appointments
- **Prescriptions**: Prescription data and AI analysis

### Test Files
- **Sample Lab Report**: PDF file for upload testing
- **Large File**: For file size validation testing
- **Invalid File**: Text file for file type validation

## 🎯 Selector Strategy

Since the application doesn't use `data-testid` attributes, tests use:

1. **CSS Selectors**: Most reliable for consistent elements
2. **Text Content**: For buttons and labels
3. **Form Field Names**: For input fields
4. **URL-based Navigation**: For routing verification
5. **Class-based Selectors**: Tailwind classes
6. **Attribute Selectors**: For specific elements

### Example Selectors
```typescript
// Phone number input
cy.get('input[type="tel"]')

// OTP inputs
cy.get('input[type="text"]')

// Buttons by text
cy.get('button').contains('Get OTP')

// Form fields by placeholder
cy.get('input[placeholder*="name" i]')

// Cards by class
cy.get('[class*="doctor-card"]')

// Navigation links
cy.get('a[href="/dashboard/doctors"]')
```

## 🔄 Test Configuration

### Environment Variables
```typescript
env: {
  testPhoneNumber: '9876543210',
  testOtp: '1234',
  testPatientName: 'Test Patient',
  testPatientAge: '25',
  testPatientGender: 'Male',
  testDoctorCode: 'DOC123',
  apiBaseUrl: 'http://localhost:3000/api',
  skipAuth: false,
  mockApiCalls: true
}
```

### Viewport Settings
- **Desktop**: 1280x720 (default)
- **Tablet**: 768x1024
- **Mobile**: 375x667

## 🚨 Error Handling

Tests include comprehensive error handling for:
- **Network Errors**: API failures and timeouts
- **Form Validation**: Invalid inputs and required fields
- **File Upload**: Invalid file types and sizes
- **Authentication**: Invalid credentials and OTP
- **Booking Errors**: Payment failures and slot conflicts

## 📈 Best Practices

### Test Organization
- **One workflow per file**: Each file focuses on a specific user journey
- **Descriptive test names**: Clear indication of what each test does
- **Grouped by functionality**: Related tests are grouped in describe blocks
- **Independent tests**: Each test can run independently

### Selector Strategy
- **Use semantic selectors**: Prefer text content over classes
- **Avoid brittle selectors**: Don't rely on implementation details
- **Use data attributes when available**: For critical elements
- **Fallback to multiple strategies**: Combine different selector types

### Test Data
- **Use fixtures for static data**: Mock API responses
- **Generate dynamic data**: For user-specific information
- **Clean up after tests**: Clear storage and cookies
- **Use realistic data**: Test with real-world scenarios

## 🔍 Debugging

### Running Individual Tests
```bash
# Run specific test file
npx cypress run --spec "cypress/e2e/01-authentication.cy.ts"

# Run specific test
npx cypress run --spec "cypress/e2e/01-authentication.cy.ts" --grep "should successfully login"
```

### Debug Mode
```bash
# Open Cypress with debug logs
DEBUG=cypress:* npm run cypress:open
```

### Screenshots and Videos
- Screenshots are automatically taken on test failures
- Videos are recorded for all test runs
- Files are saved in `cypress/screenshots/` and `cypress/videos/`

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run start &
      - run: npm run cypress:run
```

### Docker Integration
```dockerfile
FROM cypress/included:13.15.0
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "cypress:run"]
```

## 📝 Maintenance

### Regular Updates
- **Update Cypress**: Keep Cypress version current
- **Review selectors**: Update selectors when UI changes
- **Update test data**: Keep fixtures current with API changes
- **Add new tests**: Cover new features and workflows

### Test Coverage
- **Critical paths**: All main user journeys
- **Edge cases**: Error scenarios and validation
- **Cross-browser**: Test on different browsers
- **Responsive**: Test on different screen sizes

## 🤝 Contributing

### Adding New Tests
1. **Identify the workflow**: Determine which file to add to
2. **Write descriptive test names**: Clear indication of functionality
3. **Use appropriate selectors**: Follow the selector strategy
4. **Include error handling**: Test both success and failure scenarios
5. **Add fixtures if needed**: Mock data for new API endpoints

### Updating Existing Tests
1. **Test the changes**: Run tests after UI/API changes
2. **Update selectors**: If UI structure changes
3. **Update test data**: If API responses change
4. **Document changes**: Update this README if needed

## 📞 Support

For questions or issues with the test suite:
1. **Check the logs**: Review Cypress output for errors
2. **Update selectors**: UI changes may require selector updates
3. **Verify API responses**: Ensure mock data matches actual responses
4. **Check browser compatibility**: Some tests may be browser-specific

---

**Happy Testing! 🎉**
