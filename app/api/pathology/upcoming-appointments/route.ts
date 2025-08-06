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

    const today = new Date();
    const currentTime = new Date();

    // Fetch upcoming lab assignments (PENDING and ASSIGNED statuses)
    // These are bookings that have phlebotomists assigned but haven't started yet
    const upcomingAssignments = await prisma.labAssignment.findMany({
      where: {
        assignedDate: {
          gte: today,
        },
        status: {
          in: ["PENDING", "ASSIGNED"], // PENDING = assigned but not started, ASSIGNED = ready to start
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

    // Fetch lab bookings that don't have lab assignments yet (truly unassigned)
    const unassignedBookings = await prisma.labBooking.findMany({
      where: {
        labDate: {
          gte: today,
        },
        labAssignmentId: null, // No lab assignment created yet = no phlebotomist assigned
        status: "PENDING", // Using single status
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
      // Add flag to identify if this is ready to start (ASSIGNED status)
      isReadyToStart: assignment.status === "ASSIGNED",
    }));

    // Transform unassigned bookings to match frontend expectations
    const transformedUnassignedBookings = unassignedBookings.map((booking, index) => ({
      id: booking.id, // Use numeric ID directly
      labBookingId: booking.id, // Set labBookingId to the numeric ID
      patientId: booking.patientId,
      patientName: booking.patient.name,
      doctorName: "Lab Booking", // Lab bookings don't have doctors
      appointmentFor: booking.labPackage.name,
      appointmentDate: booking.labDate.toLocaleDateString(),
      startTime: "09:00", // Default time
      endTime: null,
      consultationType: "lab",
      status: "PENDING", // These are truly unassigned
      assignedPhlebotomist: null, // No phlebotomist assigned - this will show "Assign Phlebotomist" button
      labAssignmentId: null, // Explicitly set to null for unassigned bookings
      assignmentStatus: "PENDING",
      sessionStartIn: 10 + ((index + upcomingAssignments.length) * 20), // Mock data for session start time
      isReadyToStart: false, // Not ready to start since no phlebotomist assigned
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