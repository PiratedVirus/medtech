import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCachedDashboardSummary } from "@/lib/data-cache";

// Optimized dashboard summary with Redis caching
export async function GET(request: Request) {
  try {
    // Use Redis cache for dashboard summary (5-minute TTL)
    const result = await getCachedDashboardSummary();
    
    return NextResponse.json({
      totalPatients: Number(result.total_patients),
      activeSubscriptions: Number(result.active_subscriptions), 
      todaysAppointments: Number(result.todays_appointments),
      labBookingsPending: Number(result.lab_bookings_pending),
      monthlyRevenue: Number(result.monthly_revenue || 0),
      newSignupsThisWeek: Number(result.new_signups_this_week),
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
