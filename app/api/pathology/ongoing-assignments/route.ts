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

    const currentTime = new Date();

    // Fetch ongoing lab assignments (started workflow)
    // These are assignments that have moved beyond the "ready to start" phase
    const ongoingAssignments = await prisma.labAssignment.findMany({
      where: {
        status: {
          in: ["PHLEBOTOMIST_LEFT", "SAMPLE_COLLECTED", "IN_LAB", "ANALYZING"],
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
        labBooking: {
          select: {
            id: true,
            appointmentFor: true,
            labPackage: {
              select: {
                name: true,
              },
            },
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
        appointmentFor: assignment.labBooking?.labPackage?.name || assignment.appointment?.appointmentFor || 'Lab Test',
      },
      labBooking: assignment.labBooking ? {
        id: assignment.labBooking.id,
        labPackageId: assignment.labBooking.id,
        appointmentFor: assignment.labBooking.appointmentFor,
        fullName: assignment.patient.name,
        mobile: "",
        email: "",
        address: "",
        paymentOption: "",
        status: assignment.status,
        labDate: assignment.assignedDate.toISOString(),
        labResult: [],
        labPackage: {
          id: assignment.labBooking.labPackage?.id || 0,
          name: assignment.labBooking.labPackage?.name || "Lab Test",
          price: 0,
        },
      } : undefined,
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