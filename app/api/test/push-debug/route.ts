import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/firebase-admin';

export async function POST() {
  try {
    // 1. Check if we have device tokens
    const deviceTokens = await prisma.patientDeviceToken.findMany({
      where: { isActive: true },
      take: 5,
    });

    if (deviceTokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No device tokens found',
        message: 'Users need to enable push notifications first',
        steps: [
          '1. Go to /dashboard',
          '2. Click the notification bell',
          '3. Click "Enable" when prompted',
          '4. Grant permission in browser'
        ]
      });
    }

    // 2. Test sending a notification
    const testTokens = deviceTokens.map(token => token.deviceToken);
    const result = await sendNotification(testTokens, {
      title: 'Test Notification',
      body: 'This is a test push notification from CareDB',
      data: { test: true, timestamp: new Date().toISOString() }
    });

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      deviceTokensCount: deviceTokens.length,
      result: result,
      debug: {
        tokens: testTokens.slice(0, 2), // Show first 2 tokens for debugging
        firebaseConfigured: true,
      }
    });

  } catch (error) {
    console.error('Push debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check Firebase configuration and device tokens'
    }, { status: 500 });
  }
}
