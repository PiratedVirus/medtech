import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { deviceToken, platform = 'web' } = await request.json();

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'Device token is required' },
        { status: 400 }
      );
    }

    // Get patient ID from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const phoneNumber = decoded.plusAddedPhoneNumber as string;
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Invalid token data' },
        { status: 401 }
      );
    }

    // Find patient by phone number
    const patient = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        role: 'PATIENT'
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Upsert device token
    await prisma.patientDeviceToken.upsert({
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
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register device token' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { deviceToken } = await request.json();

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'Device token is required' },
        { status: 400 }
      );
    }

    // Get patient ID from JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const phoneNumber = decoded.plusAddedPhoneNumber as string;
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Invalid token data' },
        { status: 401 }
      );
    }

    // Find patient by phone number
    const patient = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        role: 'PATIENT'
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Deactivate device token
    await prisma.patientDeviceToken.updateMany({
      where: {
        patientId: patient.id,
        deviceToken: deviceToken,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Device token removed successfully',
    });
  } catch (error) {
    console.error('Error removing device token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove device token' },
      { status: 500 }
    );
  }
}
