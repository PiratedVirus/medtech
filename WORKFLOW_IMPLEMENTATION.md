# Lab Booking Workflow Implementation

## Overview

This document explains the implementation of the lab booking workflow that handles unassigned bookings, phlebotomist assignment, and the movement between upcoming and ongoing appointments.

## 🎯 Workflow Requirements

### **User Requirements:**
1. **Unassigned Booking**: When no phlebotomist is assigned → Show "Assign Phlebotomist" button
2. **Assigned Booking**: When phlebotomist is assigned → Show "Start Appointment" button (still in upcoming)
3. **Started Appointment**: When "Start Appointment" is clicked OR time has passed → Move to ongoing appointments
4. **Ongoing Workflow**: Continue through the sample collection and lab processing stages

## 🔄 Workflow States

### **1. Unassigned State**
```typescript
// LabBooking without LabAssignment
LabBooking {
  labAssignmentId: null,  // No assignment created
  status: "PENDING"       // Initial status
}
```
- **UI**: Shows "Assign Phlebotomist" button
- **Location**: Upcoming Appointments section
- **Action**: Click "Assign Phlebotomist" → Opens assignment modal

### **2. Assigned State (Ready to Start)**
```typescript
// LabAssignment created with phlebotomist
LabAssignment {
  phlebotomistId: 123,    // Phlebotomist assigned
  status: "ASSIGNED"      // Ready to start
}
LabBooking {
  labAssignmentId: 456,   // Linked to assignment
  status: "ASSIGNED"      // Synced status
}
```
- **UI**: Shows "Start Appointment" button
- **Location**: Upcoming Appointments section
- **Action**: Click "Start Appointment" → Moves to ongoing

### **3. Started State (Ongoing)**
```typescript
// Appointment has started
LabAssignment {
  status: "PHLEBOTOMIST_LEFT"  // Started workflow
}
LabBooking {
  status: "PHLEBOTOMIST_LEFT"  // Synced status
}
```
- **UI**: Shows in Ongoing Assignments section
- **Location**: Ongoing Assignments section
- **Action**: Continue through workflow stages

## 📊 Database Logic

### **Upcoming Appointments Query**
```typescript
// 1. LabAssignments with PENDING or ASSIGNED status
const upcomingAssignments = await prisma.labAssignment.findMany({
  where: {
    assignedDate: { gte: today },
    status: { in: ["PENDING", "ASSIGNED"] },
    deletedAt: null,
  }
});

// 2. LabBookings without LabAssignments (truly unassigned)
const unassignedBookings = await prisma.labBooking.findMany({
  where: {
    labDate: { gte: today },
    labAssignmentId: null,  // No assignment = no phlebotomist
    status: "PENDING",
    deletedAt: null,
  }
});
```

### **Ongoing Assignments Query**
```typescript
// Only assignments that have started the workflow
const ongoingAssignments = await prisma.labAssignment.findMany({
  where: {
    status: {
      in: ["PHLEBOTOMIST_LEFT", "SAMPLE_COLLECTED", "IN_LAB", "ANALYZING"],
    },
    deletedAt: null,
  }
});
```

## 🎨 Frontend Logic

### **Button Display Logic**
```typescript
// Check if phlebotomist is assigned
if (appointment.assignedPhlebotomist) {
  // Show "Start Appointment" button
  <Button onClick={handleStartAppointment}>
    <Play className="h-4 w-4 mr-2" />
    Start Appointment
  </Button>
} else {
  // Show "Assign Phlebotomist" button
  <Button onClick={handleAssignPhlebotomist}>
    Assign Phlebotomist
  </Button>
}
```

### **Status Display Logic**
```typescript
// Use status mapping for user-friendly display
const statusDisplay = getStatusDisplay(appointment.status, 'pathology');
const statusColor = getStatusColor(appointment.status);
```

## ⏰ Time-Based Movement

### **Automatic Movement Logic**
```typescript
// Check for assignments that should move from upcoming to ongoing
const assignmentsToMove = await prisma.labAssignment.findMany({
  where: {
    status: "ASSIGNED",           // Ready to start
    assignedDate: { lte: today }, // Date has passed
  }
});

// For each assignment, check if time has passed
for (const assignment of assignmentsToMove) {
  if (assignedTime <= currentTime) {
    // Move to ongoing
    await updateStatus(assignment.id, "PHLEBOTOMIST_LEFT");
  }
}
```

