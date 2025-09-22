# Enum Standardization Guide

This guide explains how to use the standardized enums throughout the CareDB application to ensure consistency across the database, API, and frontend.

## Overview

The application now uses standardized enums for all status-like fields to prevent inconsistencies between:
- Database values
- API responses
- Frontend components
- Business logic

## Available Enums

### 1. Appointment Status
```typescript
import { AppointmentStatus } from '@/lib/constants/enums';

// Valid values:
AppointmentStatus.SCHEDULED    // 'SCHEDULED'
AppointmentStatus.CONFIRMED    // 'CONFIRMED'
AppointmentStatus.IN_PROGRESS  // 'IN_PROGRESS'
AppointmentStatus.COMPLETED    // 'COMPLETED'
AppointmentStatus.CANCELLED    // 'CANCELLED'
AppointmentStatus.NO_SHOW      // 'NO_SHOW'
AppointmentStatus.RESCHEDULED  // 'RESCHEDULED'
```

### 2. Consultation Type
```typescript
import { ConsultationType } from '@/lib/constants/enums';

// Valid values:
ConsultationType.VIDEO     // 'VIDEO'
ConsultationType.PHYSICAL  // 'PHYSICAL'
ConsultationType.CLINIC    // 'CLINIC'
```

### 3. Payment Method
```typescript
import { PaymentMethod } from '@/lib/constants/enums';

// Valid values:
PaymentMethod.ONLINE  // 'ONLINE'
PaymentMethod.OFFLINE // 'OFFLINE'
PaymentMethod.CLINIC  // 'CLINIC'
PaymentMethod.PLAN    // 'PLAN'
PaymentMethod.CASH    // 'CASH'
PaymentMethod.CARD    // 'CARD'
```

### 4. Doctor Availability Status
```typescript
import { DoctorAvailabilityStatus } from '@/lib/constants/enums';

// Valid values:
DoctorAvailabilityStatus.AVAILABLE  // 'AVAILABLE'
DoctorAvailabilityStatus.BOOKED    // 'BOOKED'
DoctorAvailabilityStatus.BLOCKED   // 'BLOCKED'
DoctorAvailabilityStatus.CANCELLED // 'CANCELLED'
```

## Usage Examples

### 1. Creating Records

```typescript
// ✅ CORRECT - Use enum values
import { AppointmentStatus, ConsultationType, PaymentMethod } from '@/lib/constants/enums';

const appointment = await prisma.appointment.create({
  data: {
    status: AppointmentStatus.SCHEDULED,
    consultationType: ConsultationType.VIDEO,
    // ... other fields
  }
});

const payment = await prisma.payment.create({
  data: {
    paymentMethod: PaymentMethod.ONLINE,
    // ... other fields
  }
});
```

### 2. Querying Records

```typescript
// ✅ CORRECT - Use enum values in queries
import { AppointmentStatus, ConsultationType } from '@/lib/constants/enums';

const upcomingAppointments = await prisma.appointment.findMany({
  where: {
    status: AppointmentStatus.SCHEDULED,
    consultationType: ConsultationType.VIDEO
  }
});

const completedAppointments = await prisma.appointment.findMany({
  where: {
    status: AppointmentStatus.COMPLETED
  }
});
```

### 3. API Responses

```typescript
// ✅ CORRECT - Return standardized values
import { AppointmentStatus, ConsultationType } from '@/lib/constants/enums';

export async function GET() {
  const appointments = await prisma.appointment.findMany();
  
  return NextResponse.json({
    success: true,
    data: appointments.map(appointment => ({
      id: appointment.id,
      status: appointment.status, // Already standardized
      consultationType: appointment.consultationType, // Already standardized
      // ... other fields
    }))
  });
}
```

### 4. Frontend Components

```typescript
// ✅ CORRECT - Use enum values and display helpers
import { AppointmentStatus, getAppointmentStatusDisplay } from '@/lib/constants/enums';

function AppointmentCard({ appointment }) {
  const statusDisplay = getAppointmentStatusDisplay(appointment.status);
  
  return (
    <div>
      <span>Status: {statusDisplay}</span>
      {appointment.status === AppointmentStatus.SCHEDULED && (
        <button>Confirm Appointment</button>
      )}
    </div>
  );
}
```

### 5. Conditional Logic

```typescript
// ✅ CORRECT - Use enum values in conditions
import { AppointmentStatus, ConsultationType } from '@/lib/constants/enums';

function canStartAppointment(appointment) {
  return appointment.status === AppointmentStatus.CONFIRMED;
}

function isVideoConsultation(appointment) {
  return appointment.consultationType === ConsultationType.VIDEO;
}

function getMeetingLink(appointment) {
  if (appointment.consultationType === ConsultationType.VIDEO) {
    return appointment.appointmentLink;
  }
  return null;
}
```

### 6. Form Handling

