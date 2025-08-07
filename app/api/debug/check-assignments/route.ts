import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const labAssignments = await prisma.labAssignment.findMany({
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        phlebotomist: {
          select: {
            id: true,
            employeeId: true,
          },
        },
        labBooking: {
          select: {
            id: true,
            patientId: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      assignments: labAssignments.map(assignment => ({
        id: assignment.id,
        patientId: assignment.patientId,
        patientName: assignment.patient.name,
        phlebotomistId: assignment.phlebotomistId,
        phlebotomistEmployeeId: assignment.phlebotomist.employeeId,
        labBookingId: assignment.labBookingId,
        labBookingPatientId: assignment.labBooking?.patientId,
        labBookingStatus: assignment.labBooking?.status,
        status: assignment.status,
        assignedDate: assignment.assignedDate,
        assignedTime: assignment.assignedTime,
      })),
    });
  } catch (error) {
    console.error("Check assignments error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 