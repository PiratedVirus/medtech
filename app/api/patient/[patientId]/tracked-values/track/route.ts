import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cacheUtils } from "@/lib/redis";
import { CacheEvents } from "@/lib/cache-events";

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

    // Normalize parameter for comparison
    const parameterLc = String(parameter).toLowerCase();

    // Helper to update all matching values in a list
    const updateValues = (values: any[]) => {
      let touched = false;
      const updated = values.map((v) => {
        if (v?.parameter && String(v.parameter).toLowerCase() === parameterLc) {
          touched = true;
          return { ...v, isTracked };
        }
        return v;
      });
      return { updated, touched };
    };

    // Find latest booking that contains this parameter in analysis
    const bookings = await prisma.labBooking.findMany({
      where: {
        patientId,
        status: "COMPLETED",
        labResult: { isEmpty: false },
      },
      include: { 
        reportAnalyses: {
          where: { deletedAt: null }
        }
      },
      orderBy: { labDate: "desc" },
      take: 50, // Increased to ensure we find the parameter
    });

    // Also find standalone reports that contain this parameter
    // Use the same relaxed approach as in all-values API
    const allStandaloneReports = await prisma.standaloneReport.findMany({
      where: {
        patientId,
        deletedAt: null
      },
      include: {
        reportAnalyses: {
          where: { deletedAt: null }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Increased to ensure we find the parameter
    });
    
    // Filter for reports with lab analysis (relaxed filtering)
    let standaloneReports = allStandaloneReports.filter(report => 
      report.reportAnalyses.some(analysis => 
        analysis.analysisType === "lab_analysis" && 
        (analysis.allValues || analysis.criticalValues)
      )
    );
    
    // Fallback: use relaxed filtering if no reports found
    if (standaloneReports.length === 0) {
      standaloneReports = allStandaloneReports.filter(report => 
        report.reportAnalyses.some(analysis => 
          analysis.allValues || analysis.criticalValues
        )
      );
    }

    console.log('[TRACKED-VALUES][POST] Searched recent bookings count:', bookings.length);
    console.log('[TRACKED-VALUES][POST] Searched standalone reports count:', standaloneReports.length);

    let updated = false;

    // Process lab bookings (update ALL occurrences)
    for (const booking of bookings) {
      const analyses: any[] = Array.isArray(booking.reportAnalyses) ? booking.reportAnalyses : [];
      
      console.log('[TRACKED-VALUES][POST] Checking booking', {
        bookingId: booking.id,
        labDate: booking.labDate,
        analysesCount: analyses.length
      });
      
      for (const analysis of analyses) {
        if (!analysis) continue;
        
        const criticalValues: any[] = Array.isArray(analysis.criticalValues) ? analysis.criticalValues : [];
        const allValues: any[] = Array.isArray(analysis.allValues) ? analysis.allValues : [];

        const { updated: updatedCritical, touched: touchedCritical } = updateValues(criticalValues);
        const { updated: updatedAll, touched: touchedAll } = updateValues(allValues);

        if (touchedCritical || touchedAll) {
          await prisma.labReportAnalysis.update({
            where: { id: analysis.id },
            data: {
              criticalValues: updatedCritical as any,
              allValues: updatedAll as any,
            }
          });
          
          console.log('[TRACKED-VALUES][POST] Updated analysis', {
            analysisId: analysis.id,
            touchedCritical,
            touchedAll,
            parameter
          });

          updated = true;
        }
      }
    }

    // Process standalone reports (update ALL occurrences)
    console.log('[TRACKED-VALUES][POST] Searching in standalone reports...');
    for (const report of standaloneReports) {
      console.log(`[TRACKED-VALUES][POST] Checking standalone report ${report.id} with ${report.reportAnalyses.length} analyses`);
      for (const analysis of report.reportAnalyses) {
        const criticalValues: any[] = Array.isArray(analysis.criticalValues) ? analysis.criticalValues : [];
        const allValues: any[] = Array.isArray(analysis.allValues) ? analysis.allValues : [];

        const { updated: updatedCritical, touched: touchedCritical } = updateValues(criticalValues);
        const { updated: updatedAll, touched: touchedAll } = updateValues(allValues);
        
        if (touchedCritical || touchedAll) {
          await prisma.standaloneReportAnalysis.update({
            where: { id: analysis.id },
            data: {
              criticalValues: updatedCritical as any,
              allValues: updatedAll as any,
            }
          });
          console.log('[TRACKED-VALUES][POST] Update saved for standalone report analysis', {
            reportId: report.id,
            analysisId: analysis.id,
            touchedCritical,
            touchedAll,
            parameter
          });
          updated = true;
        }
      }
    }

    if (!updated) {
      console.warn('[TRACKED-VALUES][POST] Parameter not found in recent reports', { parameter });
      return NextResponse.json({ success: false, error: "Parameter not found in recent reports" }, { status: 404 });
    }

    // Invalidate caches
    try {
      // Invalidate all-values cache for this patient
      await cacheUtils.invalidate(`patient:all-values:${patientId}`);
      // Invalidate tracked-values cache
      await cacheUtils.invalidate(`patient:${patientId}:tracked-values`);
      // Emit lab result updated event to invalidate related caches
      await CacheEvents.labResultUpdated(patientId);
    } catch (cacheError) {
      console.error('[TRACKED-VALUES][POST] Error invalidating cache:', cacheError);
      // Don't fail the request if cache invalidation fails
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
