import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";

const getUpcomingAppointmentsHandler = async () => {
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
      include: { 
        doctorProfile: true,
        dieticianProfile: true 
      },
    });

    // Allow doctors and dietitians (dietitians can have doctorProfile with isDietician: true, or dieticianProfile, or role: DIETICIAN)
    const isDoctor = user?.doctorProfile?.id;
    const isDietician = user?.dieticianProfile?.id || user?.role === 'DIETICIAN' || user?.doctorProfile?.isDietician;
    
    if (!isDoctor && !isDietician) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = user.id;

    // Start of current day to avoid timezone drift when @db.Date is used
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // First, get available doctor availability IDs for today and future dates
    const availableSlots = await prisma.doctorAvailability.findMany({
      where: {
        userId: doctorId,
        date: { gte: todayStart },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const availabilityIds = availableSlots.map(slot => slot.id);

    if (availabilityIds.length === 0) {
      return NextResponse.json({ success: true, data: { appointments: [] } });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        doctorAvailabilityId: {
          in: availabilityIds,
        },
        // Only scheduled-like statuses; exclude completed/cancelled
        status: {
          in: [
            'Scheduled', 'SCHEDULED',
            'Pending', 'PENDING',
            'Confirmed', 'CONFIRMED'
          ]
        },
        deletedAt: null,
      },
      include: {
        patient: { select: { name: true } },
        payment: {
          select: {
            amount: true,
            paymentStatus: true,
          },
        },
        doctorAvailability: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        {
          doctorAvailability: {
            date: "asc",
          },
        },
        {
          doctorAvailability: {
            startTime: "asc",
          },
        },
      ],
      take: 5, // Limit to 5 upcoming appointments
    });

    // Transform the appointments to match the expected interface
    const transformedAppointments = appointments
      .filter((appointment) => {
        // Safely check if doctorAvailability exists and has required fields
        return appointment.doctorAvailability !== null && 
               appointment.doctorAvailability.date !== null &&
               appointment.doctorAvailability.date !== undefined;
      })
      .map((appointment) => {
        const availability = appointment.doctorAvailability;
        if (!availability || !availability.date) {
          // This should not happen due to filter, but TypeScript needs this
          throw new Error('Invalid appointment: missing doctorAvailability');
        }
        
        return {
          id: appointment.id,
          patientId: appointment.patientId,
          patient: appointment.patient,
          doctor: { name: user.name || 'Doctor' }, // Add doctor info with fallback
          // Use doctorAvailability.date as source of truth for date
          date: availability.date instanceof Date 
            ? availability.date.toISOString() 
            : new Date(availability.date).toISOString(),
          startTime: availability.startTime,
          endTime: availability.endTime,
          status: appointment.status,
          consultationType: appointment.consultationType,
          doctorAvailability: availability,
          payment: appointment.payment
            ? {
                amount: appointment.payment.amount,
                status: appointment.payment.paymentStatus,
              }
            : null,
        };
      });

    return NextResponse.json({ 
      success: true, 
      data: { appointments: transformedAppointments } 
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/doctor/appointments/upcoming'))(getUpcomingAppointmentsHandler); 