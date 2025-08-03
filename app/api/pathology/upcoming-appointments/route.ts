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

    // Fetch upcoming appointments
    const today = new Date();
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: today,
        },
        status: {
          in: ["CONFIRMED", "SCHEDULED"],
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
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        doctorAvailability: {
          select: {
            startTime: true,
            endTime: true,
            date: true,
          },
        },
        labAssignments: {
          include: {
            phlebotomist: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        appointmentDate: "asc",
      },
      // No limit - show all upcoming appointments
    });

    // Transform the data to match frontend expectations
    const transformedAppointments = upcomingAppointments.map((appointment, index) => ({
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.name,
      doctorName: appointment.doctor.name,
      appointmentFor: appointment.appointmentFor || "Lab Test",
      appointmentDate: appointment.appointmentDate.toLocaleDateString(),
      startTime: appointment.doctorAvailability?.startTime || "02:30pm",
      endTime: appointment.doctorAvailability?.endTime,
      consultationType: appointment.consultationType,
      status: appointment.status,
      assignedPhlebotomist: appointment.labAssignments?.[0]?.phlebotomist?.user?.name || null,
      assignmentStatus: appointment.labAssignments?.[0]?.status || null,
      sessionStartIn: 10 + (index * 20), // Mock data for session start time
    }));

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