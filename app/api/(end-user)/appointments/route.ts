import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCachedAppointments, invalidateAppointmentsCache } from "@/lib/data-cache";
import { AppointmentStatus, ConsultationType } from "@/lib/constants/enums";
import { SmartCacheInvalidation } from "@/lib/cache-dependencies";

/**
 * GET /api/appointments
 * Retrieves all appointments, including nested data.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/appointments called");

    // Parse Query Params
    const { searchParams } = new URL(request.url);
    const clinicIdParam = searchParams.get("clinicId");
    const patientIdParam = searchParams.get("patientId");
    const upcomingOnly = searchParams.get("upcomingOnly") === "true"; // Convert to boolean

    console.log("Query Params:", { clinicIdParam, patientIdParam, upcomingOnly });

    // Convert params to numbers if they exist
    const clinicId = clinicIdParam ? parseInt(clinicIdParam, 10) : undefined;
    const patientId = patientIdParam ? parseInt(patientIdParam, 10) : undefined;

    // Build 'where' clause for filtering
    const baseWhere: any = {};
    if (patientId) baseWhere.patientId = patientId;
    if (clinicId) baseWhere.doctor = { clinicId };

    // Use Redis cache for appointments if patientId is provided
    if (patientId) {
      const cachedData = await getCachedAppointments(patientId, upcomingOnly);
      return NextResponse.json({
        success: true,
        upcomingAppointments: cachedData?.upcomingAppointments || [],
        pastAppointments: cachedData?.pastAppointments || [],
        totalUpcoming: cachedData?.upcomingAppointments?.length || 0,
        totalPast: cachedData?.pastAppointments?.length || 0
      });
    }

    // Fetch upcoming appointments (fallback for non-patient queries)
    const upcomingAppointmentsWithoutMeetRoomLink = await prisma.appointment.findMany({
      where: { 
        ...baseWhere, 
        doctorAvailability: {
          date: { gte: new Date() }
        }
      },
      select: {
        id: true,
        appointmentFor: true,
        fullName: true,
        mobile: true,
        email: true,
        status: true,
        consultationType: true, // Use consultationType directly
        appointmentLink: true,
        patient: { select: { id: true, name: true, phoneNumber: true, clinicId: true } },
        doctor: {
          select: {
            id: true,
            name: true,
            clinicId: true,
            doctorProfile: {
              select: {
                meetingRoomLink: true, // Fetch the meetingRoomLink
              },
            },
          }
        },
        doctorAvailability: {
          select: { id: true, userId: true, date: true, startTime: true, endTime: true },
        },
      },
      orderBy: [{ doctorAvailability: { date: "asc" } }],
    });

    const upcomingAppointments = upcomingAppointmentsWithoutMeetRoomLink.map((appointment) => ({
      ...appointment,
      appointmentLink: appointment.doctor.doctorProfile?.meetingRoomLink || null, // Use meetingRoomLink
      // Add top-level date and startTime for compatibility
      date: appointment.doctorAvailability.date.toISOString(),
      startTime: appointment.doctorAvailability.startTime,
    }));


    // Convert and sort upcoming appointments by time correctly
    const sortedUpcoming = upcomingAppointments.sort((a, b) => {
      const dateA = a.doctorAvailability.date ? new Date(a.doctorAvailability.date) : new Date();
      const dateB = b.doctorAvailability.date ? new Date(b.doctorAvailability.date) : new Date();

      // If dates are different, sort by date
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }

      // Convert startTime (either HH:MM or HH:MM AM/PM) to total minutes for sorting
      const toMinutes = (ts: string) => {
        const m12 = ts.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (m12) {
          let h = parseInt(m12[1], 10);
          const mm = parseInt(m12[2], 10);
          const ap = m12[3].toUpperCase();
          if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
          return h * 60 + mm;
        }
        const m24 = ts.match(/^([01]?\d|2[0-3]):(\d{2})$/);
        if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
        return 0;
      };

      const timeA = toMinutes(a.doctorAvailability.startTime);
      const timeB = toMinutes(b.doctorAvailability.startTime);

      return timeA - timeB; // Sort by startTime within the same date
    });

    // If `upcomingOnly=true`, return only the first upcoming appointment but keep the same response structure
    if (upcomingOnly) {
      return NextResponse.json({
        success: true,
        data: sortedUpcoming.length > 0 ? sortedUpcoming[0] : null,
      });
    }

    // Fetch past appointments
    const pastAppointmentsWithoutMeetRoomLink = await prisma.appointment.findMany({
      where: { ...baseWhere, doctorAvailability: { date: { lt: new Date() } } }, // Past appointments
      select: {
        id: true,
        appointmentFor: true,
        fullName: true,
        mobile: true,
        email: true,
        prescriptionLink: true,
        status: true,
        consultationType: true, // Use consultationType directly
        appointmentLink: true,
        patient: { select: { id: true, name: true, phoneNumber: true, clinicId: true } },
        doctor: {
          select: {
            id: true,
            name: true,
            clinicId: true,
            doctorProfile: {
              select: {
                meetingRoomLink: true, // Fetch the meetingRoomLink
              },
            },
          }
        },
        doctorAvailability: {
          select: { id: true, userId: true, date: true, startTime: true, endTime: true },
        },
      },
      orderBy: [{ doctorAvailability: { date: "desc" } }], // Most recent past appointment first
    });

    const pastAppointments = pastAppointmentsWithoutMeetRoomLink.map((appointment) => ({
      ...appointment,
      appointmentLink: appointment.doctor.doctorProfile?.meetingRoomLink || null, // Use meetingRoomLink
      // Add top-level date and startTime for compatibility
      date: appointment.doctorAvailability.date.toISOString(),
      startTime: appointment.doctorAvailability.startTime,
    }));

    return NextResponse.json({
      success: true,
      data: {
        past: pastAppointments || [],
        upcoming: sortedUpcoming || [],
      },
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch appointments",
      data: {
        past: [],
        upcoming: []
      },
      upcomingAppointments: [],
      pastAppointments: [],
      totalUpcoming: 0,
      totalPast: 0
    }, { status: 500 });
  }
}

/**
 * POST /api/appointments
 * Creates a new appointment referencing DoctorAvailability.
 * Expects JSON body like:
 * {
 *   "appointmentFor": "self",
 *   "fullName": "Sara Ali",
 *   "mobile": "+918149306224",
 *   "email": "a@a.com",
 *   "slot": {
 *     "id": 119,
 *     "doctorId": 1,
 *     "date": "2025-02-28T19:07:34.082Z",
 *     "startTime": "10:00 AM",
 *     "endTime": "10:30 AM"
 *   },
 *   "doctorId": 1,
 *   "patientId": 4,
 *   "paymentMethod": "online"
 * }
 */
