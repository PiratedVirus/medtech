# Pathology Panel Implementation

This document describes the complete implementation of the Pathology Panel for the Care Diabetics platform.

## Overview

The Pathology Panel is a comprehensive management system for pathology laboratories that allows:
- Managing phlebotomists and their assignments
- Tracking patient lab assignments and sample collection
- Managing lab tests and test results
- Monitoring the entire lab workflow from assignment to completion

## Features

### 1. Dashboard
- **Phlebotomist Count**: Shows total number of available phlebotomists
- **Upcoming Appointments**: Displays upcoming patient appointments
- **Currently Ongoing**: Shows active phlebotomist assignments
- **Quick Actions**: Assign patients to phlebotomists

### 2. Patient Management
- **Patient List**: View all patients with their lab status
- **Patient Details**: Detailed patient information with timeline
- **Sample Status Tracking**: Monitor sample collection progress
- **Export Functionality**: Export patient data to CSV

### 3. Phlebotomist Management
- **Available Phlebotomists**: List of all phlebotomists with availability status
- **Assignment System**: Assign phlebotomists to patients
- **Location Tracking**: Track phlebotomist current locations
- **Status Updates**: Update phlebotomist availability

### 4. Lab Tests
- **Test Management**: Create and manage lab tests
- **Result Entry**: Update test results with parameters
- **Status Tracking**: Monitor test analysis progress
- **Report Generation**: Generate test reports

## Database Schema

### New Models Added

#### 1. Phlebotomist
```prisma
model Phlebotomist {
  id                Int                    @id @default(autoincrement())
  userId            Int                    @unique
  employeeId        String                 @unique
  specialization    String?
  isAvailable       Boolean                @default(true)
  currentLocation   String?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  deletedAt         DateTime?
  user              User                   @relation(fields: [userId], references: [id])
  labAssignments    LabAssignment[]
}
```

#### 2. PathologyLab
```prisma
model PathologyLab {
  id                Int                    @id @default(autoincrement())
  name              String
  address           String
  contactNumber     String
  email             String?
  licenseNumber     String                 @unique
  isActive          Boolean                @default(true)
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  deletedAt         DateTime?
  labAssignments    LabAssignment[]
}
```

#### 3. LabAssignment
```prisma
model LabAssignment {
  id                Int                    @id @default(autoincrement())
  patientId         Int
  phlebotomistId    Int
  labId             Int
  appointmentId     Int?
  assignedDate      DateTime               @db.Date
  assignedTime      String
  status            LabAssignmentStatus    @default(PENDING)
  sampleCollected   Boolean                @default(false)
  sampleCollectedAt DateTime?
  notes             String?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  deletedAt         DateTime?
  patient           User                   @relation("PatientLabAssignment", fields: [patientId], references: [id])
  phlebotomist      Phlebotomist           @relation(fields: [phlebotomistId], references: [id])
  lab               PathologyLab           @relation(fields: [labId], references: [id])
  appointment       Appointment?           @relation(fields: [appointmentId], references: [id])
  testResults       TestResult[]
}
```

#### 4. LabTest
```prisma
model LabTest {
  id                Int                    @id @default(autoincrement())
  name              String
  code              String                 @unique
  description       String?
  parameters        Json?                  // Array of test parameters
  normalRange       Json?                  // Normal range values
  unit              String?
  isActive          Boolean                @default(true)
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  deletedAt         DateTime?
  testResults       TestResult[]
}
```

#### 5. TestResult
```prisma
model TestResult {
  id                Int                    @id @default(autoincrement())
  labAssignmentId   Int
  labTestId         Int
  result            String?
  unit              String?
  normalRange       String?
  isAbnormal        Boolean                @default(false)
  remarks           String?
  reportedAt        DateTime?
  reportedBy        Int?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  deletedAt         DateTime?
  labAssignment     LabAssignment          @relation(fields: [labAssignmentId], references: [id])
  labTest           LabTest                @relation(fields: [labTestId], references: [id])
  reportedByUser    User?                  @relation("TestResultReporter", fields: [reportedBy], references: [id])
}
```

### Enums Added

#### LabAssignmentStatus
```prisma
enum LabAssignmentStatus {
  PENDING
  ASSIGNED
  PHLEBOTOMIST_LEFT
  SAMPLE_COLLECTED
  IN_LAB
  ANALYZING
  COMPLETED
  CANCELLED
}
```

## File Structure

