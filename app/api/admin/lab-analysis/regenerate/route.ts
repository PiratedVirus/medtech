import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { labBookingId, labResultIndex = 0 } = body;

    if (!labBookingId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing labBookingId in request body' 
      }, { status: 400 });
    }

    const labBookingIdNum = parseInt(labBookingId);
    const labResultIndexNum = parseInt(labResultIndex);

    if (isNaN(labBookingIdNum)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid labBookingId' 
      }, { status: 400 });
    }

    // Find the lab booking
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: labBookingIdNum },
      include: { labPackage: true, patient: true }
    });

    if (!labBooking) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lab booking not found' 
      }, { status: 404 });
    }

    // Check if the requested lab result index exists
    if (!labBooking.labResult || labResultIndexNum >= labBooking.labResult.length) {
      return NextResponse.json({ 
        success: false, 
        error: `Lab result index ${labResultIndexNum} not found. Available indices: 0-${(labBooking.labResult?.length || 0) - 1}` 
      }, { status: 400 });
    }

    const pdfUrl = labBooking.labResult[labResultIndexNum];

    // Delete existing analysis if it exists
    const existingAnalysis = await prisma.labReportAnalysis.findFirst({
      where: {
        labBookingId: labBookingIdNum,
        labResultIndex: labResultIndexNum,
        deletedAt: null
      }
    });

    if (existingAnalysis) {
      await prisma.labReportAnalysis.update({
        where: { id: existingAnalysis.id },
        data: { deletedAt: new Date() }
      });
    }

    // Create a new analysis record
    const newAnalysis = await prisma.labReportAnalysis.create({
      data: {
        labBookingId: labBookingIdNum,
        labResultIndex: labResultIndexNum,
        reportUrl: pdfUrl,
        processingStatus: 'PENDING',
        llmModel: 'admin-regenerated'
      }
    });

    // Trigger the LLM processing (this would typically be done via a queue)
    // For now, we'll return success and the admin can manually trigger processing
    return NextResponse.json({
      success: true,
      message: `Analysis regeneration initiated for lab booking ${labBookingId}, result index ${labResultIndexNum}`,
      newAnalysis: {
        id: newAnalysis.id,
        labBookingId: newAnalysis.labBookingId,
        labResultIndex: newAnalysis.labResultIndex,
        status: newAnalysis.processingStatus
      },
      nextSteps: 'Use the LLM processing endpoint to complete the analysis'
    });

  } catch (error) {
    console.error('Error regenerating lab analysis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
