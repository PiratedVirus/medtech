import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Optimized dashboard summary with single aggregated query
export async function GET(request: Request) {
  try {
    // Use a single optimized query instead of multiple separate queries
    const summaryData = await prisma.$queryRaw<Array<{
      total_patients: bigint;
      active_subscriptions: bigint;
      todays_appointments: bigint;
      lab_bookings_pending: bigint;
      monthly_revenue: bigint | null;
      new_signups_this_week: bigint;
    }>>`
      WITH date_ranges AS (
        SELECT 
          CURRENT_DATE as today,
          DATE_TRUNC('month', CURRENT_DATE) as month_start,
          DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' as month_end,
          CURRENT_DATE - INTERVAL '7 days' as week_ago
      )
      SELECT 
        COUNT(CASE WHEN u.role = 'PATIENT' AND u."deletedAt" IS NULL THEN 1 END) as total_patients,
        COUNT(CASE WHEN st."isActive" = true AND st."deletedAt" IS NULL THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN da.date = dr.today 
                   AND a.status NOT IN ('Cancelled', 'Completed') 
                   AND a."deletedAt" IS NULL THEN 1 END) as todays_appointments,
        COUNT(CASE WHEN lb."labDate" = dr.today 
                   AND lb.status = 'PENDING' 
                   AND lb."deletedAt" IS NULL THEN 1 END) as lab_bookings_pending,
        COALESCE(SUM(CASE WHEN p."createdAt" >= dr.month_start 
                         AND p."createdAt" <= dr.month_end 
                         AND p."deletedAt" IS NULL THEN p.amount END), 0) as monthly_revenue,
        COUNT(CASE WHEN u.role = 'PATIENT' 
                   AND u."createdAt" >= dr.week_ago 
                   AND u."deletedAt" IS NULL THEN 1 END) as new_signups_this_week
      FROM date_ranges dr
      CROSS JOIN "User" u
      LEFT JOIN "SubscriptionTracker" st ON u.id = st."patientId"
      LEFT JOIN "Appointment" a ON u.id = a."patientId"
      LEFT JOIN "DoctorAvailability" da ON a."doctorAvailabilityId" = da.id
      LEFT JOIN "LabBooking" lb ON u.id = lb."patientId"
      LEFT JOIN "Payment" p ON (p."appointmentId" = a.id OR p."labBookingId" = lb.id OR p."subscriptionId" = st."subscriptionId")
    `;

    const result = summaryData[0];
    
    return NextResponse.json({
      totalPatients: Number(result.total_patients),
      activeSubscriptions: Number(result.active_subscriptions), 
      todaysAppointments: Number(result.todays_appointments),
      labBookingsPending: Number(result.lab_bookings_pending),
      monthlyRevenue: Number(result.monthly_revenue || 0),
      newSignupsThisWeek: Number(result.new_signups_this_week),
    });
  } catch (error) {
    console.error("Dashboard summary query error:", error);
    return NextResponse.json({ error: "Failed to fetch summary data" }, { status: 500 });
  }
}
