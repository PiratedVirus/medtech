import prisma from '@/lib/prisma'
import redis, { CACHE_KEYS, CACHE_TTL, cacheUtils } from '@/lib/redis'

/**
 * Dashboard Summary Cache
 * This is called frequently and can be cached for 5 minutes
 */
export async function getCachedDashboardSummary() {
  return await cacheUtils.getOrSet(
    CACHE_KEYS.DASHBOARD_SUMMARY,
    async () => {
      // Use the existing optimized query
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

      return summaryData[0];
    },
    CACHE_TTL.DASHBOARD_SUMMARY
  )
}

/**
 * Plans Data Cache
 * Plans don't change often, cache for 30 minutes
 */
export async function getCachedPlansData() {
  return await cacheUtils.getOrSet(
    CACHE_KEYS.PLANS_DATA,
    async () => {
      const plans = await prisma.plan.findMany({
        include: {
          planFeatures: true,
        },
      });

      // Build dynamic pricing structure
      const pricingData: Record<string, any> = {};
      for (const plan of plans) {
        const durationKey = plan.duration.toLowerCase();
        pricingData[durationKey] = {
          ...plan,
          features: plan.planFeatures.map(f => f.feature),
        };
      }

      return { plans, pricingData };
    },
    CACHE_TTL.PLANS_DATA
  )
}

/**
 * Diet Plan Cache
 * Cache individual diet plans for 10 minutes
 */
export async function getCachedDietPlan(patientId: number) {
  const cacheKey = CACHE_KEYS.DIET_PLAN(patientId)
  
  return await cacheUtils.getOrSet(
    cacheKey,
    async () => {
      // Prefer new DietPlan records; fallback to old diet-appointment prescription links
      const latestPlan = await prisma.dietPlan.findFirst({
        where: { patientId, deletedAt: null },
        orderBy: { id: 'desc' },
      });
      
      if (latestPlan) {
        return { prescriptionLink: null, dietPlan: latestPlan };
      }

      const legacy = await prisma.appointment.findFirst({
        where: { patientId, isDietician: true, deletedAt: null },
        orderBy: { id: 'desc' },
        select: { prescriptionLink: true },
      });
      
      return legacy;
    },
    CACHE_TTL.DIET_PLAN
  )
}

/**
 * LLM Extract Cache
 * Cache LLM processing results for 1 hour
 */
export async function getCachedLLMExtract(analysisId: number) {
  const cacheKey = CACHE_KEYS.LLM_EXTRACT(analysisId)
  
  return await cacheUtils.getOrSet(
    cacheKey,
    async () => {
      const existing = await prisma.labAnalysis.findFirst({
        where: {
          id: analysisId,
          deletedAt: null
        }
      });

      if (existing && 
          Array.isArray(existing.allValues) && existing.allValues.length > 0 && 
          Array.isArray(existing.criticalValues) && existing.criticalValues.length > 0) {
        return {
          allValues: existing.allValues,
          criticalValues: existing.criticalValues
        };
      }

      return null;
    },
    CACHE_TTL.LLM_EXTRACT
  )
}

/**
 * Cache invalidation functions
 */
export async function invalidateDashboardCache(): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.DASHBOARD_SUMMARY)
}

export async function invalidatePlansCache(): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.PLANS_DATA)
}

export async function invalidateDietPlanCache(patientId: number): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.DIET_PLAN(patientId))
}

export async function invalidateLLMExtractCache(analysisId: number): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.LLM_EXTRACT(analysisId))
}

