/**
 * Cache Warming Utilities
 * Pre-populates Redis cache to avoid first-time cache misses
 */

import { cacheUtils, CACHE_KEYS, CACHE_TTL } from './redis';
import prisma from './prisma';

/**
 * Warm doctor-specific caches after login
 * This pre-populates commonly accessed data to avoid cache misses
 */
export async function warmDoctorCaches(userId: number): Promise<void> {
  try {
    // Get doctor user (by id - the same phone can belong to users in other clinics)
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return; // Not a doctor, skip warming
    }

    const doctorId = user.id;

    // Warm caches in parallel (non-blocking)
    Promise.all([
      warmDoctorAppointments(doctorId),
      warmDoctorClinicInfo(user),
      warmDoctorEarnings(doctorId),
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
async function warmDoctorAppointments(doctorId: number): Promise<void> {
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

    // Cache the appointments/all response
    const cacheKey = CACHE_KEYS.DOCTOR_SCOPED('doctor:appointments', doctorId, 'all');
    await cacheUtils.set(cacheKey, {
      upcoming: upcomingEnriched,
      past: pastEnriched,
    }, CACHE_TTL.DOCTOR_APPOINTMENTS);

    console.log(`[CACHE-WARMING] Warmed appointments cache for doctor ${doctorId}`);
  } catch (error) {
    console.error('[CACHE-WARMING] Error warming appointments:', error);
  }
}

/**
 * Warm doctor clinic info cache
 */
async function warmDoctorClinicInfo(user: any): Promise<void> {
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
      const cacheKey = CACHE_KEYS.DOCTOR_SCOPED('doctor:clinic-info', user.id);
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
async function warmDoctorEarnings(doctorId: number): Promise<void> {
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

    const cacheKey = CACHE_KEYS.DOCTOR_SCOPED('doctor:earnings', doctorId);
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
