import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";

const getAllAppointmentsHandler = async (request: NextRequest) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
      include: { doctorProfile: true },
    });
    if (!user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const doctorId = user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const now = new Date();

    // Upcoming appointments
    const upcoming = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        doctorAvailability: {
          date: { gte: now }
        },
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Past appointments
    const past = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        doctorAvailability: {
          date: { lt: now }
        },
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Optimize: Get all unique patient IDs and check first appointments in a single query
    const allPatientIds = [...new Set([...upcoming, ...past].map(a => a.patient.id))];
    
    // Single query to get appointment counts per patient (to determine if first appointment)
    const appointmentCounts = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        userId: doctorId,
        patientId: { in: allPatientIds },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });
    
    // Create a map for O(1) lookup
    const patientAppointmentCountMap = new Map(
      appointmentCounts.map(item => [item.patientId, item._count.id])
    );

    // Add extra info to each appointment (no async needed now)
    function enrichAppointments(list: any[], isPast: boolean) {
      return list.map((appt) => {
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
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/doctor/appointments/all'))(getAllAppointmentsHandler); 