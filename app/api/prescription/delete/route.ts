import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prescriptionId = searchParams.get('prescriptionId');
    
    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: "Missing prescription ID" },
        { status: 400 }
      );
    }

    const prescriptionIdNum = parseInt(prescriptionId);
    if (isNaN(prescriptionIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid prescription ID" },
        { status: 400 }
      );
    }

    // Delete the prescription text (analysis data)
    await prisma.prescriptionText.deleteMany({
      where: {
        prescriptionId: prescriptionIdNum
      }
    });

    // Note: We don't delete the actual prescription record, just the analysis
    // This preserves the prescription data but removes the LLM analysis

    return NextResponse.json({
      success: true,
      message: "Prescription analysis deleted successfully"
    });

  } catch (error) {
    console.error('[PRESCRIPTION-DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete prescription analysis: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
