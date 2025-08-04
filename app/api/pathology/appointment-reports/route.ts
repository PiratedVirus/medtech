import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    // Fetch reports for the appointment
    const reports = await prisma.appointmentReport.findMany({
      where: {
        appointmentId: parseInt(appointmentId),
        deletedAt: null,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        uploadedAt: true,
        fileSize: true,
        mimeType: true,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    // Transform the data for frontend
    const transformedReports = reports.map((report) => ({
      id: report.id,
      name: report.fileName,
      url: report.fileUrl,
      uploadedAt: report.uploadedAt.toISOString(),
      size: report.fileSize,
      type: report.mimeType,
    }));

    return NextResponse.json({
      success: true,
      reports: transformedReports,
    });
  } catch (error) {
    console.error("Error fetching appointment reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment reports" },
      { status: 500 }
    );
  }
}