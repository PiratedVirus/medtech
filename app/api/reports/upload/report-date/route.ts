import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import prisma from "@/lib/prisma";
import { tokenUserWhere } from "@/lib/clinic-auth";

interface JWTPayload {
  plusAddedPhoneNumber: string;
  userRole?: string;
  userId?: number;
}

type ExtractedLabValue = {
  parameter?: unknown;
  value?: unknown;
  unit?: unknown;
  normalRange?: unknown;
  isAbnormal?: unknown;
  severity?: unknown;
};

async function verifyUserToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  const decoded = await verifyUserToken(token);
  if (!decoded) return null;

  return prisma.user.findFirst({
    where: await tokenUserWhere(decoded),
    select: { id: true, role: true, phoneNumber: true },
  });
}

function parseDateInput(dateInput: string): Date | null {
  if (!dateInput) return null;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
    ? `${dateInput}T00:00:00.000Z`
    : dateInput;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, reportDate } = body;

    if (!reportId || !reportDate) {
      return NextResponse.json(
        { success: false, error: "reportId and reportDate are required" },
        { status: 400 }
      );
    }

    const reportIdNum = Number(reportId);
    if (!Number.isFinite(reportIdNum)) {
      return NextResponse.json({ success: false, error: "Invalid reportId" }, { status: 400 });
    }

    const parsedDate = parseDateInput(String(reportDate));
    if (!parsedDate) {
      return NextResponse.json({ success: false, error: "Invalid reportDate" }, { status: 400 });
    }

    const report = await prisma.standaloneReport.findUnique({
      where: { id: reportIdNum },
      include: {
        reportAnalyses: {
          where: { analysisType: "lab_analysis", deletedAt: null },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const isPatient = user.role === "PATIENT";
    if (isPatient && report.patientId !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own report date" },
        { status: 403 }
      );
    }

    const analysis = report.reportAnalyses[0];
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Lab analysis not found for this report" },
        { status: 404 }
      );
    }

    const allValues = Array.isArray(analysis.allValues)
      ? (analysis.allValues as unknown[])
      : [];
    if (allValues.length === 0) {
      return NextResponse.json(
        { success: false, error: "No extracted values available. Please regenerate analysis first." },
        { status: 400 }
      );
    }

    await prisma.reportTrendData.deleteMany({
      where: { standaloneReportId: report.id },
    });

    for (const rawValue of allValues) {
      const value = (rawValue ?? {}) as ExtractedLabValue;
      if (!value.parameter || !value.value) continue;

      const severityRaw = typeof value.severity === "string" ? value.severity.toUpperCase() : null;
      const severity =
        severityRaw && ["LOW", "NORMAL", "HIGH", "CRITICAL"].includes(severityRaw)
          ? (severityRaw as "LOW" | "NORMAL" | "HIGH" | "CRITICAL")
          : null;

      await prisma.reportTrendData.create({
        data: {
          patientId: report.patientId,
          parameter: String(value.parameter),
          value: String(value.value),
          unit: value.unit ? String(value.unit) : null,
          normalRange: value.normalRange ? String(value.normalRange) : null,
          isAbnormal: Boolean(value.isAbnormal),
          severity,
          reportDate: parsedDate,
          labBookingId: null,
          standaloneReportId: report.id,
          sourceReportId: null,
        },
      });
    }

    const updatedTrendAnalysis = {
      ...(analysis.trendAnalysis as any || {}),
      reportDate: parsedDate.toISOString(),
      isFallbackDate: false,
      fallbackSource: null,
      userCorrectedDate: true,
      correctedAt: new Date().toISOString(),
    };

    const updatedAnalysis = await prisma.standaloneReportAnalysis.update({
      where: { id: analysis.id },
      data: {
        trendAnalysis: updatedTrendAnalysis,
      },
      select: {
        id: true,
        analysisType: true,
        processingStatus: true,
        trendAnalysis: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Report date updated and trends rebuilt",
      analysis: updatedAnalysis,
    });
  } catch (error) {
    console.error("Error updating report date:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update report date" },
      { status: 500 }
    );
  }
}
