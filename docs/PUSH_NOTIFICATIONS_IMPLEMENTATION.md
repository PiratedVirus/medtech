# 📱 Push Notifications System Implementation

## **Overview**
A comprehensive Firebase-based push notification system for CareDB patients, providing real-time updates for appointments, health insights, and critical alerts.

## **🏗️ Architecture**

### **Database Schema**
```sql
-- Patient Notifications
model PatientNotification {
  id          Int               @id @default(autoincrement())
  patientId   Int
  type        NotificationType
  title       String
  message     String
  data        Json?             // Additional payload data
  isRead      Boolean           @default(false)
  sentAt      DateTime          @default(now())
  readAt      DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  deletedAt   DateTime?
  
  patient     User              @relation(fields: [patientId], references: [id])
}

-- Device Tokens for Push Notifications
model PatientDeviceToken {
  id          Int       @id @default(autoincrement())
  patientId   Int
  deviceToken String
  platform    String    // 'ios', 'android', 'web'
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  patient     User      @relation(fields: [patientId], references: [id])
}
```

### **Notification Types**
- `APPOINTMENT_REMINDER` - Same day appointment reminders
- `APPOINTMENT_CONFIRMED` - Appointment confirmation
- `APPOINTMENT_CANCELLED` - Appointment cancellation
- `DIET_PLAN_READY` - New diet plan available
- `DIET_PLAN_REQUEST_STATUS` - Diet plan request updates
- `LAB_RESULTS_READY` - Lab test results ready
- `LAB_SAMPLE_COLLECTION` - Sample collection updates
- `PRESCRIPTION_READY` - New prescription available
- `MEDICINE_REMINDER` - Medication reminders
- `PLAN_EXPIRY_WARNING` - Subscription expiry warnings
- `PLAN_RENEWED` - Subscription renewal confirmation
- `HEALTH_ALERT` - Critical health metric alerts
- `AI_SUMMARY_READY` - AI health summary updates
- `CONSULTATION_REMINDER` - Consultation booking reminders
- `LAB_BOOKING_CONFIRMED` - Lab test booking confirmation
- `PAYMENT_SUCCESS` - Payment confirmation
- `PAYMENT_FAILED` - Payment failure alerts

## **🔧 Implementation Details**

### **1. Firebase Setup**
```typescript
// lib/firebase-admin.ts
import admin from 'firebase-admin';

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Send notification function
export const sendNotification = async (deviceTokens: string[], notification: {
  title: string;
  body: string;
  data?: any;
}) => {
  const message = {
    notification: { title: notification.title, body: notification.body },
    data: notification.data || {},
    tokens: deviceTokens,
  };
  
  return await admin.messaging().sendMulticast(message);
};
```

### **2. Notification Service**
```typescript
// lib/notification-service.ts
export class NotificationService {
  // Send appointment reminder
  static async sendAppointmentReminder(appointmentId: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true, doctorAvailability: true },
    });
    
    await this.sendAndSave(
      appointment.patientId,
      'APPOINTMENT_REMINDER',
      'Appointment Reminder',
      `Your appointment with Dr. ${appointment.doctor.name} is today at ${appointment.doctorAvailability.startTime}`,
      { appointmentId, action: 'VIEW_APPOINTMENT' }
    );
  }
  
  // ... other notification methods
}
```

### **3. API Endpoints**

#### **Register Device Token**
```typescript
POST /api/notifications/register-token
{
  "deviceToken": "fcm_token_here",
  "platform": "web"
}
```

#### **Get Notifications**
```typescript
GET /api/notifications?page=1&limit=20&unreadOnly=false
```

#### **Mark as Read**
```typescript
PUT /api/notifications
{
  "notificationIds": [1, 2, 3],
  "markAsRead": true
}
```

#### **Delete Notifications**
```typescript
DELETE /api/notifications
{
  "notificationIds": [1, 2, 3]
}
```

### **4. Frontend Integration**

#### **React Hooks**
```typescript
// hooks/use-notifications.ts
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission;
  };
  
  const registerForPush = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    
    await fetch('/api/notifications/register-token', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: JSON.stringify(subscription),
        platform: 'web',
      }),
    });
  };
  
  return { isSupported, permission, requestPermission, registerForPush };
};
```

#### **Notification Components**
- `NotificationBell` - Bell icon with unread count
- `NotificationCenter` - Full notification management UI
- `NotificationCard` - Individual notification display

