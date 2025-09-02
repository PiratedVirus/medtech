import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  const recent = await prisma.appointmentReport.findMany({
    orderBy: { uploadedAt: 'desc' },
    take: 50,
    select: { id: true, fileUrl: true, fileName: true, uploadedAt: true, appointmentId: true }
  });
  return NextResponse.json({ success: true, data: recent });
}


