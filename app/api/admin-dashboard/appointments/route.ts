import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const currentTime = new Date(); // Get the current date and time
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: currentTime, // Filter for appointments starting from the current time onwards
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}