```typescript
// ✅ CORRECT - Use enum values in forms
import { ConsultationType, PaymentMethod } from '@/lib/constants/enums';

function AppointmentForm() {
  const [consultationType, setConsultationType] = useState(ConsultationType.VIDEO);
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.ONLINE);
  
  return (
    <form>
      <select 
        value={consultationType} 
        onChange={(e) => setConsultationType(e.target.value)}
      >
        <option value={ConsultationType.VIDEO}>Video Consultation</option>
        <option value={ConsultationType.PHYSICAL}>Physical Visit</option>
        <option value={ConsultationType.CLINIC}>Clinic Visit</option>
      </select>
      
      <select 
        value={paymentMethod} 
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <option value={PaymentMethod.ONLINE}>Online Payment</option>
        <option value={PaymentMethod.OFFLINE}>Offline Payment</option>
        <option value={PaymentMethod.CLINIC}>Clinic Payment</option>
        <option value={PaymentMethod.PLAN}>Subscription Plan</option>
      </select>
    </form>
  );
}
```

## Migration from Legacy Values

### Normalization Functions

Use the normalization functions to convert legacy values:

```typescript
import { 
  normalizeAppointmentStatus, 
  normalizeConsultationType, 
  normalizePaymentMethod 
} from '@/lib/constants/enums';

// Convert legacy values to standardized ones
const legacyStatus = "Scheduled";
const standardizedStatus = normalizeAppointmentStatus(legacyStatus); // "SCHEDULED"

const legacyType = "video";
const standardizedType = normalizeConsultationType(legacyType); // "VIDEO"

const legacyMethod = "online";
const standardizedMethod = normalizePaymentMethod(legacyMethod); // "ONLINE"
```

### Database Migration

Run the standardization script to update existing data:

```bash
# Run the standardization script
node scripts/standardize-enums.js

# Or run the SQL migration directly
psql -d your_database -f prisma/migrations/standardize_enums.sql
```

## Display Helpers

Use the display helper functions for user-facing text:

```typescript
import { 
  getAppointmentStatusDisplay, 
  getConsultationTypeDisplay, 
  getPaymentMethodDisplay 
} from '@/lib/constants/enums';

// Convert enum values to human-readable text
const statusText = getAppointmentStatusDisplay(AppointmentStatus.SCHEDULED); // "Scheduled"
const typeText = getConsultationTypeDisplay(ConsultationType.VIDEO); // "Video Consultation"
const methodText = getPaymentMethodDisplay(PaymentMethod.ONLINE); // "Online Payment"
```

## Best Practices

### 1. Always Use Enums
```typescript
// ❌ WRONG - Don't use string literals
const status = "SCHEDULED";
const type = "VIDEO";

// ✅ CORRECT - Use enum values
const status = AppointmentStatus.SCHEDULED;
const type = ConsultationType.VIDEO;
```

### 2. Import What You Need
```typescript
// ✅ CORRECT - Import only what you need
import { AppointmentStatus } from '@/lib/constants/enums';

// ❌ WRONG - Don't import everything if you only need one enum
import * as Enums from '@/lib/constants/enums';
```

### 3. Use Type Safety
```typescript
// ✅ CORRECT - Use TypeScript types for better type safety
import { AppointmentStatusType } from '@/types/enums';

function updateAppointmentStatus(status: AppointmentStatusType) {
  // TypeScript will ensure only valid status values are passed
}
```

### 4. Validate Input
```typescript
// ✅ CORRECT - Validate input values
import { isValidAppointmentStatus } from '@/types/enums';

function handleStatusUpdate(newStatus: string) {
  if (!isValidAppointmentStatus(newStatus)) {
    throw new Error(`Invalid appointment status: ${newStatus}`);
  }
  // Proceed with valid status
}
```

## Common Mistakes to Avoid

### 1. String Literals
```typescript
// ❌ WRONG - Don't use string literals
if (appointment.status === "SCHEDULED") { ... }

// ✅ CORRECT - Use enum values
if (appointment.status === AppointmentStatus.SCHEDULED) { ... }
```

### 2. Case Sensitivity
```typescript
// ❌ WRONG - Don't rely on case-sensitive comparisons
if (appointment.status === "scheduled") { ... }

// ✅ CORRECT - Use enum values (always uppercase)
if (appointment.status === AppointmentStatus.SCHEDULED) { ... }
```

### 3. Hardcoded Values
```typescript
// ❌ WRONG - Don't hardcode values
const statusOptions = ["SCHEDULED", "CONFIRMED", "COMPLETED"];

// ✅ CORRECT - Use enum values
const statusOptions = Object.values(AppointmentStatus);
```

## Troubleshooting

### 1. Legacy Data Issues
If you encounter legacy data with inconsistent casing:

```typescript
// Use normalization functions
const normalizedStatus = normalizeAppointmentStatus(legacyStatus);
```

### 2. Type Errors
If you get TypeScript errors about enum values:

```typescript
// Make sure you're importing the correct enum
import { AppointmentStatus } from '@/lib/constants/enums';

// And using the enum value, not a string
const status = AppointmentStatus.SCHEDULED; // ✅
const status = "SCHEDULED"; // ❌
```

### 3. Database Inconsistencies
If you see inconsistent values in the database:

1. Run the standardization script: `node scripts/standardize-enums.js`
2. Check for any custom queries that might be inserting non-standard values
3. Update any hardcoded values in your code

## Conclusion

By following this guide and using the standardized enums throughout your application, you'll ensure:

- ✅ Consistent data across the entire application
- ✅ Better type safety with TypeScript
- ✅ Easier maintenance and debugging
- ✅ Reduced bugs from typos and case sensitivity issues
- ✅ Clear, self-documenting code

Remember: Always use the enum values instead of string literals, and leverage the helper functions for display and normalization.