```
app/
├── pathology/
│   ├── layout.tsx                    # Pathology layout with navigation
│   ├── page.tsx                      # Main dashboard
│   ├── assign-patients/
│   │   └── page.tsx                  # Patient assignment page
│   ├── patients/
│   │   ├── page.tsx                  # Patients list
│   │   └── [patientId]/
│   │       └── page.tsx              # Patient details
│   └── lab-tests/
│       └── page.tsx                  # Lab tests management

components/
└── pathology/
    └── PathologyHeader.tsx           # Pathology navigation header

api/
└── pathology/
    ├── phlebotomists/
    │   └── route.ts                  # Phlebotomist CRUD
    ├── patients/
    │   ├── route.ts                  # Patients list
    │   └── [patientId]/
    │       └── route.ts              # Patient details
    ├── assign-phlebotomist/
    │   └── route.ts                  # Assign phlebotomist to patient
    ├── upcoming-appointments/
    │   └── route.ts                  # Upcoming appointments
    ├── ongoing-assignments/
    │   └── route.ts                  # Ongoing lab assignments
    └── lab-tests/
        ├── route.ts                  # Lab tests CRUD
        └── [testId]/
            └── update-results/
                └── route.ts          # Update test results
```

## API Endpoints

### Phlebotomists
- `GET /api/pathology/phlebotomists` - Get all phlebotomists
- `POST /api/pathology/phlebotomists` - Create new phlebotomist

### Patients
- `GET /api/pathology/patients` - Get all patients
- `GET /api/pathology/patients/[patientId]` - Get patient details

### Assignments
- `POST /api/pathology/assign-phlebotomist` - Assign phlebotomist to patient
- `GET /api/pathology/upcoming-appointments` - Get upcoming appointments
- `GET /api/pathology/ongoing-assignments` - Get ongoing assignments

### Lab Tests
- `GET /api/pathology/lab-tests` - Get all lab tests
- `POST /api/pathology/lab-tests` - Create new lab test
- `POST /api/pathology/lab-tests/[testId]/update-results` - Update test results

## Authentication & Authorization

### Role-Based Access
- Only users with `PATHOLOGY` role can access the pathology panel
- Middleware protection on all `/pathology/*` routes
- JWT token validation for all API endpoints

### Login Flow
1. User logs in through `/login`
2. If user role is `PATHOLOGY`, redirected to `/pathology`
3. All pathology routes are protected and require valid JWT token

## Setup Instructions

### 1. Database Migration
```bash
# Generate and run Prisma migration
npx prisma migrate dev --name add-pathology-models

# Apply the migration
npx prisma migrate deploy
```

### 2. Seed Initial Data
```bash
# Run the pathology seeding script
node scripts/seed-pathology-data.js
```

### 3. Environment Variables
Ensure these environment variables are set:
```env
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
```

### 4. Create Pathology User
To create a pathology user, you can either:
- Update an existing user's role to `PATHOLOGY` in the database
- Create a new user through the registration process and update their role

## Usage Guide

### 1. Dashboard
- View phlebotomist count and availability
- Monitor upcoming appointments
- Track ongoing assignments
- Quick access to assign patients

### 2. Assigning Patients
1. Navigate to "Assign Patients" from dashboard
2. Search for available phlebotomists
3. Search for patients to assign
4. Enter phlebotomist ID for patient
5. Click "Assign Phlebotomist"
6. Confirm assignment in modal

### 3. Managing Patients
1. View patient list with status
2. Click on patient to see details
3. Monitor timeline progress
4. Export patient data as needed

### 4. Lab Tests
1. View all lab tests
2. Click "Update Results" for specific test
3. Enter test parameters and results
4. Save updated results

## Design System

The pathology panel follows the existing design system:
- **Colors**: Green (#22c55e) primary, Orange (#f28a2e) secondary
- **Typography**: Consistent with existing components
- **Layout**: Responsive design with mobile navigation
- **Components**: Reuses existing UI components

## Security Considerations

1. **Authentication**: JWT-based authentication
2. **Authorization**: Role-based access control
3. **Data Validation**: Input validation on all API endpoints
4. **SQL Injection**: Prisma ORM prevents SQL injection
5. **XSS Protection**: React's built-in XSS protection

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live status updates
2. **Mobile App**: Native mobile app for phlebotomists
3. **Analytics**: Dashboard analytics and reporting
4. **Integration**: Integration with external lab systems
5. **Notifications**: Push notifications for status changes
6. **QR Codes**: QR code generation for sample tracking

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure DATABASE_URL is correct
2. **JWT Token**: Check JWT_SECRET environment variable
3. **Role Access**: Verify user has PATHOLOGY role
4. **CORS Issues**: Check API route configurations

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
```

## Support

For issues or questions regarding the pathology panel implementation, please refer to:
- Database schema: `prisma/schema.prisma`
- API routes: `app/api/pathology/`
- Frontend components: `app/pathology/` and `components/pathology/`
- Seeding script: `scripts/seed-pathology-data.js` 