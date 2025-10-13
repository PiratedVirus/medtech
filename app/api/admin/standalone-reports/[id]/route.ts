import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);
    
    if (isNaN(reportId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid report ID' 
      }, { status: 400 });
    }

    // Soft delete the report and its analyses
    await prisma.$transaction([
      // Soft delete analyses first
      prisma.standaloneReportAnalysis.updateMany({
        where: { reportId },
        data: { deletedAt: new Date() }
      }),
      // Soft delete the report
      prisma.standaloneReport.update({
        where: { id: reportId },
        data: { deletedAt: new Date() }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Report deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error deleting standalone report:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Internal server error' 
    }, { status: 500 });
  }
}
