import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // Check if we have any device tokens
    const deviceTokens = await prisma.patientDeviceToken.findMany({
      where: { isActive: true },
      include: { patient: true },
    });

    return NextResponse.json({
      success: true,
      deviceTokensCount: deviceTokens.length,
      deviceTokens: deviceTokens.map(token => ({
        id: token.id,
        patientId: token.patientId,
        patientName: token.patient.name,
        platform: token.platform,
        isActive: token.isActive,
        createdAt: token.createdAt,
        tokenPreview: token.deviceToken.substring(0, 50) + '...',
      })),
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { deviceToken, platform = 'web' } = await request.json();

    // Get patient ID from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No authentication token found',
        debug: {
          hasToken: false,
          cookies: cookieStore.getAll().map(c => c.name),
        }
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JWT token',
        debug: {
          tokenError: err instanceof Error ? err.message : 'Unknown JWT error',
        }
      });
    }

    const phoneNumber = decoded.plusAddedPhoneNumber as string;
    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'No phone number in token',
        debug: { decoded }
      });
    }

    // Find patient by phone number
    const patient = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        role: 'PATIENT'
      },
    });

    if (!patient) {
      return NextResponse.json({
        success: false,
        error: 'Patient not found',
        debug: { phoneNumber, role: decoded.userRole }
      });
    }

    // Try to upsert device token
    const result = await prisma.patientDeviceToken.upsert({
      where: {
        patientId_deviceToken: {
          patientId: patient.id,
          deviceToken: deviceToken,
        },
      },
      update: {
        isActive: true,
        platform,
        updatedAt: new Date(),
      },
      create: {
        patientId: patient.id,
        deviceToken,
        platform,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Device token registered successfully',
      debug: {
        patientId: patient.id,
        patientName: patient.name,
        phoneNumber: patient.phoneNumber,
        deviceTokenId: result.id,
        platform: result.platform,
        tokenPreview: deviceToken.substring(0, 50) + '...',
      }
    });
  } catch (error) {
    console.error('Error in debug registration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }, { status: 500 });
  }
}
