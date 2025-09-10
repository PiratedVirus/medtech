#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Push Notification Setup...\n');

// Check if all required files exist
const requiredFiles = [
  'lib/firebase-admin.ts',
  'lib/notification-service.ts',
  'app/api/notifications/route.ts',
  'app/api/notifications/register-token/route.ts',
  'app/api/test/notifications/route.ts',
  'app/api/cron/send-notifications/route.ts',
  'components/notifications/NotificationBell.tsx',
  'components/notifications/NotificationCenter.tsx',
  'components/admin/NotificationTestPanel.tsx',
  'hooks/use-notifications.ts',
  'public/sw.js',
  'docs/PUSH_NOTIFICATIONS_IMPLEMENTATION.md'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check environment variables
console.log('\n🔧 Checking environment variables...');
const envFile = '.env';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`❌ ${envVar} - MISSING`);
      allFilesExist = false;
    }
  });
} else {
  console.log('❌ .env file not found');
  allFilesExist = false;
}

// Check database schema
console.log('\n🗄️ Checking database schema...');
const schemaFile = 'prisma/schema.prisma';
if (fs.existsSync(schemaFile)) {
  const schemaContent = fs.readFileSync(schemaFile, 'utf8');
  const requiredModels = [
    'model PatientNotification',
    'model PatientDeviceToken',
    'enum NotificationType'
  ];

  requiredModels.forEach(model => {
    if (schemaContent.includes(model)) {
      console.log(`✅ ${model}`);
    } else {
      console.log(`❌ ${model} - MISSING`);
      allFilesExist = false;
    }
  });
} else {
  console.log('❌ prisma/schema.prisma not found');
  allFilesExist = false;
}

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['firebase-admin', 'web-push'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
});

// Summary
console.log('\n📊 Setup Summary:');
if (allFilesExist) {
  console.log('✅ All components are in place!');
  console.log('\n🚀 Next steps:');
  console.log('1. Add Firebase configuration to .env file');
  console.log('2. Run: npx prisma db push');
  console.log('3. Start your development server');
  console.log('4. Visit /admin to test notifications');
  console.log('5. Test with: curl -X POST http://localhost:3000/api/test/notifications \\');
  console.log('   -H "Content-Type: application/json" \\');
  console.log('   -d \'{"type": "appointment_reminder", "patientId": 1, "data": {"appointmentId": 1}}\'');
} else {
  console.log('❌ Some components are missing. Please check the errors above.');
}

console.log('\n🎯 Test the notification system:');
console.log('1. Go to /admin dashboard');
console.log('2. Scroll down to "Push Notification Testing" section');
console.log('3. Select a patient and notification type');
console.log('4. Click "Send Test Notification"');
console.log('5. Check the result in the panel below');
