import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labBookingId = searchParams.get('labBookingId');
    const labResultIndex = searchParams.get('labResultIndex');

    if (!labBookingId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing labBookingId parameter' 
      }, { status: 400 });
    }

    const labBookingIdNum = parseInt(labBookingId);
    const labResultIndexNum = labResultIndex ? parseInt(labResultIndex) : 0;

    if (isNaN(labBookingIdNum)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid labBookingId' 
      }, { status: 400 });
    }

    // Find the analysis to delete
    const analysis = await prisma.labReportAnalysis.findFirst({
      where: {
        labBookingId: labBookingIdNum,
        labResultIndex: labResultIndexNum,
        deletedAt: null
      }
    });

    if (!analysis) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis not found' 
      }, { status: 404 });
    }

    // Soft delete the analysis
    await prisma.labReportAnalysis.update({
      where: { id: analysis.id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: `Analysis deleted successfully for lab booking ${labBookingId}, result index ${labResultIndexNum}`,
      deletedAnalysis: {
        id: analysis.id,
        labBookingId: analysis.labBookingId,
        labResultIndex: analysis.labResultIndex
      }
    });

  } catch (error) {
    console.error('Error deleting lab analysis:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
