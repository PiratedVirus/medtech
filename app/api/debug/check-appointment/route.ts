import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get('id');

  try {
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(appointmentId) },
        include: {
          doctorAvailability: true
        }
      });

      return NextResponse.json({
        success: true,
        appointment: appointment ? {
          id: appointment.id,
          patientId: appointment.patientId,
          userId: appointment.userId,
          appointmentFor: appointment.appointmentFor,
          doctorAvailability: { date: appointment.doctorAvailability?.date },
          status: appointment.status,
        } : null,
        exists: !!appointment
      });
    } else {
      // List all appointments
      const appointments = await prisma.appointment.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          patientId: true,
          appointmentFor: true,
          doctorAvailability: { select: { date: true } },
          status: true,
        }
      });

      return NextResponse.json({
        success: true,
        appointments
      });
    }
  } catch (error) {
    console.error("Check appointment error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
} 