export async function POST(request: Request) {
  try {
    console.log("POST /api/appointments called");
    const body = await request.json();
    console.log("Request body:", body);

    const {
      appointmentFor,
      fullName,
      mobile,
      email,
      slot,
      doctorId,
      patientId,
      consultationMode,
      paymentMethod,
      razorpayResponse,
      subscriptionId,
      isDietician,
      doctorConsultationFee,
      doctorConsultationDates
    } = body;

    const consultationType = consultationMode === "video" ? ConsultationType.VIDEO : ConsultationType.PHYSICAL;

    if (!patientId || !doctorId || !slot?.id) {
      console.error("Missing required fields", { patientId, doctorId, slot });
      return NextResponse.json(
        { success: false, error: "Missing required fields: patientId, doctorId, slot.id" },
        { status: 400 }
      );
    }

    // Wrap all DB actions in a transaction
    const newAppointment = await prisma.$transaction(async (tx) => {
      // Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          patientId,
          userId: doctorId,
          doctorAvailabilityId: slot.id,
          appointmentFor,
          fullName,
          mobile,
          email,
          consultationType,
          status: AppointmentStatus.SCHEDULED,
          isDietician,
          subscriptionId,
        },
      });

      // Update subscription tracker if using plan
      if (paymentMethod === "PLAN") {
        await tx.subscriptionTracker.update({
          where: { subscriptionId },
          data: isDietician
            ? { dieticianConsultationDates: doctorConsultationDates }
            : { doctorConsultationDates: doctorConsultationDates },
        });
      }

      // Mark the slot as booked
      await tx.doctorAvailability.update({
        where: { id: slot.id },
        data: { status: "BOOKED" },
      });

      // Create payment record if online
      if (paymentMethod === "ONLINE" && razorpayResponse) {
        await tx.payment.create({
          data: {
            appointmentId: appointment.id,
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            amount: razorpayResponse.amount,
            currency: razorpayResponse.currency || "INR",
            paymentStatus: "PAID",
            paymentMethod: razorpayResponse.method || "upi",
          },
        });
      }

      if(paymentMethod === "CLINIC") {
        await tx.payment.create({
          data: {
            appointmentId: appointment.id,
            amount: doctorConsultationFee,
            currency: "INR",
            paymentStatus: "PENDING",
            paymentMethod: "offline",
          },
        });
      }

      return appointment;
    });
    console.log("Transaction completed successfully, appointment ID:", newAppointment.id);

    // ✅ HIGH PRIORITY: Smart cache invalidation with dependencies
    try {
      await SmartCacheInvalidation.onAppointmentUpdate(patientId, doctorId);
      console.log(`[APPOINTMENT] Smart cache invalidation completed for patient ${patientId}`);
    } catch (cacheError) {
      console.error('[APPOINTMENT] Error in smart cache invalidation:', cacheError);
      // Fallback to basic cache invalidation
      try {
        await invalidateAppointmentsCache(patientId);
        console.log(`[APPOINTMENT] Fallback cache invalidation completed for patient ${patientId}`);
      } catch (fallbackError) {
        console.error('[APPOINTMENT] Fallback cache invalidation also failed:', fallbackError);
      }
    }

    return NextResponse.json({ success: true, data: newAppointment });

  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment", details: error || error },
      { status: 500 }
    );
  }
}