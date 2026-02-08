import admin from 'firebase-admin';
import webpush from 'web-push';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Configure web-push for Web Push API
if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error('VAPID keys are missing! Push notifications will not work.');
}

webpush.setVapidDetails(
  'mailto:support@carediabetics.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export const sendNotification = async (
  deviceTokens: string[],
  notification: {
    title: string;
    body: string;
    data?: any;
    imageUrl?: string;
  }
) => {
  if (deviceTokens.length === 0) {
    console.log('No device tokens provided for notification');
    return { success: false, error: 'No device tokens' };
  }

  console.log(`[PUSH] Preparing to send to ${deviceTokens.length} devices. Title: ${notification.title}`);

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: notification.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ],
    requireInteraction: notification.data?.priority === 'high',
    tag: notification.data?.type || 'default',
    renotify: true,
  });

  let successCount = 0;
  let failureCount = 0;
  const responses: any[] = [];

  try {
    // Send to each device token using Web Push API
    for (const token of deviceTokens) {
      try {
        // Parse the subscription object from the token
        let subscription;
        try {
          subscription = JSON.parse(token);
        } catch (e) {
          console.error(`[PUSH] Invalid token format (not JSON): ${token.substring(0, 20)}...`);
          failureCount++;
          responses.push({ success: false, error: 'Invalid token format' });
          continue;
        }
        
        await webpush.sendNotification(subscription, payload);
        successCount++;
        responses.push({ success: true });
        console.log(`[PUSH] Notification sent successfully to endpoint ending in ...${subscription.endpoint.slice(-20)}`);
      } catch (error: any) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const statusCode = error.statusCode;
        
        responses.push({ 
          success: false, 
          error: errorMessage,
          statusCode
        });
        
        if (statusCode === 410) {
          console.log(`[PUSH] Token expired/gone (410). Endpoint: ...${JSON.parse(token).endpoint?.slice(-20)}`);
          // TODO: Remove this token from DB
        } else {
          console.log(`[PUSH] Failed to send to token:`, error);
        }
      }
    }
    
    console.log(`[PUSH] Summary: Sent to ${successCount} devices, failed: ${failureCount}`);
    
    return {
      success: true,
      successCount,
      failureCount,
      responses
    };
  } catch (error) {
    console.error('[PUSH] Fatal error sending notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendNotificationToTopic = async (
  topic: string,
  notification: {
    title: string;
    body: string;
    data?: any;
    imageUrl?: string;
  }
) => {
  // Convert data to string values (Firebase requirement)
  const dataPayload: { [key: string]: string } = {};
  if (notification.data) {
    Object.keys(notification.data).forEach(key => {
      dataPayload[key] = typeof notification.data[key] === 'string' 
        ? notification.data[key] 
        : JSON.stringify(notification.data[key]);
    });
  }

  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
    },
    data: dataPayload,
    topic: topic,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`Notification sent to topic ${topic}:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification to topic:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export default admin;