### **Manual Movement Logic**
```typescript
// When "Start Appointment" is clicked
const handleStartAppointment = async (appointment) => {
  await fetch(`/api/pathology/lab-assignments/${appointment.id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'PHLEBOTOMIST_LEFT' })
  });
};
```

## 🔧 API Endpoints

### **1. Upcoming Appointments** (`/api/pathology/upcoming-appointments`)
- **Purpose**: Fetch bookings that are not yet started
- **Returns**: Unassigned bookings + assigned but not started bookings
- **Status Filter**: `PENDING`, `ASSIGNED`

### **2. Ongoing Assignments** (`/api/pathology/ongoing-assignments`)
- **Purpose**: Fetch bookings that have started the workflow
- **Returns**: Started assignments only
- **Status Filter**: `PHLEBOTOMIST_LEFT`, `SAMPLE_COLLECTED`, `IN_LAB`, `ANALYZING`

### **3. Assign Phlebotomist** (`/api/pathology/assign-phlebotomist`)
- **Purpose**: Create or update phlebotomist assignment
- **Action**: Sets status to `PENDING` initially, `ASSIGNED` when updated
- **Sync**: Updates both `LabAssignment` and `LabBooking`

### **4. Start Appointment** (`/api/pathology/lab-assignments/[id]/status`)
- **Purpose**: Move assignment from upcoming to ongoing
- **Action**: Updates status to `PHLEBOTOMIST_LEFT`
- **Sync**: Updates both `LabAssignment` and `LabBooking`

### **5. Time-Based Movement** (`/api/pathology/check-time-based-movement`)
- **Purpose**: Automatically move assignments based on time
- **Trigger**: Called on dashboard load
- **Logic**: Checks `ASSIGNED` assignments and moves them if time has passed

## 🎯 Status Flow

```
Patient Books Lab Test
         ↓
   LabBooking Created
   status: "PENDING"
   labAssignmentId: null
         ↓
   [UPCOMING - Unassigned]
   UI: "Assign Phlebotomist" button
         ↓
   Phlebotomist Assigned
   LabAssignment Created
   status: "PENDING" → "ASSIGNED"
         ↓
   [UPCOMING - Assigned]
   UI: "Start Appointment" button
         ↓
   Start Appointment (Manual) OR Time Passed (Automatic)
   status: "PHLEBOTOMIST_LEFT"
         ↓
   [ONGOING]
   Continue workflow: SAMPLE_COLLECTED → IN_LAB → ANALYZING → COMPLETED
```

## 🔍 Testing Scenarios

### **Scenario 1: Unassigned Booking**
1. Create lab booking without assignment
2. Verify it appears in upcoming with "Assign Phlebotomist" button
3. Click button and assign phlebotomist
4. Verify it shows "Start Appointment" button

### **Scenario 2: Manual Start**
1. Assign phlebotomist to booking
2. Verify it stays in upcoming with "Start Appointment" button
3. Click "Start Appointment"
4. Verify it moves to ongoing section

### **Scenario 3: Time-Based Start**
1. Assign phlebotomist with future time
2. Wait for time to pass
3. Refresh dashboard
4. Verify assignment automatically moves to ongoing

### **Scenario 4: Workflow Continuation**
1. Start appointment (moves to ongoing)
2. Update status through pathology panel
3. Verify status progression: PHLEBOTOMIST_LEFT → SAMPLE_COLLECTED → IN_LAB → ANALYZING → COMPLETED

## 🐛 Common Issues & Solutions

### **Issue 1: Assignment not moving to ongoing**
- **Cause**: Status not properly updated
- **Solution**: Check API response and ensure both `LabAssignment` and `LabBooking` are updated

### **Issue 2: Time-based movement not working**
- **Cause**: Time comparison logic error
- **Solution**: Verify time format and comparison logic in `/api/pathology/check-time-based-movement`

### **Issue 3: Button not showing correctly**
- **Cause**: `assignedPhlebotomist` field not populated
- **Solution**: Check API response structure and ensure phlebotomist data is included

## 📝 Implementation Notes

1. **Status Synchronization**: All status changes sync between `LabAssignment` and `LabBooking`
2. **Time Handling**: Uses 24-hour format for time comparisons
3. **Error Handling**: Graceful fallbacks for API failures
4. **Performance**: Time-based movement check runs on dashboard load
5. **User Experience**: Clear visual indicators for different states

## 🚀 Future Enhancements

1. **Real-time Updates**: WebSocket integration for live status updates
2. **Notifications**: Alert users when assignments move automatically
3. **Batch Operations**: Allow multiple assignments to be started at once
4. **Advanced Scheduling**: More sophisticated time-based movement rules
5. **Audit Trail**: Track all status changes with timestamps and user info 