### **5. Scheduled Notifications (Cron Jobs)**

#### **Cron Endpoint**
```typescript
GET /api/cron/send-notifications
```

**Triggers:**
- Same-day appointment reminders (8 AM)
- 30-minute appointment reminders
- Subscription consultation reminders (3 days before)
- Plan expiry warnings (7 days before)
- Lab results ready notifications
- Diet plan status updates

## **🚀 Setup Instructions**

### **1. Environment Variables**
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id

# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### **2. Generate VAPID Keys**
```bash
node scripts/generate-vapid-keys.js
```

### **3. Firebase Console Setup**
1. Create Firebase project
2. Enable Cloud Messaging
3. Generate service account key
4. Add web app configuration

### **4. Database Migration**
```bash
npx prisma db push
```

### **5. Test Notifications**
```bash
# Test appointment reminder
curl -X POST http://localhost:3000/api/test/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "appointment_reminder",
    "patientId": 1,
    "data": { "appointmentId": 1 }
  }'
```

## **📱 Frontend Usage**

### **1. Add Notification Bell to Layout**
```tsx
import NotificationBell from '@/components/notifications/NotificationBell';

// In your header component
<NotificationBell />
```

### **2. Register for Push Notifications**
```tsx
import { usePushNotifications } from '@/hooks/use-notifications';

const { requestPermission, registerForPush } = usePushNotifications();

const handleEnableNotifications = async () => {
  await requestPermission();
  await registerForPush();
};
```

### **3. Listen for Notifications**
```tsx
import { useNotifications } from '@/hooks/use-notifications';

const { data: notifications } = useNotifications(1, 20, false);
```

## **🔄 Notification Flow**

### **1. User Registration**
1. User visits dashboard
2. Permission banner appears
3. User grants permission
4. Device token registered
5. Notifications enabled

### **2. Notification Sending**
1. Event occurs (appointment, lab result, etc.)
2. NotificationService.sendAndSave() called
3. Device tokens fetched from database
4. Firebase push notification sent
5. Notification saved to database

### **3. User Interaction**
1. User receives push notification
2. Clicks notification
3. App opens to relevant page
4. Notification marked as read

## **📊 Monitoring & Analytics**

### **Notification Metrics**
- Delivery rate
- Open rate
- Click-through rate
- Unsubscribe rate

### **Error Handling**
- Invalid device tokens
- Firebase API errors
- Network failures
- Permission denied

## **🔒 Security Considerations**

### **Data Protection**
- Device tokens encrypted in transit
- Personal data in notifications minimized
- GDPR compliance for EU users

### **Rate Limiting**
- Max 100 notifications per user per day
- Exponential backoff for failed sends
- Spam prevention measures

## **🚀 Future Enhancements**

### **Phase 2 Features**
- Rich notifications with images
- Notification scheduling
- User preferences
- A/B testing
- Analytics dashboard

### **Phase 3 Features**
- Email/SMS fallbacks
- Notification templates
- Multi-language support
- Advanced targeting
- Machine learning optimization

## **🐛 Troubleshooting**

### **Common Issues**
1. **Notifications not received**
   - Check Firebase configuration
   - Verify device token registration
   - Check browser permissions

2. **Service worker not working**
   - Ensure sw.js is in public folder
   - Check VAPID key configuration
   - Verify HTTPS in production

3. **Database errors**
   - Check Prisma schema
   - Verify database connection
   - Check foreign key constraints

### **Debug Commands**
```bash
# Check notification status
curl http://localhost:3000/api/notifications

# Test specific notification
curl -X POST http://localhost:3000/api/test/notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "health_alert", "patientId": 1, "data": {"metricName": "Blood Sugar", "value": "180", "status": "high"}}'

# Run scheduled notifications
curl http://localhost:3000/api/cron/send-notifications
```

## **📈 Performance Optimization**

### **Database Indexes**
```sql
CREATE INDEX idx_notification_patient_read ON PatientNotification(patientId, isRead);
CREATE INDEX idx_notification_type_sent ON PatientNotification(type, sentAt);
CREATE INDEX idx_device_token_patient ON PatientDeviceToken(patientId, isActive);
```

### **Caching Strategy**
- Device tokens cached for 1 hour
- Notification counts cached for 5 minutes
- Firebase connection pooled

### **Batch Operations**
- Bulk notification sending
- Batch database updates
- Parallel processing for large volumes

---

**🎉 The push notification system is now fully implemented and ready for production use!**
