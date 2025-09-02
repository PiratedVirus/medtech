import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Prisma object:', typeof prisma, prisma ? 'loaded' : 'undefined');
    
    // Test if we can access the PrescriptionText model
    const count = await prisma.prescriptionText.count();
    
    return NextResponse.json({
      success: true,
      message: "PrescriptionText model is accessible",
      count: count
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
