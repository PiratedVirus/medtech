import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";
import { 
  requireDoctorAuth, 
  handleAuthError 
} from "@/lib/clinic-auth";

const getAllAppointmentsHandler = async (request: NextRequest) => {
  try {
    // Authenticate doctor and validate clinic access
    const auth = await requireDoctorAuth();
    if (!auth.success) {
      return handleAuthError(auth);
    }

    const doctorId = auth.userId!;
    const clinicId = auth.clinicId;
    
    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic context required" },
        { status: 401 }
      );
    }
    
    // Get user with doctor profile for additional data
    const user = await prisma.user.findFirst({
      where: { id: doctorId },
      include: { doctorProfile: true },
    });
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const now = new Date();

    // Upcoming appointments - filtered by clinic for multi-tenancy
    const upcoming = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        doctorAvailability: {
          date: { gte: now }
        },
        deletedAt: null,
        // Multi-tenancy: Only get appointments with patients from the same clinic
        patient: {
          clinicId: clinicId
        },
      },
      include: {
        patient: { select: { name: true, id: true } },
        payment: { select: { paymentMethod: true } },
        doctorAvailability: { select: { date: true, startTime: true, endTime: true } },
        prescription: { select: { id: true } },
      },
      orderBy: { doctorAvailability: { date: "asc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Past appointments - filtered by clinic for multi-tenancy
    const past = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        doctorAvailability: {
          date: { lt: now }
        },
        deletedAt: null,
        // Multi-tenancy: Only get appointments with patients from the same clinic
        patient: {
          clinicId: clinicId
        },
      },
      include: {
        patient: { select: { name: true, id: true } },
        payment: { select: { paymentMethod: true } },
        doctorAvailability: { select: { date: true, startTime: true, endTime: true } },
        prescription: { select: { id: true } },
      },
      orderBy: { doctorAvailability: { date: "desc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Optimize: Get all unique patient IDs and check first appointments in a single query
    const allPatientIds = [...new Set([...upcoming, ...past].map(a => a.patient.id))];
    
    // Single query to get appointment counts per patient (to determine if first appointment)
    // Multi-tenancy: Ensure we only count appointments within the same clinic
    const appointmentCounts = await prisma.appointment.groupBy({
      by: ["patientId"],
      where: {
        userId: doctorId,
        patientId: { in: allPatientIds },
        deletedAt: null,
        patient: {
          clinicId: clinicId,
        },
      },
      _count: {
        _all: true,
      },
    });
    
    // Create a map for O(1) lookup
    const patientAppointmentCountMap = new Map(
      appointmentCounts.map((item) => [item.patientId, item._count._all])
    );

    // Add extra info to each appointment (no async needed now)
    function enrichAppointments(list: any[], isPast: boolean) {
      const enriched = list.map((appt) => {
        const appointmentCount = patientAppointmentCountMap.get(appt.patient.id) || 0;
        const isFirst = appointmentCount === 1;
        
        return {
          id: appt.id,
          patientName: appt.patient.name,
          patientId: appt.patient.id,
          doctorName: user?.name || "Unknown Doctor", // Add doctor name from the logged-in user
          doctorId: user?.id || 0, // Add doctor ID
          date: appt.doctorAvailability?.date,
          startTime: appt.doctorAvailability?.startTime,
          endTime: appt.doctorAvailability?.endTime,
          status: appt.status,
          paymentType: appt.payment?.paymentMethod || null,
          consultationType: appt.consultationType,
          isFirst: isFirst,
          prescriptionLink: isPast ? appt.prescriptionLink : undefined,
          prescriptionId: appt.prescription?.id || null, // Add prescription ID
          meetingRoomLink: user?.doctorProfile?.meetingRoomLink || null, // Add meetingRoomLink
          ownerToken1: user?.doctorProfile?.ownerToken1 || null, // Add ownerToken1
        };
      });
      
      // Sort by time within the same date (in-memory sorting for secondary sort)
      return enriched.sort((a, b) => {
        // First sort by date
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        const dateDiff = isPast ? dateB - dateA : dateA - dateB;
        
        if (dateDiff !== 0) return dateDiff;
        
        // Then sort by startTime
        const timeA = a.startTime || '';
        const timeB = b.startTime || '';
        return isPast ? timeB.localeCompare(timeA) : timeA.localeCompare(timeB);
      });
    }

    const upcomingEnriched = enrichAppointments(upcoming, false);
    const pastEnriched = enrichAppointments(past, true);

    return NextResponse.json({
      success: true,
      data: {
        upcoming: upcomingEnriched,
        past: pastEnriched,
      },
    });
  } catch (error) {
    console.error("Error fetching all doctor appointments:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/doctor/appointments/all'))(getAllAppointmentsHandler); 