import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET() {
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
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = user.id;

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        appointmentDate: {
          gte: new Date(),
        },
        deletedAt: null,
      },
      include: {
        patient: { select: { name: true } },
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
      patientId: appointment.patientId,
      patient: appointment.patient,
      doctor: { name: user.name }, // Add doctor info
      date: appointment.doctorAvailability.date.toISOString(),
      startTime: appointment.doctorAvailability.startTime,
      endTime: appointment.doctorAvailability.endTime,
      status: appointment.status,
      consultationType: appointment.consultationType,
      doctorAvailability: appointment.doctorAvailability,
      payment: appointment.payment
        ? {
            amount: appointment.payment.amount,
            status: appointment.payment.paymentStatus,
          }
        : null,
    }));

    return NextResponse.json({ appointments: transformedAppointments });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 