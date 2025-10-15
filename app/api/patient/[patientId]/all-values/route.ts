import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";

const getAllValuesHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) => {
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
    
    console.log('[ALL-VALUES][GET] Lab bookings count:', labBookings.length);
    console.log('[ALL-VALUES][GET] Lab bookings with analyses:', labBookings.map(b => ({
      id: b.id,
      labDate: b.labDate,
      assignmentsCount: b.labAssignments.length,
      analysesCount: b.labAssignments.reduce((sum, a) => sum + (a.labBooking?.reportAnalyses?.length || 0), 0)
    })));

    // Also fetch standalone reports with their analyses
    // First, let's check what standalone reports exist for this patient
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
    });
    
    console.log('[ALL-VALUES][GET] All standalone reports for patient:', allStandaloneReports.map(r => ({
      id: r.id,
      status: r.status,
      reportType: r.reportType,
      analysesCount: r.reportAnalyses.length,
      analyses: r.reportAnalyses.map(a => ({
        id: a.id,
        analysisType: a.analysisType,
        processingStatus: a.processingStatus,
        hasAllValues: !!a.allValues,
        hasCriticalValues: !!a.criticalValues,
        allValuesType: typeof a.allValues,
        criticalValuesType: typeof a.criticalValues
      }))
    })));
    
    // Now filter for completed reports with lab analysis
    // Let's be more flexible with the filtering to see what we actually have
    const standaloneReports = allStandaloneReports.filter(report => {
      const hasCompletedAnalysis = report.reportAnalyses.some(analysis => 
        analysis.processingStatus === "COMPLETED" && 
        analysis.analysisType === "lab_analysis"
      );
      
      console.log(`[ALL-VALUES][GET] Report ${report.id} status: ${report.status}, hasCompletedAnalysis: ${hasCompletedAnalysis}`);
      
      return report.status === "COMPLETED" && hasCompletedAnalysis;
    });
    
    // If no reports found with strict filtering, let's try a more relaxed approach
    if (standaloneReports.length === 0) {
      console.log('[ALL-VALUES][GET] No reports found with strict filtering, trying relaxed approach...');
      const relaxedReports = allStandaloneReports.filter(report => 
        report.reportAnalyses.some(analysis => 
          analysis.analysisType === "lab_analysis" && 
          (analysis.allValues || analysis.criticalValues)
        )
      );
      console.log('[ALL-VALUES][GET] Relaxed filtering found:', relaxedReports.length, 'reports');
      // Use relaxed reports if no strict matches found
      if (relaxedReports.length > 0) {
        standaloneReports.push(...relaxedReports);
      }
    }
    
    console.log('[ALL-VALUES][GET] Filtered standalone reports count:', standaloneReports.length);
    
    console.log('[ALL-VALUES][GET] Standalone reports count:', standaloneReports.length);
    console.log('[ALL-VALUES][GET] Standalone reports with analyses:', standaloneReports.map(r => ({
      id: r.id,
      reportType: r.reportType,
      analysesCount: r.reportAnalyses.length,
      analyses: r.reportAnalyses.map(a => ({
        id: a.id,
        analysisType: a.analysisType,
        processingStatus: a.processingStatus,
        hasAllValues: !!a.allValues,
        hasCriticalValues: !!a.criticalValues
      }))
    })));
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

    // Process lab booking values
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
                  source: 'lab_report'
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
                  source: 'lab_report'
                });
              }
            }
          }
        }
      }
    }

    // Process standalone report values
    for (const report of standaloneReports) {
      for (const analysis of report.reportAnalyses) {
        const criticalList: any[] = Array.isArray(analysis?.criticalValues) ? analysis.criticalValues : [];
        const allList: any[] = Array.isArray(analysis?.allValues) ? analysis.allValues : [];
        
        // Process critical values from standalone reports
        for (const item of criticalList) {
          if (item.parameter && item.value) {
            const key = item.parameter.toLowerCase();
            if (!criticalValuesMap.has(key)) {
              criticalValuesMap.set(key, []);
            }
            criticalValuesMap.get(key)!.push({
              ...item,
              reportDate: report.createdAt,
              reportId: report.id,
              source: 'standalone_report'
            });
          }
        }
        
        // Process all values from standalone reports
        for (const item of allList) {
          if (item.parameter && item.value) {
            const key = item.parameter.toLowerCase();
            if (!allValuesMap.has(key)) {
              allValuesMap.set(key, []);
            }
            allValuesMap.get(key)!.push({
              ...item,
              reportDate: report.createdAt,
              reportId: report.id,
              source: 'standalone_report'
            });
          }
        }
      }
    }

    // Combine all values (both critical and all values) and show all instead of just critical
    const combinedValuesMap = new Map<string, ValueEntry[]>();
    
    // Add critical values
    for (const [parameter, values] of criticalValuesMap.entries()) {
      if (!combinedValuesMap.has(parameter)) {
        combinedValuesMap.set(parameter, []);
      }
      combinedValuesMap.get(parameter)!.push(...values);
    }
    
    // Add all values
    for (const [parameter, values] of allValuesMap.entries()) {
      if (!combinedValuesMap.has(parameter)) {
        combinedValuesMap.set(parameter, []);
      }
      combinedValuesMap.get(parameter)!.push(...values);
    }

    // Create rows with all unique values, sorted by date
    const rows = Array.from(combinedValuesMap.entries()).map(([parameter, values]) => {
      // Remove duplicates based on value, unit, and date
      const uniqueValues = values.filter((value, index, self) => 
        index === self.findIndex(v => 
          v.value === value.value && 
          v.unit === value.unit && 
          (v.labDate?.getTime() === value.labDate?.getTime() || v.reportDate === value.reportDate)
        )
      );

      return {
        parameter: parameter,
        isTracked: criticalValuesMap.has(parameter), // Tracked if it has critical values
        values: uniqueValues.sort((a, b) => {
          const dateA = a.labDate || new Date(a.reportDate || 0);
          const dateB = b.labDate || new Date(b.reportDate || 0);
          return dateA < dateB ? 1 : -1;
        }),
      };
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
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/patient/[patientId]/all-values'))(getAllValuesHandler);
