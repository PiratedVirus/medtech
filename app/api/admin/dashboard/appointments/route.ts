import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const appointments = await prisma.appointment.findMany({
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
      },
    });
    return NextResponse.json(appointments);
  } catch (error) {
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
