import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const totalPatients = await prisma.user.count({
      where: { role: 'PATIENT' },
    });

    const activeSubscriptions = await prisma.subscriptionTracker.count({
      where: { isActive: true },
    });

    const todaysAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    const labBookingsPending = await prisma.labBooking.count({
      where: { status: 'PENDING' },
    });

    const monthlyRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    });

    const newSignupsThisWeek = await prisma.user.count({
      where: {
        role: 'PATIENT',
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    const summaryData = {
      totalPatients,
      activeSubscriptions,
      todaysAppointments,
      labBookingsPending,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      newSignupsThisWeek,
    };

    return NextResponse.json(summaryData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch summary data" }, { status: 500 });
  }
}
