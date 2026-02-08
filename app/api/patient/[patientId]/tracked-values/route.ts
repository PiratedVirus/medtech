import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserAuth, handleAuthError } from "@/lib/clinic-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    // Authenticate user and validate clinic access
    const auth = await requireUserAuth();
    if (!auth.success) {
      return handleAuthError(auth);
    }
    
    const clinicId = auth.clinicId;
    
    const { patientId: patientIdParam } = await params;
    const patientId = Number(patientIdParam);

    if (!patientId || Number.isNaN(patientId)) {
      return NextResponse.json({ success: false, error: "Invalid patientId" }, { status: 400 });
    }

    // Multi-tenancy: Verify patient belongs to the same clinic
    if (clinicId) {
      const patient = await prisma.user.findFirst({
        where: { id: patientId, clinicId, deletedAt: null }
      });
      if (!patient) {
        return NextResponse.json({ success: false, error: "Patient not found or access denied" }, { status: 403 });
      }
    }

    const labBookings = await prisma.labBooking.findMany({
      where: {
        patientId,
        status: "COMPLETED",
        labResult: { isEmpty: false },
      },
      include: {
        labPackage: true,
        reportAnalyses: true,
      },
      orderBy: { labDate: "desc" },
    });

    // Also fetch standalone reports with their analyses
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
    
    // Filter for reports with lab analysis (relaxed filtering)
    const standaloneReports = allStandaloneReports.filter(report => 
      report.reportAnalyses.some(analysis => 
        analysis.analysisType === "lab_analysis" && 
        (analysis.allValues || analysis.criticalValues)
      )
    );

    const selectedValues: Array<{
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

    const getAnalysisReportDate = (analysis: any) => {
      const reportDateRaw = (analysis?.trendAnalysis as any)?.reportDate;
      if (!reportDateRaw) return null;
      const parsed = new Date(reportDateRaw);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toISOString().split("T")[0];
    };

    // Process lab bookings
    labBookings.forEach((booking) => {
      const analyses = booking.reportAnalyses as any[];
      const reportDateStr = analyses?.map(getAnalysisReportDate).find(Boolean) || null;
      if (!reportDateStr) return;

      const analysis = analyses?.[0];
      const criticalList: any[] = Array.isArray(analysis?.criticalValues) ? analysis.criticalValues : [];
      const allList: any[] = Array.isArray(analysis?.allValues) ? analysis.allValues : [];

      // 1) Include critical values unless explicitly untracked
      for (const value of criticalList) {
        if (!value || !value.parameter || value.value === undefined) continue;
        const isTracked = value.isTracked !== false; // default to true
        if (!isTracked) continue; // skip untracked critical
        selectedValues.push({
          parameter: value.parameter,
          value: value.value,
          unit: value.unit || "",
          normalRange: value.normalRange,
          isAbnormal: value.isAbnormal ?? true,
          severity: value.severity || "HIGH",
          category: value.category,
          reportDate: reportDateStr,
          labPackageName: booking.labPackage?.name || "Unknown",
          reportId: booking.id,
          isTracked,
        });
      }

      // 2) Include non-critical (allValues) ONLY if explicitly tracked
      for (const value of allList) {
        if (!value || !value.parameter || value.value === undefined) continue;
        const isTracked = value.isTracked === true; // default to false unless explicitly tracked
        if (!isTracked) continue;
        selectedValues.push({
          parameter: value.parameter,
          value: value.value,
          unit: value.unit || "",
          normalRange: value.normalRange,
          isAbnormal: value.isAbnormal ?? false,
          severity: value.severity || "NORMAL",
          category: value.category,
          reportDate: reportDateStr,
          labPackageName: booking.labPackage?.name || "Unknown",
          reportId: booking.id,
          isTracked,
        });
      }
    });

    // Process standalone reports
    standaloneReports.forEach((report) => {
      for (const analysis of report.reportAnalyses) {
        if (analysis.analysisType !== "lab_analysis") continue;

        // Use extracted report date from trendAnalysis when available
        const reportDateStr = getAnalysisReportDate(analysis);
        if (!reportDateStr) continue;

        const criticalList: any[] = Array.isArray(analysis.criticalValues) ? analysis.criticalValues : [];
        const allList: any[] = Array.isArray(analysis.allValues) ? analysis.allValues : [];

        // 1) Include critical values unless explicitly untracked
        for (const value of criticalList) {
          if (!value || !value.parameter || value.value === undefined) continue;
          const isTracked = value.isTracked !== false; // default to true
          if (!isTracked) continue; // skip untracked critical
          selectedValues.push({
            parameter: value.parameter,
            value: value.value,
            unit: value.unit || "",
            normalRange: value.normalRange,
            isAbnormal: value.isAbnormal ?? true,
            severity: value.severity || "HIGH",
            category: value.category,
            reportDate: reportDateStr,
            labPackageName: `Standalone Report (${report.reportType})`,
            reportId: report.id,
            isTracked,
          });
        }

        // 2) Include non-critical (allValues) ONLY if explicitly tracked
        for (const value of allList) {
          if (!value || !value.parameter || value.value === undefined) continue;
          const isTracked = value.isTracked === true; // default to false unless explicitly tracked
          if (!isTracked) continue;
          selectedValues.push({
            parameter: value.parameter,
            value: value.value,
            unit: value.unit || "",
            normalRange: value.normalRange,
            isAbnormal: value.isAbnormal ?? false,
            severity: value.severity || "NORMAL",
            category: value.category,
            reportDate: reportDateStr,
            labPackageName: `Standalone Report (${report.reportType})`,
            reportId: report.id,
            isTracked,
          });
        }
      }
    });

    const uniqueLatest = new Map<string, (typeof selectedValues)[number]>();
    for (const v of selectedValues) {
      const existing = uniqueLatest.get(v.parameter);
      if (!existing || new Date(v.reportDate) > new Date(existing.reportDate)) {
        uniqueLatest.set(v.parameter, v);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalReports: labBookings.length,
        totalStandaloneReports: standaloneReports.length,
        totalCriticalValues: selectedValues.length,
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
