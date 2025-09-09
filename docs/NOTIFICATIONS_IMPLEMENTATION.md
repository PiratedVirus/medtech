# Admin Notifications System Implementation

## Overview

The admin notifications system provides real-time alerts for important events and activities that require admin attention. The system is implemented in **Phase 1 & 2** of the notifications plan.

## Features Implemented

### ✅ Phase 1: API Development
- **Main Notifications API**: `/api/admin/notifications`
- **Test API**: `/api/admin/notifications/test`
- **TypeScript Types**: Complete type definitions
- **Database Integration**: Real-time data from multiple tables

### ✅ Phase 2: Frontend Components
- **Dynamic NotificationsList**: Replaces static hardcoded alerts
- **NotificationBadge**: Shows notification counts with priority colors
- **NotificationCard**: Individual notification display with actions
- **AdminHeader**: Header with notification bell and badge
- **useNotifications Hook**: React Query integration for data fetching

## Notification Categories

### 🔴 High Priority (Immediate Attention)
- **Critical Lab Results**: Abnormal lab values requiring immediate attention
- **Failed Payments**: Payment failures affecting revenue
- **System Errors**: LLM processing failures, API errors

### 🟡 Medium Priority (Action Required Soon)
- **Upcoming Appointments**: Next 2 hours
- **Lab Samples Pending Collection**: Today's collections
- **Expiring Subscriptions**: Within 7 days
- **Diet Plan Requests**: Pending dietician approval

### 🟢 Low Priority (Informational)
- **New Patient Signups**: Last 24 hours
- **Suspended Users**: User accounts requiring review

## API Endpoints

### Main Notifications API
```typescript
GET /api/admin/notifications

Response:
{
  notifications: {
    highPriority: NotificationItem[],
    mediumPriority: NotificationItem[],
    lowPriority: NotificationItem[]
  },
  summary: {
    total: number,
    highPriority: number,
    mediumPriority: number,
    lowPriority: number,
    unread: number
  }
}
```

### Test API
```typescript
GET /api/admin/notifications/test

Response:
{
  message: "Notifications API is working!",
  timestamp: string,
  testData: { ... }
}
```

## Database Queries

The system queries multiple tables in parallel for optimal performance:

### Appointments
```sql
-- Upcoming appointments (next 2 hours)
SELECT * FROM Appointment a 
JOIN DoctorAvailability da ON a.doctorAvailabilityId = da.id
WHERE da.date = CURRENT_DATE 
AND da.startTime BETWEEN NOW() AND NOW() + INTERVAL '2 hours'
AND a.status IN ('Scheduled', 'Confirmed')
```

### Lab Bookings
```sql
-- Pending lab collections today
SELECT * FROM LabBooking lb
WHERE lb.labDate = CURRENT_DATE
AND lb.status = 'PENDING'
```

### Payments
```sql
-- Failed payments (last 24 hours)
SELECT * FROM Payment p
WHERE p.paymentStatus = 'FAILED'
AND p.createdAt >= NOW() - INTERVAL '24 hours'
```

### Subscriptions
```sql
-- Expiring subscriptions (within 7 days)
SELECT * FROM SubscriptionTracker st
WHERE st.endDate BETWEEN NOW() AND NOW() + INTERVAL '7 days'
AND st.isActive = true
```

## Components Structure

```
components/admin/
├── NotificationsList.tsx      # Main notifications display
├── NotificationCard.tsx        # Individual notification card
├── NotificationBadge.tsx      # Notification count badge
└── AdminHeader.tsx            # Header with notification bell

hooks/
└── useNotifications.ts        # React Query hook

types/
└── notifications.ts           # TypeScript definitions
```

## Usage

### In Components
```typescript
import { useNotifications } from "@/hooks/useNotifications";

function MyComponent() {
  const { notifications, summary, isLoading } = useNotifications();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <NotificationBadge count={summary.total} priority="high" />
      {notifications.highPriority.map(notification => (
        <NotificationCard key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
```

### Auto-refresh
The system automatically refreshes every 5 minutes and on window focus:
```typescript
refetchInterval: 5 * 60 * 1000, // 5 minutes
refetchOnWindowFocus: true,
staleTime: 2 * 60 * 1000, // 2 minutes
```

## Priority Color Scheme

- **High Priority**: Red (`#EF4444`) - Immediate attention
- **Medium Priority**: Orange (`#F28A2E`) - Action required soon  
- **Low Priority**: Green (`#56A67C`) - Informational

## Performance Optimizations

1. **Parallel Queries**: All database queries run in parallel using `Promise.all()`
2. **Caching**: React Query provides intelligent caching and background updates
3. **Pagination**: Limited to 5 items per category to prevent UI overload
4. **Lazy Loading**: Notifications load only when needed

## Testing

### Test the API
```bash
curl http://localhost:3000/api/admin/notifications/test
```

### Test with Real Data
```bash
curl http://localhost:3000/api/admin/notifications
```

## Future Enhancements (Phase 3)

- [ ] Notification preferences (admin configurable)
- [ ] Email/SMS alerts for critical notifications
- [ ] Notification history and read/unread status
- [ ] WebSocket integration for real-time updates
- [ ] Advanced filtering and search
- [ ] Notification analytics and reporting

## Troubleshooting

### Common Issues

1. **No notifications showing**: Check if there's data in the database
2. **API errors**: Verify database connection and table structure
3. **Performance issues**: Check database indexes on frequently queried fields

### Debug Mode
Enable debug logging by adding `console.log` statements in the API:
```typescript
console.log("Fetching notifications:", { upcomingAppointments, pendingLabCollections });
```

## Database Indexes

For optimal performance, ensure these indexes exist:
```sql
-- Appointments
CREATE INDEX idx_appointment_date_status ON Appointment(appointmentDate, status);
CREATE INDEX idx_doctor_availability_date ON DoctorAvailability(date);

-- Lab Bookings
CREATE INDEX idx_lab_booking_date_status ON LabBooking(labDate, status);

-- Payments
CREATE INDEX idx_payment_status_created ON Payment(paymentStatus, createdAt);

-- Users
CREATE INDEX idx_user_role_created ON User(role, createdAt);
CREATE INDEX idx_user_status_updated ON User(status, updatedAt);
```
