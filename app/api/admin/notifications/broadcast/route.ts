import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/firebase-admin';

type Role = 'PATIENT' | 'DOCTOR' | 'DIETICIAN' | 'ADMIN';

export async function POST(req: NextRequest) {
  try {
    const { roles, userIds, title, body } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, error: 'Title and body are required' }, { status: 400 });
    }

    const rolesFilter: Role[] = Array.isArray(roles) && roles.length ? roles : [];
    const userIdsFilter: number[] = Array.isArray(userIds) ? userIds : [];

    // Determine target users
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(rolesFilter.length ? { role: { in: rolesFilter } } : {}),
        ...(userIdsFilter.length ? { id: { in: userIdsFilter } } : {}),
      },
      select: { id: true, name: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ success: true, message: 'No users matched filters', count: 0 });
    }

    // Fetch tokens
    const tokens = await prisma.patientDeviceToken.findMany({
      where: {
        isActive: true,
        patientId: { in: users.map(u => u.id) },
      },
      select: { deviceToken: true, patientId: true },
    });

    const deviceTokens = tokens.map(t => t.deviceToken);

    // Record notifications and send
    const created = await prisma.$transaction(async (tx) => {
      // create PatientNotification entries for patients only
      const patientIds = users.map(u => u.id);
      if (patientIds.length) {
        await tx.patientNotification.createMany({
          data: patientIds.map(pid => ({
            patientId: pid,
            type: 'HEALTH_ALERT',
            title,
            message: body,
            data: {},
          })),
        });
      }
      return patientIds.length;
    });

    let pushResult: any = null;
    if (deviceTokens.length) {
      pushResult = await sendNotification(deviceTokens, {
        title,
        body,
        data: { type: 'ADMIN_BROADCAST' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Broadcast queued',
      matchedUsers: users.length,
      tokens: deviceTokens.length,
      created,
      pushResult,
    });
  } catch (error) {
    console.error('Broadcast failed:', error);
    return NextResponse.json({ success: false, error: 'Broadcast failed' }, { status: 500 });
  }
}


