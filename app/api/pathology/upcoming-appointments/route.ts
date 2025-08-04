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

    // Fetch upcoming lab assignments (no phlebotomist assigned yet)
    const today = new Date();
    const upcomingAssignments = await prisma.labAssignment.findMany({
      where: {
        assignedDate: {
          gte: today,
        },
        status: "PENDING", // Only PENDING - no phlebotomist assigned yet
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
                name: true,
              },
            },
          },
        },
        lab: {
          select: {
            id: true,
            name: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentFor: true,
            appointmentDate: true,
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
        assignedDate: "asc",
      },
    });

    // Also fetch lab bookings that don't have lab assignments yet
    const unassignedBookings = await prisma.labBooking.findMany({
      where: {
        labDate: {
          gte: today,
        },
        labAssignmentId: null, // No lab assignment created yet
        status: "Scheduled",
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        labPackage: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        labDate: "asc",
      },
    });
    console.log("upcoming assignments ", upcomingAssignments);
    console.log("unassigned bookings ", unassignedBookings);

    // Transform lab assignments to match frontend expectations
    const transformedAssignments = upcomingAssignments.map((assignment, index) => ({
      id: assignment.id,
      patientId: assignment.patientId,
      patientName: assignment.patient.name,
      doctorName: "Lab Assignment", // Lab assignments don't have doctors
      appointmentFor: assignment.labBooking?.labPackage?.name || assignment.appointment?.appointmentFor || "Lab Test",
      appointmentDate: assignment.assignedDate.toLocaleDateString(),
      startTime: assignment.assignedTime,
      endTime: null,
      consultationType: "lab",
      status: assignment.status,
      assignedPhlebotomist: assignment.phlebotomist?.user?.name || null,
      assignmentStatus: assignment.status,
      sessionStartIn: 10 + (index * 20), // Mock data for session start time
    }));

    // Transform unassigned bookings to match frontend expectations
    const transformedUnassignedBookings = unassignedBookings.map((booking, index) => ({
      id: `booking-${booking.id}`, // Prefix to distinguish from assignments
      patientId: booking.patientId,
      patientName: booking.patient.name,
      doctorName: "Lab Booking", // Lab bookings don't have doctors
      appointmentFor: booking.labPackage.name,
      appointmentDate: booking.labDate.toLocaleDateString(),
      startTime: "09:00", // Default time
      endTime: null,
      consultationType: "lab",
      status: "UNASSIGNED",
      assignedPhlebotomist: null, // No phlebotomist assigned - this will show "Assign Phlebotomist" button
      assignmentStatus: "UNASSIGNED",
      sessionStartIn: 10 + ((index + upcomingAssignments.length) * 20), // Mock data for session start time
    }));

    // Combine both arrays
    const transformedAppointments = [...transformedAssignments, ...transformedUnassignedBookings];

    return NextResponse.json({
      success: true,
      appointments: transformedAppointments,
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 