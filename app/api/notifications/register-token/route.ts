import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getSubdomainClinicFromRequest } from '@/lib/clinic-auth';

export async function POST(request: NextRequest) {
  try {
    const { deviceToken, platform = 'web', userType } = await request.json();

    if (!deviceToken) {
      return NextResponse.json(
        { success: false, error: 'Device token is required' },
        { status: 400 }
      );
    }

    // Get subdomain clinic ID for multi-tenancy validation
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);

    // Get user from JWT token (patient or admin)
    // When userType is 'admin', prefer admin_token to avoid registering under the patient user
    const cookieStore = await cookies();
    const patientToken = cookieStore.get('token')?.value;
    const adminToken = cookieStore.get('admin_token')?.value;
    const token = userType === 'admin' ? (adminToken || patientToken) : (patientToken || adminToken);

    console.log(`[REGISTER-TOKEN] Request received. userType=${userType || 'patient'}, hasAdminToken=${!!adminToken}, hasPatientToken=${!!patientToken}, subdomainClinicId=${subdomainClinicId}`);

    if (!token) {
      console.log('[REGISTER-TOKEN] No valid token found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
      console.log(`[REGISTER-TOKEN] Decoded token: userId=${decoded.userId}, role=${decoded.role}, clinicId=${decoded.clinicId}`);
    } catch (err) {
      console.error('[REGISTER-TOKEN] JWT verify failed:', err);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    let user = null;
    if (decoded?.userId) {
      user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          ...(subdomainClinicId ? { clinicId: subdomainClinicId } : {}),
        },
      });
    } else if (decoded?.plusAddedPhoneNumber) {
      const phoneNumber = decoded.plusAddedPhoneNumber as string;
      user = await prisma.user.findFirst({
        where: { 
          phoneNumber,
          ...(subdomainClinicId ? { clinicId: subdomainClinicId } : {}),
        },
      });
    }

    if (!user) {
      console.log(`[REGISTER-TOKEN] User not found for userId=${decoded?.userId}`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`[REGISTER-TOKEN] Found user: id=${user.id}, role=${user.role}, clinicId=${user.clinicId}`);

    // Validate clinic access - user's clinic must match subdomain clinic
    if (subdomainClinicId && user.clinicId !== subdomainClinicId) {
      console.log(`[REGISTER-TOKEN] Clinic mismatch: user.clinicId=${user.clinicId}, subdomainClinicId=${subdomainClinicId}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'You are not registered with this clinic. Please use the correct clinic URL.',
          errorCode: 'CLINIC_MISMATCH'
        },
        { status: 403 }
      );
    }

    // Upsert device token
    const upserted = await prisma.patientDeviceToken.upsert({
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

    console.log(`[REGISTER-TOKEN] Successfully registered token for user ${user.id} (${user.role}). ID: ${upserted.id}`);

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

    // Get user from JWT token (patient or admin)
    const cookieStore = await cookies();
    const patientToken = cookieStore.get('token')?.value;
    const adminToken = cookieStore.get('admin_token')?.value;
    const token = patientToken || adminToken;
    
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

    let user = null;
    if (decoded?.userId) {
      user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          ...(subdomainClinicId ? { clinicId: subdomainClinicId } : {}),
        },
      });
    } else if (decoded?.plusAddedPhoneNumber) {
      const phoneNumber = decoded.plusAddedPhoneNumber as string;
      user = await prisma.user.findFirst({
        where: { 
          phoneNumber,
          ...(subdomainClinicId ? { clinicId: subdomainClinicId } : {}),
        },
      });
    }

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
