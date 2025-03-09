import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          doctor: { select: { name: true } },
          doctorAvailability: { select: { startTime: true, endTime: true } }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.count(),
    ]);

    // Transform the data structure
    const transformedAppointments = appointments.map(appointment => {
      const { doctor, doctorAvailability, ...rest } = appointment;
      return {
        ...rest,
        doctorName: doctor.name,
        startTime: doctorAvailability.startTime,
        endTime: doctorAvailability.endTime
      };
    });

    return NextResponse.json({
      data: transformedAppointments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Ensure doctorAvailabilityId exists and is available
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: data.doctorAvailabilityId, status: "available" }
    });

    if (!availability) {
      return NextResponse.json({ error: "Invalid or unavailable appointment slot" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data
    });

    return NextResponse.json({ data: appointment, message: "Appointment created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();

    // Get existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctorAvailability: true }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Transaction for slot updates and appointment update
    const result = await prisma.$transaction(async (tx) => {
      // If changing time slot
      if (data.doctorAvailabilityId && 
          data.doctorAvailabilityId !== existingAppointment.doctorAvailabilityId) {
        // Mark old slot as available
        await tx.doctorAvailability.update({
          where: { id: existingAppointment.doctorAvailabilityId },
          data: { status: "available" }
        });

        // Check and update new slot
        const newAvailability = await tx.doctorAvailability.findUnique({
          where: { id: data.doctorAvailabilityId }
        });

        if (!newAvailability || newAvailability.status !== "available") {
          throw new Error("New slot is not available");
        }

        await tx.doctorAvailability.update({
          where: { id: data.doctorAvailabilityId },
          data: { status: "booked" }
        });
      }

      // Update appointment
      return await tx.appointment.update({
        where: { id },
        data: {
          ...data,
          // Ensure consultationTypeId is valid
          consultationTypeId: data.consultationTypeId ? Number(data.consultationTypeId) : undefined
        }
      });
    });

    return NextResponse.json({ data: result, message: "Appointment updated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}

// Endpoint to fetch available slots for a specific doctor
export async function GET_AVAILABLE_SLOTS(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = parseInt(searchParams.get("doctorId") || "0");

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
    }

    const availableSlots = await prisma.doctorAvailability.findMany({
      where: { doctorId, status: "available" },
      select: { id: true, date: true, startTime: true, endTime: true },
    });

    return NextResponse.json({ data: availableSlots });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch available slots" }, { status: 500 });
  }
}
