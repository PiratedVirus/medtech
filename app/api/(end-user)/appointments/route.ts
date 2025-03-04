import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";

const prisma = new PrismaClient();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN!;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function createGoogleMeetLink(slot: any, doctorId: number, patientId: number) {
  try {
    console.log("Creating Google Meet link for slot:", slot);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startDateTime = new Date(slot.date);
    startDateTime.setHours(
      parseInt(slot.startTime.split(":")[0], 10),
      parseInt(slot.startTime.split(":")[1], 10)
    );

    const endDateTime = new Date(slot.date);
    endDateTime.setHours(
      parseInt(slot.endTime.split(":")[0], 10),
      parseInt(slot.endTime.split(":")[1], 10)
    );

    const event = {
      summary: "Doctor Consultation",
      description: `Consultation with Doctor ID: ${doctorId}`,
      start: { dateTime: startDateTime.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: endDateTime.toISOString(), timeZone: "Asia/Kolkata" },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      attendees: [{ email: "patient@example.com" }], // Optional
    };

    console.log("Event payload for Google Calendar:", event);

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: event,
    });

    console.log("Google Meet link created:", response.data.hangoutLink);
    return response.data.hangoutLink || null;
  } catch (error) {
    console.error("Error creating Google Meet link:", error);
    return null;
  }
}

/**
 * GET /api/appointments
 * Retrieves all appointments, including nested data.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/appointments called");

    // 1) Parse Query Params
    const { searchParams } = new URL(request.url);
    const clinicIdParam = searchParams.get("clinicId");
    const patientIdParam = searchParams.get("patientId");
    console.log("Query Params:", { clinicIdParam, patientIdParam });

    // Convert them to numbers if they exist
    const clinicId = clinicIdParam ? parseInt(clinicIdParam, 10) : undefined;
    const patientId = patientIdParam ? parseInt(patientIdParam, 10) : undefined;

    // 2) Build 'where' clause for filtering
    const where: any = {};
    if (patientId) {
      where.patientId = patientId;
    }
    if (clinicId) {
      where.doctor = { clinicId };
    }
    console.log("Constructed where clause for Prisma:", where);

    // 3) Query the fields we need
    const rawAppointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        appointmentFor: true,
        fullName: true,
        mobile: true,
        email: true,
        appointmentDate: true,
        status: true,
        consultationType: {
          select: { type: true },
        },
        appointmentLink: true,
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            clinicId: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            clinicId: true,
          },
        },
        doctorAvailability: {
          select: {
            id: true,
            doctorId: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        { doctor: { id: "asc" } }, // Then order by doctor ID
        { appointmentDate: "asc" }, // Order by date first
        { doctorAvailability: { startTime: "asc" } } // Finally, order by start time
      ],
    });
    console.log("Raw appointments fetched:", rawAppointments.length);

    // 4) Transform each record to the shape you want
    const transformed = rawAppointments.map((appt) => ({
      id: appt.id,
      patient: appt.patient,
      doctor: appt.doctor,
      doctorAvailability: appt.doctorAvailability,
      appointmentFor: appt.appointmentFor,
      fullName: appt.fullName,
      mobile: appt.mobile,
      email: appt.email,
      appointmentDate: appt.appointmentDate,
      status: appt.status,
      consultationType: appt.consultationType?.type || null,
      appointmentLink: appt.appointmentLink,
    }));
    console.log("Transformed appointments:", transformed);

    // 5) Separate into 'past' vs 'upcoming' based on current time
    const now = new Date();
    const past = transformed.filter(
      (appt) => appt.appointmentDate && new Date(appt.appointmentDate) < now
    );
    const upcoming = transformed.filter(
      (appt) => appt.appointmentDate && new Date(appt.appointmentDate) >= now
    );
    console.log("Appointments split - Past:", past.length, "Upcoming:", upcoming.length);

    // 6) Return the final result with both arrays
    return NextResponse.json({
      success: true,
      data: {
        past,
        upcoming,
      },
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
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
 *   "paymentOption": "online"
 *   // optionally "consultationTypeId"
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
      consultationTypeId,
      paymentOption,
      razorpayResponse,
    } = body;

    if (!patientId || !doctorId || !slot?.id) {
      console.error("Missing required fields", { patientId, doctorId, slot });
      return NextResponse.json(
        { success: false, error: "Missing required fields: patientId, doctorId, slot.id" },
        { status: 400 }
      );
    }

    // Default consultation type if not provided
    const finalConsultationTypeId = consultationTypeId ?? 1;
    console.log("Final consultation type:", finalConsultationTypeId);

    // Google Meet link for online consultations
    let meetLink = null;
    if (finalConsultationTypeId !== 1) {
      console.log("Creating Google Meet link...");
      meetLink = await createGoogleMeetLink(slot, doctorId, patientId);
      console.log("Google Meet link created:", meetLink);
    }

    // ✅ First, create the appointment
    const newAppointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        consultationTypeId: finalConsultationTypeId,
        doctorAvailabilityId: slot.id,
        appointmentFor,
        fullName,
        mobile,
        email,
        appointmentDate: slot.date ? new Date(slot.date) : null,
        appointmentLink: meetLink,
        status: "Scheduled",
      },
    });

    console.log("Appointment created successfully with ID:", newAppointment.id);

    // ✅ Second, update Doctor Availability status
    await prisma.doctorAvailability.update({
      where: { id: slot.id },
      data: { status: "booked" },
    });

    // ✅ Third, create the Payment (only if online)
    if (paymentOption === "online" && razorpayResponse) {
      console.log("Creating payment record...");
      await prisma.payment.create({
        data: {
          appointmentId: newAppointment.id, // ✅ Now we have the appointmentId
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          amount: razorpayResponse.amount,
          currency: razorpayResponse.currency || "INR",
          paymentStatus: "Paid",
          paymentMethod: razorpayResponse.method || "upi",
        },
      });
      console.log("Payment record created.");
    } else {
      console.log("Skipping payment record as payment option is not online.");
    }

    console.log("Transaction completed successfully.");
    return NextResponse.json({ success: true, data: newAppointment });

  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment", details: error || error },
      { status: 500 }
    );
  }
}