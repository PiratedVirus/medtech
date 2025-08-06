import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Check if we can connect to the database
    const labs = await prisma.pathologyLab.findMany({
    });

    const patients = await prisma.user.findMany({
      where: { role: "PATIENT" },
    });

    const phlebotomists = await prisma.phlebotomist.findMany({
    });

    const labBookings = await prisma.labBooking.findMany({
    });

    const labAssignments = await prisma.labAssignment.findMany({
    });

    return NextResponse.json({
      success: true,
      data: {
        labs: labs.length,
        patients: patients.length,
        phlebotomists: phlebotomists.length,
        labBookings: labBookings.length,
        labAssignments: labAssignments.length,
        sampleLabs: labs.map(l => ({ id: l.id, name: l.name })),
        samplePatients: patients.map(p => ({ id: p.id, name: p.name })),
        samplePhlebotomists: phlebotomists.map(p => ({ id: p.id, employeeId: p.employeeId })),
        sampleLabBookings: labBookings.map(b => ({ id: b.id, patientId: b.patientId, status: b.status })),
      }
    });
  } catch (error) {
    console.error("Database status check error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 