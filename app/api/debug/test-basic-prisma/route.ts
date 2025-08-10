import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Use a basic Prisma client without custom extensions
    const basicPrisma = new PrismaClient();
    
    console.log('[TEST-BASIC] Basic Prisma client created');
    
    // Test if we can access the PrescriptionText model
    const count = await basicPrisma.prescriptionText.count();
    
    await basicPrisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: "Basic Prisma client can access PrescriptionText model",
      count: count
    });
  } catch (error) {
    console.error('[TEST-BASIC] Error:', error);
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
