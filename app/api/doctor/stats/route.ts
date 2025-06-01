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

    // Get total appointments
    const totalAppointments = await prisma.appointment.count({
      where: {
        doctorId,
        deletedAt: null,
      },
    });

    // Get upcoming appointments
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        doctorId,
        date: {
          gte: new Date(),
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        deletedAt: null,
      },
    });

    // Get total unique patients
    const totalPatients = await prisma.appointment.groupBy({
      by: ["patientId"],
      where: {
        doctorId,
        deletedAt: null,
      },
      _count: true,
    });

    // Get total earnings from completed appointments
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: "COMPLETED",
        deletedAt: null,
      },
      include: {
        payment: true,
      },
    });

    const totalEarnings = completedAppointments.reduce((sum, appointment) => {
      return sum + (appointment.payment?.amount || 0);
    }, 0);

    return NextResponse.json({
      totalAppointments,
      upcomingAppointments,
      totalPatients: totalPatients.length,
      totalEarnings,
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 