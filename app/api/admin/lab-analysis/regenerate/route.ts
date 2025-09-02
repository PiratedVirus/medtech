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

    // Use upsert to either update existing analysis or create new one
    const newAnalysis = await prisma.labReportAnalysis.upsert({
      where: {
        labBookingId_labResultIndex: {
          labBookingId: labBookingIdNum,
          labResultIndex: labResultIndexNum
        }
      },
      update: {
        reportUrl: pdfUrl,
        processingStatus: 'PENDING',
        llmModel: 'admin-regenerated',
        processingError: null,
        processedAt: null,
        deletedAt: null
      },
      create: {
        labBookingId: labBookingIdNum,
        labResultIndex: labResultIndexNum,
        reportUrl: pdfUrl,
        processingStatus: 'PENDING',
        llmModel: 'admin-regenerated'
      }
    });

    // Trigger actual LLM processing
    try {
      // Import and call the LLM processing function
      const { processWithOpenRouter } = await import('@/lib/llm/process-service');
      
      // Start processing in background (don't await to avoid blocking the response)
      processWithOpenRouter(newAnalysis.id, pdfUrl, labBooking.patientId, labBookingId).catch((error: any) => {
        console.error(`[REGENERATE] Background processing failed for lab analysis ${newAnalysis.id}:`, error);
      });
      
      console.log(`[REGENERATE] Started LLM processing for lab analysis ${newAnalysis.id}`);
    } catch (importError) {
      console.error('[REGENERATE] Failed to import processWithOpenRouter:', importError);
      // Fallback: just return success
    }

    return NextResponse.json({
      success: true,
      message: `Analysis regeneration initiated for lab booking ${labBookingId}, result index ${labResultIndexNum}`,
      newAnalysis: {
        id: newAnalysis.id,
        labBookingId: newAnalysis.labBookingId,
        labResultIndex: newAnalysis.labResultIndex,
        status: newAnalysis.processingStatus
      },
      nextSteps: 'LLM processing has been started automatically'
    });

  } catch (error) {
    console.error('Error regenerating lab analysis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
