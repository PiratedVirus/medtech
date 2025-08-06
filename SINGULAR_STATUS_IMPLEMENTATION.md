# Singular Status Implementation

## Overview

This document describes the implementation of a singular status flow for the lab booking system, replacing the previous three-status approach with a unified status system that provides better user experience through status mapping.

## 🎯 Changes Made

### 1. Database Schema Changes

**Before:**
```prisma
model LabBooking {
  status            String                    // Customer-facing status
  pathologyStatus   LabAssignmentStatus?     // Pathology workflow status
}

model LabAssignment {
  status            LabAssignmentStatus       // Operational status
}
```

**After:**
```prisma
model LabBooking {
  status            LabAssignmentStatus @default(PENDING) // Single status for entire workflow
}

model LabAssignment {
  status            LabAssignmentStatus @default(PENDING) // Same enum, single source of truth
}
```

### 2. Status Mapping System

Created `lib/utils/statusMapping.ts` to provide user-friendly status messages:

```typescript
export const statusMapping = {
  // Patient-friendly statuses
  patient: {
    'PENDING': 'Scheduled',
    'ASSIGNED': 'Phlebotomist Assigned',
    'PHLEBOTOMIST_LEFT': 'Phlebotomist En Route',
    'SAMPLE_COLLECTED': 'Sample Collected',
    'IN_LAB': 'Processing in Lab',
    'ANALYZING': 'Analyzing Results',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  },
  
  // Pathology team statuses (more technical)
  pathology: {
    'PENDING': 'Pending Assignment',
    'ASSIGNED': 'Phlebotomist Assigned',
    'PHLEBOTOMIST_LEFT': 'Phlebotomist Left',
    'SAMPLE_COLLECTED': 'Sample Collected',
    'IN_LAB': 'In Lab Processing',
    'ANALYZING': 'Analyzing',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  }
};
```

### 3. API Updates

#### Lab Booking API (`/api/(end-user)/labs/route.ts`)
- Removed `pathologyStatus` field
- Updated status filtering logic
- Single status sync with LabAssignment

#### Pathology Assignment API (`/api/pathology/assign-phlebotomist/route.ts`)
- Simplified status synchronization
- Single status update instead of dual status updates

#### Status Update API (`/api/pathology/lab-assignments/[assignmentId]/status/route.ts`)
- Direct status sync between LabAssignment and LabBooking
- Removed complex status mapping logic

### 4. Frontend Updates

#### Pathology Dashboard (`app/pathology/page.tsx`)
- Updated status display to use status mapping
- Removed hardcoded status colors and text
- Consistent status display across all sections

#### Patient Details Page (`app/pathology/patients/[patientId]/page.tsx`)
- Updated timeline logic to use single status
- Implemented status mapping for patient-friendly display
- Removed pathologyStatus references

### 5. Migration Script

Created `scripts/migrate-to-single-status.js` to:
- Update existing LabBookings to use single status
- Sync LabAssignment statuses with bookings
- Ensure data consistency

## 🔧 Benefits

### 1. **Simplicity**
- Single source of truth for status
- No more status synchronization complexity
- Easier to understand and maintain

### 2. **Consistency**
- Same status values across all tables
- No risk of status getting out of sync
- Unified workflow tracking

### 3. **User Experience**
- Role-appropriate status messages
- Consistent status colors and styling
- Better accessibility for different user types

### 4. **Performance**
- Fewer database updates
- Simpler queries
- Reduced data transfer

## 🚀 Usage

### For Patients
```typescript
// Shows: "Scheduled", "Phlebotomist Assigned", "Sample Collected", etc.
const patientStatus = getStatusDisplay(status, 'patient');
```

### For Pathology Team
```typescript
// Shows: "Pending Assignment", "Phlebotomist Assigned", "Sample Collected", etc.
const pathologyStatus = getStatusDisplay(status, 'pathology');
```

### Status Colors
```typescript
// Consistent color scheme across the application
const statusColor = getStatusColor(status);
```

## 📋 Migration Steps

1. **Run Database Migration**
   ```bash
   npx prisma migrate dev --name singular-status
   ```

2. **Run Data Migration Script**
   ```bash
   node scripts/migrate-to-single-status.js
   ```

3. **Deploy Updated Code**
   - All API endpoints updated
   - Frontend components updated
   - Status mapping utility deployed

## 🔄 Status Flow

```
Patient Books Lab Test
         ↓
   LabBooking Created
   status: "PENDING"
         ↓
   LabAssignment Created
   status: "PENDING"
         ↓
   Phlebotomist Assigned
   status: "ASSIGNED"
         ↓
   Sample Collection Process
   status: "PHLEBOTOMIST_LEFT" → "SAMPLE_COLLECTED" → "IN_LAB" → "ANALYZING"
         ↓
   Process Complete
   status: "COMPLETED"
```

## 🎨 Status Display Examples

| Technical Status | Patient View | Pathology View | Color |
|------------------|--------------|----------------|-------|
| PENDING | Scheduled | Pending Assignment | Orange |
| ASSIGNED | Phlebotomist Assigned | Phlebotomist Assigned | Blue |
| PHLEBOTOMIST_LEFT | Phlebotomist En Route | Phlebotomist Left | Yellow |
| SAMPLE_COLLECTED | Sample Collected | Sample Collected | Green |
| IN_LAB | Processing in Lab | In Lab Processing | Indigo |
| ANALYZING | Analyzing Results | Analyzing | Purple |
| COMPLETED | Completed | Completed | Emerald |
| CANCELLED | Cancelled | Cancelled | Red |

## 🔍 Testing

### Test Cases
1. **Patient Booking Flow**: Verify status progression from PENDING to COMPLETED
2. **Pathology Assignment**: Ensure status sync between LabAssignment and LabBooking
3. **Status Updates**: Verify status mapping displays correctly for different user roles
4. **Migration**: Ensure existing data is properly migrated

### Manual Testing Steps
1. Create a new lab booking
2. Assign a phlebotomist
3. Update status through pathology panel
4. Verify patient dashboard shows correct status
5. Check status colors and text consistency

## 🐛 Known Issues

None currently identified. The implementation maintains backward compatibility while providing a cleaner, more maintainable solution.

## 📝 Future Enhancements

1. **Custom Status Messages**: Allow customization of status messages per organization
2. **Status Notifications**: Implement real-time status change notifications
3. **Status History**: Track status change history for audit purposes
4. **Multi-language Support**: Extend status mapping to support multiple languages 