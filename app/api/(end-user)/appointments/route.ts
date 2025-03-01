import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/appointments
 * Retrieves all appointments, including nested data.
 */




export async function GET(request: NextRequest) {
  try {
    // 1) Parse Query Params
    const { searchParams } = new URL(request.url);
    const clinicIdParam = searchParams.get("clinicId");
    const patientIdParam = searchParams.get("patientId");

    // Convert them to numbers if they exist
    const clinicId = clinicIdParam ? parseInt(clinicIdParam, 10) : undefined;
    const patientId = patientIdParam ? parseInt(patientIdParam, 10) : undefined;

    // 2) Build 'where' clause for filtering
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }
    if (clinicId) {
      // Filter by the doctor's clinicId (adjust if you need the patient's clinicId instead)
      where.doctor = { clinicId };
    }

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
          select: { type: true }, // e.g. "Video" / "Physical"
        },
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
      orderBy: { appointmentDate: "asc" },
    });

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
    }));

    // 5) Separate into 'past' vs 'upcoming' based on current time
    const now = new Date();

    const past = transformed.filter(
      (appt) => appt.appointmentDate && new Date(appt.appointmentDate) < now
    );
    const upcoming = transformed.filter(
      (appt) => appt.appointmentDate && new Date(appt.appointmentDate) >= now
    );

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
    const body = await request.json();
    console.log("Creating appointment with data:", body);

    // Destructure your needed fields
    const {
      appointmentFor,
      fullName,
      mobile,
      email,
      slot,             // { id, doctorId, date, startTime, endTime }
      doctorId,
      patientId,
      consultationTypeId,
      paymentOption,
    } = body;

    // Validate required fields for your schema
    // In your schema: patientId, doctorId, consultationTypeId, doctorAvailabilityId, and status are required
    if (!patientId || !doctorId || !slot?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: patientId, doctorId, slot.id",
        },
        { status: 400 }
      );
    }

    // If no consultationType is provided, default to 1 or some known ID
    const finalConsultationTypeId = consultationTypeId ?? 1;

    // Create the new appointment in Prisma
    const newAppointment = await prisma.appointment.create({
      data: {
        patientId: patientId,
        doctorId: doctorId,
        consultationTypeId: finalConsultationTypeId,
        doctorAvailabilityId: slot.id,

        // Additional optional fields
        appointmentFor,
        fullName,
        mobile,
        email,

        // For historical data, store the chosen date/time from the slot
        appointmentDate: slot.date ? new Date(slot.date) : null,

        // Set default "Scheduled" status if not otherwise determined
        status: "Scheduled",
      },
      include: {
        doctorAvailability: true, // Include related availability if you want in response
      },
    });

    return NextResponse.json({ success: true, data: newAppointment });
  } catch (error) {
    console.error("Error creating appointment:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}