import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

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

    // Fetch upcoming appointments
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
    }));


    // Convert and sort upcoming appointments by time correctly
    const sortedUpcoming = upcomingAppointments.sort((a, b) => {
      const dateA = a.doctorAvailability.date ? new Date(a.doctorAvailability.date) : new Date();
      const dateB = b.doctorAvailability.date ? new Date(b.doctorAvailability.date) : new Date();

      // If dates are different, sort by date
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }

      // Convert startTime (e.g., "10:00 AM") to total minutes for sorting
      const convertTo24Hour = (timeStr: string) => {
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes; // Convert to total minutes
      };

      const timeA = convertTo24Hour(a.doctorAvailability.startTime);
      const timeB = convertTo24Hour(b.doctorAvailability.startTime);

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
      where: { ...baseWhere, appointmentDate: { lt: new Date() } }, // Past appointments
      select: {
        id: true,
        appointmentFor: true,
        fullName: true,
        mobile: true,
        email: true,
        appointmentDate: true,
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
      orderBy: [{ appointmentDate: "desc" }], // Most recent past appointment first
    });

    const pastAppointments = pastAppointmentsWithoutMeetRoomLink.map((appointment) => ({
      ...appointment,
      appointmentLink: appointment.doctor.doctorProfile?.meetingRoomLink || null, // Use meetingRoomLink
    }));

    return NextResponse.json({
      success: true,
      data: {
        past: pastAppointments,
        upcoming: sortedUpcoming,
      },
    });

  } catch (error) {
    console.error("Error fetching appointments:");
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments", details: error },
      { status: 500 }
    );
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

    const consultationType = consultationMode === "video" ? "Video" : "Physical";

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
          appointmentDate: slot.date ? new Date(slot.date) : null,
          consultationType,
          status: "Scheduled",
          isDietician,
          subscriptionId,
        },
      });

      // Update subscription tracker if using plan
      if (paymentMethod === "plan") {
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
        data: { status: "booked" },
      });

      // Create payment record if online
      if (paymentMethod === "online" && razorpayResponse) {
        await tx.payment.create({
          data: {
            appointmentId: appointment.id,
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            amount: razorpayResponse.amount,
            currency: razorpayResponse.currency || "INR",
            paymentStatus: "Paid",
            paymentMethod: razorpayResponse.method || "upi",
          },
        });
      }

      if(paymentMethod === "clinic") {
        await tx.payment.create({
          data: {
            appointmentId: appointment.id,
            amount: doctorConsultationFee,
            currency: "INR",
            paymentStatus: "Pending",
            paymentMethod: "offline",
          },
        });
      }

      return appointment;
    });
    console.log("Transaction completed successfully, appointment ID:", newAppointment.id);

    return NextResponse.json({ success: true, data: newAppointment });

  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment", details: error || error },
      { status: 500 }
    );
  }
}