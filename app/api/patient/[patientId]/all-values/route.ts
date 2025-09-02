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
        labAssignments: {
          where: { status: 'COMPLETED', deletedAt: null },
          include: { 
            labBooking: {
              include: { reportAnalyses: true }
            }
          },
        },
      },
      orderBy: { labDate: "desc" },
    });

    interface ValueEntry {
      value: string | number;
      unit?: string;
      normalRange?: string;
      isAbnormal?: boolean;
      severity?: string;
      source?: string;
      reportDate?: string;
      reportId?: number;
      labDate?: Date;
      labBookingId?: number;
    }

    const criticalValuesMap = new Map<string, ValueEntry[]>();
    const allValuesMap = new Map<string, ValueEntry[]>();

    for (const booking of labBookings) {
      for (const assignment of booking.labAssignments) {
        if (assignment.labBooking?.reportAnalyses) {
          for (const analysis of assignment.labBooking.reportAnalyses) {
            const criticalList: any[] = Array.isArray(analysis?.criticalValues) ? analysis.criticalValues : [];
            const allList: any[] = Array.isArray(analysis?.allValues) ? analysis.allValues : [];
            
            // Process critical values
            for (const item of criticalList) {
              if (item.parameter && item.value) {
                const key = item.parameter.toLowerCase();
                if (!criticalValuesMap.has(key)) {
                  criticalValuesMap.set(key, []);
                }
                criticalValuesMap.get(key)!.push({
                  ...item,
                  labDate: booking.labDate,
                  labBookingId: booking.id,
                });
              }
            }
            
            // Process all values
            for (const item of allList) {
              if (item.parameter && item.value) {
                const key = item.parameter.toLowerCase();
                if (!allValuesMap.has(key)) {
                  allValuesMap.set(key, []);
                }
                allValuesMap.get(key)!.push({
                  ...item,
                  labDate: booking.labDate,
                  labBookingId: booking.id,
                });
              }
            }
          }
        }
      }
    }

    // Sort values per parameter by report date desc
    const rows = Array.from(criticalValuesMap.entries()).map(([parameter, values]) => ({
      parameter: parameter,
      isTracked: true, // Critical values are always tracked
      values: values.sort((a, b) => {
        const dateA = a.labDate || new Date(0);
        const dateB = b.labDate || new Date(0);
        return dateA < dateB ? 1 : -1;
      }),
    }));

    // Add all values to the rows
    Array.from(allValuesMap.entries()).forEach(([parameter, values]) => {
      const existingRow = rows.find(row => row.parameter === parameter);
      if (existingRow) {
        existingRow.values = [...existingRow.values, ...values.sort((a, b) => {
          const dateA = a.labDate || new Date(0);
          const dateB = b.labDate || new Date(0);
          return dateA < dateB ? 1 : -1;
        })];
      } else {
        rows.push({
          parameter: parameter,
          isTracked: false, // All values are not tracked
          values: values.sort((a, b) => {
            const dateA = a.labDate || new Date(0);
            const dateB = b.labDate || new Date(0);
            return dateA < dateB ? 1 : -1;
          }),
        });
      }
    });

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
