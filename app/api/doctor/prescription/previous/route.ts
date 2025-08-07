import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch previous prescriptions for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const doctorId = searchParams.get("doctorId");
    const limit = parseInt(searchParams.get("limit") || "5");
    const latest = searchParams.get("latest") === "true";

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "patientId is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      patientId: parseInt(patientId),
      deletedAt: null,
    };

    // If doctorId is provided, filter by doctor
    if (doctorId) {
      whereClause.doctorId = parseInt(doctorId);
    }

    if (latest) {
      // Fetch only the latest prescription
      const latestPrescription = await prisma.prescription.findFirst({
        where: whereClause,
        include: {
          complaints: true,
          vitals: true,
          history: true,
          systemicExamination: true,
          medicines: true,
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          appointment: {
            select: {
              appointmentDate: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!latestPrescription) {
        return NextResponse.json({
          success: true,
          data: null,
          message: "No previous prescriptions found",
        });
      }

      return NextResponse.json({
        success: true,
        data: latestPrescription,
      });
    } else {
      // Fetch multiple previous prescriptions
      const previousPrescriptions = await prisma.prescription.findMany({
        where: whereClause,
        include: {
          complaints: true,
          vitals: true,
          history: true,
          systemicExamination: true,
          medicines: true,
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          appointment: {
            select: {
              appointmentDate: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        data: previousPrescriptions,
      });
    }
  } catch (error) {
    console.error("Fetch previous prescriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch previous prescriptions" },
      { status: 500 }
    );
  }
} 