import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminClinicId, createUserClinicFilter } from '@/lib/admin-clinic-middleware';

export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);

    // First verify the lab booking belongs to the admin's clinic
    const labBooking = await prisma.labBooking.findFirst({
      where: {
        id: labBookingIdNum,
        patient: userClinicFilter.user,
        deletedAt: null
      }
    });

    if (!labBooking) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lab booking not found or access denied' 
      }, { status: 404 });
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
