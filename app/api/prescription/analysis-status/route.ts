import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const take = Math.min(Number(searchParams.get('take') || 50), 200);
    const skip = Math.max(Number(searchParams.get('skip') || 0), 0);

    const whereUser = q
      ? { name: { contains: q, mode: 'insensitive' as const } }
      : {};

    // Only include patients who have prescriptions
    const patients = await prisma.user.findMany({
      where: {
        ...whereUser,
        patientPrescriptions: { some: {} },
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        aiSummaries: { select: { summaryText: true, urgency: true, lastUpdated: true, prescriptionCount: true, llmModel: true } },
        prescriptionTexts: { select: { id: true, processingStatus: true, processingError: true }, orderBy: { createdAt: 'asc' } },
        // Only count prescriptions that have a linked PDF via the appointment
        patientPrescriptions: { select: { id: true, appointment: { select: { prescriptionLink: true } } }, orderBy: { createdAt: 'asc' } },
      },
      take,
      skip,
      orderBy: { id: 'asc' },
    });

    const rows = patients.map(p => {
      const totalPrescriptions = p.patientPrescriptions.filter(x => !!x.appointment?.prescriptionLink).length;
      const processed = p.prescriptionTexts.filter(t => t.processingStatus === 'COMPLETED').length;
      const failed = p.prescriptionTexts.filter(t => t.processingStatus === 'FAILED').length;
      const pending = totalPrescriptions - processed - failed;
      const summary = p.aiSummaries || null;
      return {
        id: p.id,
        name: p.name,
        phone: p.phoneNumber,
        totalPrescriptions,
        processed,
        failed,
        pending: Math.max(pending, 0),
        urgency: summary?.urgency || null,
        lastUpdated: summary?.lastUpdated || null,
        prescriptionCountInSummary: summary?.prescriptionCount || 0,
        llmModel: summary?.llmModel || null,
        hasSummary: !!summary?.summaryText,
      };
    });

    return NextResponse.json({ success: true, rows });
  } catch (error: any) {
    console.error('[PRESCRIPTION][ANALYSIS-STATUS] Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


