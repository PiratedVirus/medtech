import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId: patientIdParam } = await params;
    const patientId = Number(patientIdParam);

    if (!patientId || Number.isNaN(patientId)) {
      return NextResponse.json({ success: false, error: "Invalid patientId" }, { status: 400 });
    }

    const labBookings = await prisma.labBooking.findMany({
      where: {
        patientId,
        status: "COMPLETED",
        labResult: { isEmpty: false },
      },
      include: {
        labPackage: true,
        reportAnalysis: true,
      },
      orderBy: { labDate: "desc" },
    });

    const allCriticalValues: Array<{
      parameter: string;
      value: string | number;
      unit: string;
      normalRange?: string;
      isAbnormal: boolean;
      severity: string;
      category?: string;
      reportDate: string;
      labPackageName: string;
      reportId: number;
      isTracked: boolean;
    }> = [];

    labBookings.forEach((booking) => {
      const analysis = booking.reportAnalysis as any;
      const list: any[] = Array.isArray(analysis?.criticalValues) ? analysis.criticalValues : [];
      for (const value of list) {
        if (!value || !value.parameter || value.value === undefined) continue;
        const isTracked = value.isTracked !== false; // default to true
        if (!isTracked) continue; // skip untracked
        allCriticalValues.push({
          parameter: value.parameter,
          value: value.value,
          unit: value.unit || "",
          normalRange: value.normalRange,
          isAbnormal: value.isAbnormal ?? true,
          severity: value.severity || "HIGH",
          category: value.category,
          reportDate: booking.labDate.toISOString().split("T")[0],
          labPackageName: booking.labPackage?.name || "Unknown",
          reportId: booking.id,
          isTracked,
        });
      }
    });

    const uniqueLatest = new Map<string, (typeof allCriticalValues)[number]>();
    for (const v of allCriticalValues) {
      const existing = uniqueLatest.get(v.parameter);
      if (!existing || new Date(v.reportDate) > new Date(existing.reportDate)) {
        uniqueLatest.set(v.parameter, v);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalReports: labBookings.length,
        totalCriticalValues: allCriticalValues.length,
        criticalValues: Array.from(uniqueLatest.values()),
      },
    });
  } catch (error) {
    console.error("[TRACKED-VALUES][GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
