import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get current date (yesterday to include today's appointments)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorAvailability: {
          date: {
            gte: yesterday
          }
        },
        status: {
          notIn: ["Cancelled", "Completed"]
        }
      },
      select: {
        id: true,
        appointmentDate: true,
        status: true,
        isDietician: true,
        consultationType: true,
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
            date: true,
            startTime: true,
            endTime: true,
          }
        }
      },
      orderBy: [
        {
          doctorAvailability: {
            date: 'asc'
          }
        },
        {
          doctorAvailability: {
            startTime: 'asc'
          }
        }
      ],
      take: 10
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { appointmentId, link } = await request.json();
    if (!appointmentId || !link) {
      return NextResponse.json({ error: "Missing appointmentId or link" }, { status: 400 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { prescriptionLink: link }
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Failed to update appointment link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
