import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * Simple test endpoint to verify debug routes are accessible
 * Access: /api/debug/test
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Debug route is accessible!',
    hostname: request.headers.get('host'),
    url: request.url,
    timestamp: new Date().toISOString()
  });
}
