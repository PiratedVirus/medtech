import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// POST - Create new assignment
export async function POST(request: Request) {
  console.log("POST /api/pathology/assign-phlebotomist called");
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

    const body = await request.json();
    const { patientId, phlebotomistId, labId, assignedDate, assignedTime, appointmentId, labBookingId } = body;

    // Validate required fields
    if (!patientId || !phlebotomistId) {
      return NextResponse.json(
        { error: "Patient ID and Phlebotomist ID are required" },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Check if phlebotomist exists
    const phlebotomist = await prisma.phlebotomist.findUnique({
      where: { id: phlebotomistId },
    });

    if (!phlebotomist) {
      return NextResponse.json(
        { error: "Phlebotomist not found" },
        { status: 404 }
      );
    }

    // Find the lab booking by its string ID if it's not a number
    let actualLabBookingId = labBookingId;
    if (labBookingId && typeof labBookingId === 'string' && labBookingId.startsWith('booking-')) {
      // Extract the numeric part from "booking-8" -> 8
      const numericId = parseInt(labBookingId.replace('booking-', ''));
      if (!isNaN(numericId)) {
        actualLabBookingId = numericId;
      }
    }

    console.log("POST - labBookingId:", labBookingId, "actualLabBookingId:", actualLabBookingId);

    // Validate that we have a valid lab booking ID
    if (!actualLabBookingId) {
      return NextResponse.json(
        { error: "Valid lab booking ID is required" },
        { status: 400 }
      );
    }

    // Check if the lab booking exists
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: actualLabBookingId },
    });

    if (!labBooking) {
      return NextResponse.json(
        { error: "Lab booking not found" },
        { status: 404 }
      );
    }

    // Check if there's already an active assignment for this specific lab booking
    const existingAssignment = await prisma.labAssignment.findFirst({
      where: {
        labBookingId: actualLabBookingId,
        status: {
          in: ["PENDING", "ASSIGNED", "PHLEBOTOMIST_LEFT", "SAMPLE_COLLECTED", "IN_LAB", "ANALYZING"],
        },
        deletedAt: null,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "This lab booking already has an active assignment. Use PUT to update existing assignment." },
        { status: 400 }
      );
    }

    // Check if lab exists (default to lab ID 1)
    const defaultLabId = labId || 1;
    const lab = await prisma.pathologyLab.findUnique({
      where: { id: defaultLabId },
    });

    if (!lab) {
      return NextResponse.json(
        { error: "Lab not found" },
        { status: 404 }
      );
    }

    // Check if appointment exists (if appointmentId is provided)
    let validAppointmentId = null;
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      
      if (!appointment) {
        console.log(`Appointment ID ${appointmentId} not found, setting to null`);
        validAppointmentId = null;
      } else {
        validAppointmentId = appointmentId;
      }
    }

    console.log("Creating lab assignment with data:", {
      patientId,
      phlebotomistId,
      labId: defaultLabId,
      appointmentId: validAppointmentId,
      labBookingId: actualLabBookingId,
      assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
      assignedTime: assignedTime || "09:00",
      status: "PENDING"
    });

    // Create new lab assignment
    const labAssignment = await prisma.labAssignment.create({
      data: {
        patientId,
        phlebotomistId,
        labId: defaultLabId,
        appointmentId: validAppointmentId,
        labBookingId: actualLabBookingId,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        assignedTime: assignedTime || "09:00",
        status: "ASSIGNED", // Set to ASSIGNED when phlebotomist is assigned
        sampleCollected: false,
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
      },
    });

    // Link booking and assignment bidirectionally
    if (actualLabBookingId) {
      await prisma.labBooking.update({
        where: { id: actualLabBookingId },
        data: {
          labAssignmentId: labAssignment.id,
          labTechId: phlebotomist.userId,
          status: "ASSIGNED" // Single status sync - set to ASSIGNED when phlebotomist is assigned
        }
      });

      // Ensure assignment also points to the booking
      await prisma.labAssignment.update({
        where: { id: labAssignment.id },
        data: { labBookingId: actualLabBookingId }
      });
    }

    return NextResponse.json({
      success: true,
      labAssignment,
      message: "New assignment created successfully",
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      name: error instanceof Error ? error.name : "Unknown error type"
    });
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT - Update existing assignment
export async function PUT(request: Request) {
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

    const body = await request.json();
    const { patientId, phlebotomistId, labId, assignedDate, assignedTime, appointmentId, labBookingId } = body;

    // Validate required fields
    if (!patientId || !phlebotomistId) {
      return NextResponse.json(
        { error: "Patient ID and Phlebotomist ID are required" },
        { status: 400 }
      );
    }

    // Fetch the phlebotomist to obtain underlying userId for labTechId FK
    const phlebotomist = await prisma.phlebotomist.findUnique({
      where: { id: phlebotomistId },
    });

    if (!phlebotomist) {
      return NextResponse.json(
        { error: "Phlebotomist not found" },
        { status: 404 }
      );
    }

    // Find the lab booking by its string ID if it's not a number
    let actualLabBookingId = labBookingId;
    if (labBookingId && typeof labBookingId === 'string' && labBookingId.startsWith('booking-')) {
      // Extract the numeric part from "booking-8" -> 8
      const numericId = parseInt(labBookingId.replace('booking-', ''));
      if (!isNaN(numericId)) {
        actualLabBookingId = numericId;
      }
    }

    // Find existing assignment for this specific lab booking
    const existingAssignment = await prisma.labAssignment.findFirst({
      where: {
        labBookingId: actualLabBookingId,
        status: {
          in: ["PENDING", "ASSIGNED", "PHLEBOTOMIST_LEFT", "SAMPLE_COLLECTED", "IN_LAB", "ANALYZING"],
        },
        deletedAt: null,
      },
    });

    // If no existing assignment, create a new one (this handles unassigned bookings)
    if (!existingAssignment) {
      // Create new assignment for unassigned booking
      const newAssignment = await prisma.labAssignment.create({
        data: {
          patientId,
          phlebotomistId,
          labId: labId || 1, // Default lab ID
          appointmentId,
          labBookingId: actualLabBookingId,
          assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
          assignedTime: assignedTime || "09:00",
          status: "ASSIGNED", // Mark as ready to start
          sampleCollected: false,
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
        },
      });

      // Link booking and assignment bidirectionally
      if (actualLabBookingId) {
        await prisma.labBooking.update({
          where: { id: actualLabBookingId },
          data: {
            labAssignmentId: newAssignment.id,
            labTechId: phlebotomist.userId,
            status: "ASSIGNED"
          }
        });

        // Ensure assignment also points to the booking
        await prisma.labAssignment.update({
          where: { id: newAssignment.id },
          data: { labBookingId: actualLabBookingId }
        });
      }

      return NextResponse.json({
        success: true,
        labAssignment: newAssignment,
        message: "New assignment created successfully",
      });
    }

    // Update existing assignment
    const updatedAssignment = await prisma.labAssignment.update({
      where: { id: existingAssignment.id },
      data: {
        phlebotomistId,
        labId: labId || existingAssignment.labId,
        assignedDate: assignedDate ? new Date(assignedDate) : existingAssignment.assignedDate,
        assignedTime: assignedTime || existingAssignment.assignedTime,
        status: "ASSIGNED", // When updating assignment, keep as ASSIGNED
        labBookingId: actualLabBookingId || existingAssignment.labBookingId,
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
      },
    });

    // Link booking and assignment bidirectionally
    if (actualLabBookingId) {
      await prisma.labBooking.update({
        where: { id: actualLabBookingId },
        data: {
          labAssignmentId: updatedAssignment.id,
          labTechId: phlebotomist.userId,
          status: "ASSIGNED" // Single status sync - keep as ASSIGNED
        }
      });

      // Ensure assignment also points to the booking
      await prisma.labAssignment.update({
        where: { id: updatedAssignment.id },
        data: { labBookingId: actualLabBookingId }
      });
    }

    return NextResponse.json({
      success: true,
      labAssignment: updatedAssignment,
      message: "Existing assignment updated successfully",
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 