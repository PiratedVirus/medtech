import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patient ID" },
        { status: 400 }
      );
    }

    const patientIdNum = parseInt(patientId);
    if (isNaN(patientIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    // Get all prescription texts for this patient
    const prescriptionTexts = await prisma.prescriptionText.findMany({
      where: {
        patientId: patientIdNum,
        processingStatus: 'COMPLETED'
      },
      select: {
        id: true,
        extractedText: true,
        textLength: true,
        processingStatus: true,
        processedAt: true,
        prescription: {
          select: {
            id: true,
            appointment: {
              select: {
                appointmentDate: true
              }
            }
          }
        }
      },
      orderBy: { processedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      texts: prescriptionTexts
    });

  } catch (error) {
    console.error('[PRESCRIPTION-TEXTS] Error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch prescription texts: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
