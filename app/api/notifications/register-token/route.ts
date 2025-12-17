import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getSubdomainClinicFromRequest } from '@/lib/clinic-auth';

export async function POST(request: NextRequest) {
  try {
    const { deviceToken, platform = 'web' } = await request.json();

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'Device token is required' },
        { status: 400 }
      );
    }

    // Get subdomain clinic ID for multi-tenancy validation
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);

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

    // Find user by phone number
    // If subdomain clinic ID is available, use it for more specific lookup
    const user = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        ...(subdomainClinicId ? { clinicId: subdomainClinicId } : {}),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate clinic access - patient's clinic must match subdomain clinic
    if (subdomainClinicId && user.clinicId !== subdomainClinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You are not registered with this clinic. Please use the correct clinic URL.',
          errorCode: 'CLINIC_MISMATCH'
        },
        { status: 403 }
      );
    }

    // If user is not a patient, return success without storing token
    // (Device tokens are currently only supported for patients)
    if (user.role !== 'PATIENT') {
      return NextResponse.json({
        success: true,
        message: 'Device token registration not available for this user type',
      });
    }

    // Upsert device token
    await prisma.patientDeviceToken.upsert({
      where: {
        patientId_deviceToken: {
          patientId: user.id,
          deviceToken: deviceToken,
        },
      },
      update: {
        isActive: true,
        platform,
        updatedAt: new Date(),
      },
      create: {
        patientId: user.id,
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

    // Get subdomain clinic ID for multi-tenancy validation
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);

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

    // Find user by phone number
    // If subdomain clinic ID is available, use it for more specific lookup
    const user = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        ...(subdomainClinicId ? { clinicId: subdomainClinicId } : {}),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate clinic access - patient's clinic must match subdomain clinic
    if (subdomainClinicId && user.clinicId !== subdomainClinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You are not registered with this clinic. Please use the correct clinic URL.',
          errorCode: 'CLINIC_MISMATCH'
        },
        { status: 403 }
      );
    }

    // If user is not a patient, return success without doing anything
    if (user.role !== 'PATIENT') {
      return NextResponse.json({
        success: true,
        message: 'No device token to remove',
      });
    }

    // Deactivate device token
    await prisma.patientDeviceToken.updateMany({
      where: {
        patientId: user.id,
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
