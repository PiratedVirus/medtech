import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: new Date(),
        },
      },
      include: {
        doctor: true,
        patient: true,
      },
      orderBy: {
        appointmentDate: "asc",
      },
      take: 5,
    });

    const upcomingLabBookings = await prisma.labBooking.findMany({
      where: {
        bookingDate: {
          gte: new Date(),
        },
      },
      include: {
        lab: true,
        patient: true,
      },
      orderBy: {
        bookingDate: "asc",
      },
      take: 5,
    });

    const totalEarnings = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
    });

    const userStatistics = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    const recentActivities = await prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const systemHealthStatus = {
      database: "Operational",
      server: "Operational",
      api: "Operational",
    };

    return NextResponse.json({
      upcomingAppointments,
      upcomingLabBookings,
      totalEarnings: totalEarnings._sum.amount || 0,
      userStatistics,
      recentActivities,
      systemHealthStatus,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch insights data" }, { status: 500 });
  }
}
