const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 VAPID Keys Generated:');
console.log('');
console.log('Add these to your .env file:');
console.log('');
console.log('# Firebase Configuration');
console.log('FIREBASE_PROJECT_ID=your-project-id');
console.log('FIREBASE_PRIVATE_KEY_ID=your-private-key-id');
console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n"');
console.log('FIREBASE_CLIENT_EMAIL=your-client-email');
console.log('FIREBASE_CLIENT_ID=your-client-id');
console.log('');
console.log('# VAPID Keys for Push Notifications');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('');
console.log('📝 Instructions:');
console.log('1. Copy the VAPID keys to your .env file');
console.log('2. Get your Firebase service account credentials from Firebase Console');
console.log('3. Add the Firebase configuration to your .env file');
console.log('4. Restart your development server');
