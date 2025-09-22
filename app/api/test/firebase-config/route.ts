import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test Firebase initialization
    const app = admin.app();
    const projectId = app.options.projectId;
    
    return NextResponse.json({
      success: true,
      message: 'Firebase is properly configured',
      projectId: projectId,
      hasApp: !!app,
    });
  } catch (error) {
    console.error('Firebase configuration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check your Firebase environment variables'
    }, { status: 500 });
  }
}
