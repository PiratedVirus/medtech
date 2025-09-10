import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const deviceTokens = await prisma.patientDeviceToken.findMany({
      where: { isActive: true },
      include: { patient: true },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      count: deviceTokens.length,
      tokens: deviceTokens.map(token => ({
        id: token.id,
        patientId: token.patientId,
        patientName: token.patient.name,
        platform: token.platform,
        isActive: token.isActive,
        createdAt: token.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching device tokens:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
