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

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        doctorAvailability: {
          date: { gte: todayStart },
          deletedAt: null, // Ensure availability is not deleted
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
      .filter((appointment) => appointment.doctorAvailability !== null) // Filter out appointments without availability
      .map((appointment) => ({
        id: appointment.id,
        patientId: appointment.patientId,
        patient: appointment.patient,
        doctor: { name: user.name }, // Add doctor info
        // Use doctorAvailability.date as source of truth for date
        date: appointment.doctorAvailability!.date.toISOString(),
        startTime: appointment.doctorAvailability!.startTime,
        endTime: appointment.doctorAvailability!.endTime,
        status: appointment.status,
        consultationType: appointment.consultationType,
        doctorAvailability: appointment.doctorAvailability!,
        payment: appointment.payment
          ? {
              amount: appointment.payment.amount,
              status: appointment.payment.paymentStatus,
            }
          : null,
      }));

    return NextResponse.json({ appointments: transformedAppointments });
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