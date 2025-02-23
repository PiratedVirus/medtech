import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all appointments
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          select: { name: true },
        },
        doctor: {
          select: {
            name: true,
            doctorProfile: {
              select: { specialty: true },
            },
          },
        },
        consultationType: {
          select: { type: true },
        },
      },
      orderBy: {
        appointmentDate: "asc", // Ensures chronological order
      },
    });

    const now = new Date();

    // Filter upcoming appointments (only the next closest one)
    const upcoming = appointments.find(
      (appointment) =>
        new Date(appointment.appointmentDate) > now &&
        appointment.status === "Scheduled"
    );

    // Filter past completed appointments
    const past = appointments.filter(
      (appointment) =>
        new Date(appointment.appointmentDate) < now &&
        appointment.status === "Completed"
    );

    return NextResponse.json({ success: true, upcoming, past });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as any).message },
      { status: 500 }
    );
  }
}