import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createClinicFilter, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

// Optimized dashboard summary with clinic filtering
export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    // Create clinic filters
    const userClinicFilter = createUserClinicFilter(clinicId);
    const clinicFilter = createClinicFilter(clinicId);

    const totalPatients = await prisma.user.count({
      where: { 
        role: 'PATIENT',
        ...clinicFilter,
        deletedAt: null
      },
    });

    const activeSubscriptions = await prisma.subscriptionTracker.count({
      where: { 
        isActive: true,
        user: userClinicFilter.user
      },
    });

    const todaysAppointments = await prisma.appointment.count({
      where: {
        doctorAvailability: { 
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          }
        },
        doctor: userClinicFilter.user
      },
    });

    const labBookingsPending = await prisma.labBooking.count({
      where: { 
        status: 'PENDING',
        patient: userClinicFilter.user
      },
    });

    const monthlyRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
        // Filter payments by clinic through appointments or subscriptions
        OR: [
          { appointment: { doctor: userClinicFilter.user } },
          { subscription: { user: userClinicFilter.user } }
        ]
      },
    });

    const newSignupsThisWeek = await prisma.user.count({
      where: {
        role: 'PATIENT',
        ...clinicFilter,
        deletedAt: null,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    return NextResponse.json({
      totalPatients,
      activeSubscriptions, 
      todaysAppointments,
      labBookingsPending,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      newSignupsThisWeek,
    });
  } catch (error: any) {
    console.error("Dashboard summary query error:", error);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        error: "Failed to fetch summary data",
        details: isDev ? (error?.message || String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
