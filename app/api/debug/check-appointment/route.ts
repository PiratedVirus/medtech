import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get('id');

  try {
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(appointmentId) },
      });

      return NextResponse.json({
        success: true,
        appointment: appointment ? {
          id: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentFor: appointment.appointmentFor,
          appointmentDate: appointment.appointmentDate,
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
          appointmentDate: true,
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