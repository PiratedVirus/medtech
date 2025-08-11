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
        reportAnalysis: true,
      },
      orderBy: { labDate: "desc" },
    });

    type ValueEntry = {
      value: string | number;
      unit?: string;
      normalRange?: string;
      isAbnormal?: boolean;
      severity?: string;
      source: 'CRITICAL' | 'ALL';
      reportDate: string;
      reportId: number;
    };

    const paramToValues = new Map<string, { parameter: string; isTracked: boolean; values: ValueEntry[] }>();

    for (const booking of labBookings) {
      const analysis = booking.reportAnalysis as any;
      const criticalList: any[] = Array.isArray(analysis?.criticalValues) ? analysis.criticalValues : [];
      const allList: any[] = Array.isArray(analysis?.allValues) ? analysis.allValues : [];

      const addValue = (parameter: string, entry: ValueEntry, explicitIsTracked?: boolean | null, defaultTracked = false) => {
        const existing = paramToValues.get(parameter) || { parameter, isTracked: defaultTracked, values: [] };
        existing.values.push(entry);
        // Track state precedence: explicit boolean from the most recent entry wins.
        if (typeof explicitIsTracked === 'boolean') {
          existing.isTracked = explicitIsTracked;
        }
        paramToValues.set(parameter, existing);
      };

      for (const v of criticalList) {
        if (!v?.parameter || v.value === undefined) continue;
        addValue(
          v.parameter,
          {
            value: v.value,
            unit: v.unit,
            normalRange: v.normalRange,
            isAbnormal: v.isAbnormal,
            severity: v.severity,
            source: 'CRITICAL',
            reportDate: booking.labDate.toISOString().split('T')[0],
            reportId: booking.id,
          },
          v.isTracked,
          true // default tracked for critical
        );
      }

      for (const v of allList) {
        if (!v?.parameter || v.value === undefined) continue;
        addValue(
          v.parameter,
          {
            value: v.value,
            unit: v.unit,
            normalRange: v.normalRange,
            isAbnormal: v.isAbnormal,
            severity: v.severity,
            source: 'ALL',
            reportDate: booking.labDate.toISOString().split('T')[0],
            reportId: booking.id,
          },
          v.isTracked,
          false // default not tracked for non-critical
        );
      }
    }

    // Sort values per parameter by report date desc
    const rows = Array.from(paramToValues.values()).map((row) => ({
      parameter: row.parameter,
      isTracked: !!row.isTracked,
      values: row.values.sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1)),
    }));

    // Sort parameters alphabetically
    rows.sort((a, b) => a.parameter.localeCompare(b.parameter));

    return NextResponse.json({ success: true, data: { rows } });
  } catch (error) {
    console.error('[ALL-VALUES][GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
