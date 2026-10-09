import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getSubdomainClinicFromRequest } from '@/lib/clinic-auth';
import { tokenUserWhere } from "@/lib/clinic-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

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

    // Find user from token (userId; phone + clinic for old tokens)
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
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

    // If user is not a patient, return empty notifications
    // (Notifications are currently only supported for patients)
    if (user.role !== 'PATIENT') {
      return NextResponse.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          unreadCount: 0,
        },
      });
    }

    // Build where clause for patient notifications
    const whereClause: any = {
      patientId: user.id,
      deletedAt: null,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    // Get notifications with pagination
    const [notifications, total] = await prisma.$transaction([
      prisma.patientNotification.findMany({
        where: whereClause,
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.patientNotification.count({
        where: whereClause,
      }),
    ]);

    // Get unread count
    const unreadCount = await prisma.patientNotification.count({
      where: {
        patientId: user.id,
        isRead: false,
        deletedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { notificationIds, markAsRead = true } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'Notification IDs are required' },
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

    // Find user from token (userId; phone + clinic for old tokens)
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
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
        message: 'No notifications to update',
      });
    }

    // Update notifications
    const updateData: any = {};
    if (markAsRead) {
      updateData.isRead = true;
      updateData.readAt = new Date();
    } else {
      updateData.isRead = false;
      updateData.readAt = null;
    }

    await prisma.patientNotification.updateMany({
      where: {
        id: { in: notificationIds },
        patientId: user.id,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Notifications ${markAsRead ? 'marked as read' : 'marked as unread'} successfully`,
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'Notification IDs are required' },
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

    // Find user from token (userId; phone + clinic for old tokens)
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
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
        message: 'No notifications to delete',
      });
    }

    // Soft delete notifications
    await prisma.patientNotification.updateMany({
      where: {
        id: { in: notificationIds },
        patientId: user.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
