import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labBookingId = searchParams.get('labBookingId');

    if (!labBookingId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing labBookingId parameter' 
      }, { status: 400 });
    }

    const labBookingIdNum = parseInt(labBookingId);

    if (isNaN(labBookingIdNum)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid labBookingId' 
      }, { status: 400 });
    }

    // Find all analyses for this lab booking with full data
    const analyses = await prisma.labReportAnalysis.findMany({
      where: {
        labBookingId: labBookingIdNum,
        deletedAt: null
      },
      select: {
        id: true,
        labResultIndex: true,
        processingStatus: true,
        llmSummary: true,
        processedAt: true,
        createdAt: true,
        llmModel: true,
        allValues: true,
        criticalValues: true,
        trendAnalysis: true
      },
      orderBy: {
        labResultIndex: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      analyses: analyses
    });

  } catch (error) {
    console.error('Error fetching lab analyses:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
