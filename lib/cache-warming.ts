/**
 * Cache Warming Utilities
 * Pre-populates Redis cache to avoid first-time cache misses
 */

import { cacheUtils, CACHE_KEYS, CACHE_TTL } from './redis';
import prisma from './prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * Warm doctor-specific caches after login
 * This pre-populates commonly accessed data to avoid cache misses
 */
export async function warmDoctorCaches(phoneNumber: string): Promise<void> {
  try {
    // Get doctor user
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return; // Not a doctor, skip warming
    }

    const doctorId = user.id;
    const cacheKeyPrefix = `${phoneNumber}`;

    // Warm caches in parallel (non-blocking)
    Promise.all([
      warmDoctorAppointments(doctorId, cacheKeyPrefix),
      warmDoctorClinicInfo(user, cacheKeyPrefix),
      warmDoctorEarnings(doctorId, cacheKeyPrefix),
    ]).catch((error) => {
      console.error('[CACHE-WARMING] Error warming doctor caches:', error);
      // Don't throw - cache warming is best effort
    });
  } catch (error) {
    console.error('[CACHE-WARMING] Error in warmDoctorCaches:', error);
    // Don't throw - cache warming should never break the app
  }
}

/**
 * Warm doctor appointments cache
 */
async function warmDoctorAppointments(doctorId: number, cacheKeyPrefix: string): Promise<void> {
  try {
    const now = new Date();
    
    // Fetch upcoming and past appointments
    const [upcoming, past] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          userId: doctorId,
          doctorAvailability: { date: { gte: now } },
          deletedAt: null,
        },
        include: {
          patient: { select: { name: true, id: true } },
          payment: { select: { paymentMethod: true } },
          doctorAvailability: { select: { date: true, startTime: true, endTime: true } },
          prescription: { select: { id: true } },
        },
        orderBy: [
          { doctorAvailability: { date: "asc" } },
          { doctorAvailability: { startTime: "asc" } },
        ],
        take: 20, // Limit for cache warming
      }),
      prisma.appointment.findMany({
        where: {
          userId: doctorId,
          doctorAvailability: { date: { lt: now } },
          deletedAt: null,
        },
        include: {
          patient: { select: { name: true, id: true } },
          payment: { select: { paymentMethod: true } },
          doctorAvailability: { select: { date: true, startTime: true, endTime: true } },
          prescription: { select: { id: true } },
        },
        orderBy: [
          { doctorAvailability: { date: "desc" } },
          { doctorAvailability: { startTime: "desc" } },
        ],
        take: 20, // Limit for cache warming
      }),
    ]);

    // Get appointment counts for isFirst check
    const allPatientIds = [...new Set([...upcoming, ...past].map(a => a.patient.id))];
    const appointmentCounts = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        userId: doctorId,
        patientId: { in: allPatientIds },
        deletedAt: null,
      },
      _count: { id: true },
    });

    const patientAppointmentCountMap = new Map(
      appointmentCounts.map(item => [item.patientId, item._count.id])
    );

    // Transform appointments
    const enrichAppointments = (list: any[]) => {
      return list.map((appt) => {
        const appointmentCount = patientAppointmentCountMap.get(appt.patient.id) || 0;
        return {
          id: appt.id,
          patientName: appt.patient.name,
          patientId: appt.patient.id,
          date: appt.doctorAvailability?.date,
          startTime: appt.doctorAvailability?.startTime,
          endTime: appt.doctorAvailability?.endTime,
          status: appt.status,
          paymentType: appt.payment?.paymentMethod || null,
          consultationType: appt.consultationType,
          isFirst: appointmentCount === 1,
          prescriptionLink: appt.prescriptionLink || undefined,
          prescriptionId: appt.prescription?.id || null,
        };
      });
    };

    const upcomingEnriched = enrichAppointments(upcoming);
    const pastEnriched = enrichAppointments(past);

    // Cache the appointments/all response (using phoneNumber as identifier)
    const cacheKey = `doctor:appointments:${cacheKeyPrefix}`;
    await cacheUtils.set(cacheKey, {
      upcoming: upcomingEnriched,
      past: pastEnriched,
    }, CACHE_TTL.DOCTOR_APPOINTMENTS);

    // Also warm individual appointment caches (for top 5 upcoming)
    for (const appt of upcomingEnriched.slice(0, 5)) {
      const individualCacheKey = `doctor:appointments:${appt.id}`;
      await cacheUtils.set(individualCacheKey, appt, CACHE_TTL.DOCTOR_APPOINTMENTS);
    }

    console.log(`[CACHE-WARMING] Warmed appointments cache for doctor ${doctorId}`);
  } catch (error) {
    console.error('[CACHE-WARMING] Error warming appointments:', error);
  }
}

/**
 * Warm doctor clinic info cache
 */
