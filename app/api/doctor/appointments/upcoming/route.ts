import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = session.user.doctorProfile.id;

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: new Date(),
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        payment: {
          select: {
            amount: true,
            paymentStatus: true,
          },
        },
        doctorAvailability: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        {
          appointmentDate: "asc",
        },
        {
          doctorAvailability: {
            startTime: "asc",
          },
        },
      ],
      take: 5, // Limit to 5 upcoming appointments
    });

    // Transform the appointments to match the expected interface
    const transformedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      patient: appointment.patient,
      date: appointment.doctorAvailability.date.toISOString(),
      startTime: appointment.doctorAvailability.startTime,
      endTime: appointment.doctorAvailability.endTime,
      status: appointment.status,
      consultationType: appointment.consultationType,
      payment: appointment.payment
        ? {
            amount: appointment.payment.amount,
            status: appointment.payment.paymentStatus,
          }
        : null,
    }));

    return NextResponse.json(transformedAppointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 