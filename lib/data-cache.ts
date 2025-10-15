import prisma from '@/lib/prisma'
import redis, { CACHE_KEYS, CACHE_TTL, cacheUtils } from '@/lib/redis'
import { AppointmentStatus, LabBookingStatus } from '@/lib/constants/enums'

/**
 * Dashboard Summary Cache
 * This is called frequently and can be cached for 5 minutes
 */
export async function getCachedDashboardSummary() {
  return await cacheUtils.getOrSet(
    CACHE_KEYS.DASHBOARD_SUMMARY,
    async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalPatients,
        activeSubscriptions,
        todaysAppointments,
        labBookingsPending,
        monthlyRevenueAgg,
        newSignupsThisWeek,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'PATIENT', deletedAt: null } }),
        prisma.subscriptionTracker.count({ where: { isActive: true, deletedAt: null } }),
        prisma.appointment.count({
          where: {
            deletedAt: null,
            status: { notIn: ['CANCELLED', 'COMPLETED'] },
            doctorAvailability: { date: { gte: todayStart, lte: todayEnd } },
          },
        }),
        prisma.labBooking.count({ where: { deletedAt: null, status: 'PENDING', labDate: todayStart } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { deletedAt: null, createdAt: { gte: monthStart, lte: monthEnd } },
        }),
        prisma.user.count({ where: { role: 'PATIENT', deletedAt: null, createdAt: { gte: weekAgo } } }),
      ]);

      return {
        total_patients: BigInt(totalPatients),
        active_subscriptions: BigInt(activeSubscriptions),
        todays_appointments: BigInt(todaysAppointments),
        lab_bookings_pending: BigInt(labBookingsPending),
        monthly_revenue: BigInt(monthlyRevenueAgg._sum.amount || 0),
        new_signups_this_week: BigInt(newSignupsThisWeek),
      };
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
      const existing = await prisma.labReportAnalysis.findFirst({
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
  
  try {
    const result = await cacheUtils.getOrSet(
      cacheKey,
      async () => {
        try {
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
            upcomingAppointments: upcomingAppointments || [],
            pastAppointments: pastAppointments || []
          };
        } catch (error) {
          console.error('Error in getCachedAppointments inner function:', error);
          return {
            upcomingAppointments: [],
            pastAppointments: []
          };
        }
      },
      CACHE_TTL.APPOINTMENTS
    );
    
    // Ensure we always return a valid structure
    return result || {
      upcomingAppointments: [],
      pastAppointments: []
    };
  } catch (error) {
    console.error('Error in getCachedAppointments:', error);
    return {
      upcomingAppointments: [],
      pastAppointments: []
    };
  }
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

export async function getCachedPathologyAppointments() {
  return await cacheUtils.getOrSet(
    CACHE_KEYS.PATHOLOGY_APPOINTMENTS,
    async () => {
      // This function should be implemented to fetch pathology appointments from database
      // For now, returning null to indicate cache miss
      return null;
    },
    CACHE_TTL.PATHOLOGY_APPOINTMENTS
  );
}

export async function getCachedInsights(patientId: number) {
  return await cacheUtils.getOrSet(
    CACHE_KEYS.INSIGHTS(patientId),
    async () => {
      // This function should be implemented to fetch insights from database
      // For now, returning null to indicate cache miss
      return null;
    },
    CACHE_TTL.INSIGHTS
  );
}


