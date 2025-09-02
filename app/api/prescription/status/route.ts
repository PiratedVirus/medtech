import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prescriptionId = searchParams.get("prescriptionId");

    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: "prescriptionId is required" },
        { status: 400 }
      );
    }

    const prisma = new PrismaClient();

    try {
      const prescriptionText = await prisma.prescriptionText.findUnique({
        where: { prescriptionId: parseInt(prescriptionId) },
        select: {
          processingStatus: true,
          processedAt: true,
          textLength: true,
          processingError: true
        }
      });

      if (!prescriptionText) {
        return NextResponse.json({
          success: true,
          data: {
            processingStatus: 'PENDING',
            processedAt: null,
            textLength: 0,
            processingError: null
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: prescriptionText
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error("[PRESCRIPTION-STATUS-API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
