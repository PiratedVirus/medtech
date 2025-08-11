import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId: patientIdParam } = await params;
    const patientId = Number(patientIdParam);
    const body = await request.json();
    const { parameter, isTracked } = body || {};

    console.log('[TRACKED-VALUES][POST] Incoming request', {
      patientIdParam,
      parsedPatientId: patientId,
      body
    });

    if (!patientId || Number.isNaN(patientId)) {
      console.warn('[TRACKED-VALUES][POST] Invalid patientId');
      return NextResponse.json({ success: false, error: "Invalid patientId" }, { status: 400 });
    }
    if (!parameter || typeof isTracked !== "boolean") {
      console.warn('[TRACKED-VALUES][POST] Missing parameter/isTracked', { parameter, isTracked });
      return NextResponse.json({ success: false, error: "parameter and isTracked required" }, { status: 400 });
    }

    // Find latest booking that contains this parameter in analysis
    const bookings = await prisma.labBooking.findMany({
      where: {
        patientId,
        status: "COMPLETED",
        labResult: { isEmpty: false },
        reportAnalysis: { isNot: null },
      },
      include: { reportAnalysis: true },
      orderBy: { labDate: "desc" },
      take: 10,
    });

    console.log('[TRACKED-VALUES][POST] Searched recent bookings count:', bookings.length);

    let updated = false;
    for (const booking of bookings) {
      const analysis: any = booking.reportAnalysis;
      if (!analysis) continue;
      const criticalValues: any[] = Array.isArray(analysis.criticalValues) ? analysis.criticalValues : [];
      const allValues: any[] = Array.isArray(analysis.allValues) ? analysis.allValues : [];
      const idx = criticalValues.findIndex((v) => v?.parameter?.toLowerCase() === String(parameter).toLowerCase());
      const idxAll = allValues.findIndex((v) => v?.parameter?.toLowerCase() === String(parameter).toLowerCase());
      console.log('[TRACKED-VALUES][POST] Checking booking', {
        bookingId: booking.id,
        labDate: booking.labDate,
        criticalFound: criticalValues.map(v => v?.parameter).filter(Boolean),
        allFound: allValues.map(v => v?.parameter).filter(Boolean)
      });
      if (idx >= 0 || idxAll >= 0) {
        if (idx >= 0) {
          const before = criticalValues[idx];
          criticalValues[idx] = { ...criticalValues[idx], isTracked };
          console.log('[TRACKED-VALUES][POST] Updating parameter (critical)', {
            bookingId: booking.id,
            parameter: before?.parameter,
            previousIsTracked: before?.isTracked,
            newIsTracked: isTracked
          });
        }
        if (idxAll >= 0) {
          const beforeAll = allValues[idxAll];
          allValues[idxAll] = { ...allValues[idxAll], isTracked };
          console.log('[TRACKED-VALUES][POST] Updating parameter (all)', {
            bookingId: booking.id,
            parameter: beforeAll?.parameter,
            previousIsTracked: beforeAll?.isTracked,
            newIsTracked: isTracked
          });
        }
        await prisma.labReportAnalysis.update({
          where: { labBookingId: booking.id },
          data: { criticalValues: criticalValues as any, allValues: allValues as any },
        });
        console.log('[TRACKED-VALUES][POST] Update saved for booking', booking.id);
        updated = true;
        break;
      }
    }

    if (!updated) {
      console.warn('[TRACKED-VALUES][POST] Parameter not found in recent reports', { parameter });
      return NextResponse.json({ success: false, error: "Parameter not found in recent reports" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRACKED-VALUES][POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