async function warmDoctorClinicInfo(user: any, cacheKeyPrefix: string): Promise<void> {
  try {
    if (!user.clinicId) return;

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId, deletedAt: null },
      select: {
        id: true,
        name: true,
        logo: true,
        address: true,
        contactInfo: true,
        timings: true,
        subtitle: true,
        domain: true,
      },
    });

    if (clinic) {
      const cacheKey = `doctor:clinic-info:${cacheKeyPrefix}`;
      await cacheUtils.set(cacheKey, { clinic }, CACHE_TTL.DOCTOR_PROFILE);
      console.log(`[CACHE-WARMING] Warmed clinic info cache for doctor ${user.id}`);
    }
  } catch (error) {
    console.error('[CACHE-WARMING] Error warming clinic info:', error);
  }
}

/**
 * Warm doctor earnings cache
 */
async function warmDoctorEarnings(doctorId: number, cacheKeyPrefix: string): Promise<void> {
  try {
    // Fetch earnings data (simplified version for warming)
    const [paidPayments, pendingPayments] = await Promise.all([
      prisma.payment.findMany({
        where: {
          appointment: { userId: doctorId },
          paymentStatus: "PAID",
        },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Limit for cache warming
      }),
      prisma.payment.findMany({
        where: {
          appointment: { userId: doctorId },
          paymentStatus: "PENDING",
        },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Limit for cache warming
      }),
    ]);

    const paidEarnings = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingEarnings = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const simplified = [...paidPayments, ...pendingPayments].map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId!,
      patientName: p.appointment?.patient?.name || "Unknown",
      amount: p.amount,
      paymentMethod: p.paymentMethod || "",
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt,
    }));

    const cacheKey = `doctor:earnings:${cacheKeyPrefix}`;
    await cacheUtils.set(cacheKey, {
      payments: simplified,
      earnings: {
        paid: paidEarnings,
        pending: pendingEarnings,
        cash: 0, // Will be calculated on actual request
        online: 0, // Will be calculated on actual request
        cashCount: 0,
        onlineCount: 0,
        total: paidEarnings + pendingEarnings,
      },
    }, CACHE_TTL.DOCTOR_PROFILE);

    console.log(`[CACHE-WARMING] Warmed earnings cache for doctor ${doctorId}`);
  } catch (error) {
    console.error('[CACHE-WARMING] Error warming earnings:', error);
  }
}

/**
 * Warm cache for a specific appointment (called after appointment creation/update)
 */
export async function warmAppointmentCache(appointmentId: number, doctorId: number): Promise<void> {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: doctorId,
        deletedAt: null,
      },
      include: {
        patient: { select: { name: true, id: true, phoneNumber: true } },
        payment: { select: { paymentMethod: true, paymentStatus: true, amount: true } },
        doctorAvailability: { select: { date: true, startTime: true, endTime: true } },
        prescription: { select: { id: true, prescriptionNumber: true } },
      },
    });

    if (!appointment) return;

    const appointmentCount = await prisma.appointment.count({
      where: {
        userId: doctorId,
        patientId: appointment.patientId,
        deletedAt: null,
      },
    });

    const transformedAppointment = {
      id: appointment.id,
      patientName: appointment.patient.name,
      patientId: appointment.patient.id,
      date: appointment.doctorAvailability?.date,
      startTime: appointment.doctorAvailability?.startTime,
      endTime: appointment.doctorAvailability?.endTime,
      status: appointment.status,
      paymentType: appointment.payment?.paymentMethod || null,
      paymentStatus: appointment.payment?.paymentStatus || null,
      paymentAmount: appointment.payment?.amount || null,
      consultationType: appointment.consultationType,
      isFirst: appointmentCount === 1,
      prescriptionLink: appointment.prescriptionLink || undefined,
      prescriptionId: appointment.prescription?.id || null,
      prescriptionNumber: appointment.prescription?.prescriptionNumber || null,
    };

    const cacheKey = `doctor:appointments:${appointmentId}`;
    await cacheUtils.set(cacheKey, transformedAppointment, CACHE_TTL.DOCTOR_APPOINTMENTS);

    console.log(`[CACHE-WARMING] Warmed appointment cache for ${appointmentId}`);
  } catch (error) {
    console.error('[CACHE-WARMING] Error warming appointment cache:', error);
  }
}

/**
 * Warm related caches after a successful cache miss
 * This is called from the cache middleware to proactively warm related data
 */
export async function warmRelatedCaches(
  endpoint: string,
  doctorIdentifier: string | null,
  data: any
): Promise<void> {
  if (!doctorIdentifier) return;

  try {
    // If we just fetched appointments/all, warm individual appointment caches
    if (endpoint.includes('/appointments/all') && data?.upcoming) {
      const topAppointments = data.upcoming.slice(0, 5);
      for (const appt of topAppointments) {
        if (appt.id) {
          const cacheKey = `doctor:appointments:${appt.id}`;
          await cacheUtils.set(cacheKey, appt, CACHE_TTL.DOCTOR_APPOINTMENTS);
        }
      }
    }
  } catch (error) {
    console.error('[CACHE-WARMING] Error warming related caches:', error);
    // Don't throw - this is best effort
  }
}



