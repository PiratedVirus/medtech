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
      const allPlans = await prisma.plan.findMany({
        include: {
          planFeatures: true,
        },
      });

      // Build dynamic pricing structure (matching the actual route logic)
      const pricingData: Record<string, any> = {};

      for (const plan of allPlans) {
        const durationKey = plan.duration.toLowerCase(); // e.g., "6months"
        const planKey = plan.name.toLowerCase().replace("+", "Plus"); // "carePlus"

        if (!pricingData[durationKey]) {
          pricingData[durationKey] = {};
        }

        const featureMap: Record<string, any> = {};

        for (const feat of plan.planFeatures || []) {
          const rawKey = feat.featureName
            .replace(/\s+/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .replace(/^./, (c) => c.toLowerCase()); // e.g., doctorConsultation

          const isLab = rawKey.toLowerCase().includes("lab");
          const isMedicine = rawKey.toLowerCase().includes("medicine");

          if (isMedicine) {
            featureMap[rawKey] = {
              discount: plan.discountPercentage ?? 0,
            };
          } else if (isLab) {
            featureMap[rawKey] = {
              totalTests: feat.occurrencesPerInterval || 0,
              frequencyPerInterval: feat.occurrencesPerInterval || 0,
              intervalInMonths: feat.intervalInMonths || 0,
              parameters: feat.parameters || "",
            };
          } else {
            featureMap[rawKey] = {
              totalConsultations: feat.occurrencesPerInterval || 0,
              frequencyPerInterval: feat.occurrencesPerInterval || 0,
              intervalInMonths: feat.intervalInMonths || 0,
            };
          }
        }

        pricingData[durationKey][planKey] = {
          planId: plan.id,
          name: plan.name,
          price: plan.price ?? 0,
          ...featureMap,
        };
      }

      return { plans: allPlans, pricingData };
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
 * Appointments Cache
 * Cache user appointments for 5 minutes
 */
export async function getCachedAppointments(patientId: number, upcomingOnly: boolean = false) {
  const cacheKey = CACHE_KEYS.APPOINTMENTS(patientId, upcomingOnly)
  
  return await cacheUtils.getOrSet(
    cacheKey,
    async () => {
      // Build where clause
      const baseWhere: any = { patientId };
      
      // Fetch upcoming appointments
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          ...baseWhere,
          deletedAt: null,
          doctorAvailability: {
            date: {
              gte: new Date()
            }
          }
        },
        include: {
          doctor: {
            include: {
              doctorProfile: true
            }
          },
          doctorAvailability: true,
          patient: {
            include: {
              patientProfile: true
            }
          }
        },
        orderBy: {
          doctorAvailability: {
            date: 'asc'
          }
        }
      });

      // Fetch past appointments if not upcoming only
      let pastAppointments: any[] = [];
      if (!upcomingOnly) {
        pastAppointments = await prisma.appointment.findMany({
          where: {
            ...baseWhere,
            deletedAt: null,
            doctorAvailability: {
              date: {
                lt: new Date()
              }
            }
          },
          include: {
            doctor: {
              include: {
                doctorProfile: true
              }
            },
            doctorAvailability: true,
            patient: {
              include: {
                patientProfile: true
              }
            }
          },
          orderBy: {
            doctorAvailability: {
              date: 'desc'
            }
          }
        });
      }

      return {
        upcomingAppointments,
        pastAppointments
      };
    },
    CACHE_TTL.APPOINTMENTS
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

export async function invalidateAppointmentsCache(patientId: number): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.APPOINTMENTS(patientId, true))
  await cacheUtils.invalidate(CACHE_KEYS.APPOINTMENTS(patientId, false))
}

