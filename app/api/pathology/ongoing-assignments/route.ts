import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
    });
    if (!user || user.role !== "PATHOLOGY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch ongoing lab assignments
    const ongoingAssignments = await prisma.labAssignment.findMany({
      where: {
        status: {
          in: ["ASSIGNED", "PHLEBOTOMIST_LEFT", "SAMPLE_COLLECTED", "IN_LAB", "ANALYZING"],
        },
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        phlebotomist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        appointment: {
          select: {
            appointmentFor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 ongoing assignments
    });

    // Transform the data to match frontend expectations
    const transformedAssignments = ongoingAssignments.map((assignment) => ({
      id: assignment.id,
      patient: {
        name: assignment.patient.name,
      },
      phlebotomist: {
        user: {
          name: assignment.phlebotomist.user.name,
        },
      },
      appointment: {
        appointmentFor: assignment.appointment?.appointmentFor || 'Lab Test',
      },
      assignedDate: assignment.assignedDate,
      assignedTime: assignment.assignedTime,
      status: assignment.status,
      sampleCollected: assignment.sampleCollected,
      sampleCollectedAt: assignment.sampleCollectedAt,
    }));

    return NextResponse.json({
      success: true,
      assignments: transformedAssignments,
    });
  } catch (error) {
    console.error("Error fetching ongoing assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 