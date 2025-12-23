import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ConsultationType } from "@/lib/constants/enums";
import { normalizeStatus } from "@/lib/utils/status";
import { google } from "googleapis";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";
import { invalidateAppointmentsCache } from "@/lib/data-cache";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN!;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

const createGoogleMeetLink = async (slot: any, doctorId: number, patientId: number) => {
  try {
    console.log("Creating Google Meet link for slot:", slot);
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

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
};

// Optimized appointments API with proper includes to avoid N+1 queries
export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where: {
          doctor: userClinicFilter.user
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              doctorProfile: {
                select: { 
                  meetingRoomLink: true, 
                  ownerToken1: true 
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              name: true,
              phoneNumber: true
            }
          },
          doctorAvailability: { 
            select: { 
              date: true, 
              startTime: true, 
              endTime: true 
            } 
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.count({
        where: {
          doctor: userClinicFilter.user
        }
      }),
    ]);

    // Transform appointments with meeting links already included
    const transformedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      patient: appointment.patient,
      doctor: appointment.doctor,
      consultationType: appointment.consultationType,
      status: appointment.status,
      isDietician: appointment.isDietician,
      prescriptionLink: appointment.prescriptionLink,
      appointmentFor: appointment.appointmentFor,
      doctorAvailability: appointment.doctorAvailability,
      // Add the fields that the frontend expects
      fullName: appointment.patient?.name || '',
      doctorName: appointment.doctor?.name || '',
      userId: appointment.doctor?.id || null,
      doctorAvailabilityId: appointment.doctorAvailabilityId,
      startTime: appointment.doctorAvailability?.startTime || '',
      endTime: appointment.doctorAvailability?.endTime || '',
      // Meeting room info is now included in the initial query
      meetingRoomLink: appointment.consultationType === ConsultationType.VIDEO 
        ? appointment.doctor?.doctorProfile?.meetingRoomLink 
        : null,
      ownerToken1: appointment.consultationType === ConsultationType.VIDEO 
        ? appointment.doctor?.doctorProfile?.ownerToken1 
        : null,
      createdAt: appointment.createdAt,
    }));

    return NextResponse.json({
      data: transformedAppointments || [],
      total: total || 0,
      page,
      pageSize,
      totalPages: Math.ceil((total || 0) / pageSize),
    });
  } catch (error) {
    console.error("Optimized appointments query error:", error);
    return NextResponse.json({ 
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      error: "Failed to fetch appointments" 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    data.doctorId = parseInt(data.doctorId, 10);
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: data.doctorId },
      select: { type: true }
    });
    
    const isDietician = doctorProfile?.type === "dietician";
    data.patientId = parseInt(data.patientId, 10);
    data.doctorAvailabilityId = parseInt(data.doctorAvailabilityId, 10);
    const slot = {
      startTime: data.startTime,
      endTime: data.endTime,
      date: data.doctorAvailability?.date, // Use doctorAvailability date
    }

    // Ensure doctorAvailabilityId exists and is available
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: data.doctorAvailabilityId, status: "AVAILABLE" }
    });

    if (!availability) {
      return NextResponse.json({ error: "Invalid or unavailable appointment slot" }, { status: 400 });
    }
    let meetLink = null;
    if (data.consultationType === 'Video') {
      console.log("Creating Google Meet link...");
      meetLink = await createGoogleMeetLink(slot, data.doctorId, data.patientId);
      console.log("Google Meet link created:", meetLink);
    }
    data.meetLink = meetLink;

    const appointment = await prisma.appointment.create({
      data: {
        status: "SCHEDULED",
        userId: data.doctorId,
        doctorAvailabilityId: data.doctorAvailabilityId,
        consultationType: data.consultationType, // Set consultationType from data
        patientId: data.patientId,
        fullName: data.patinetName,
        email: data.patientEmail,
        mobile: data.patientPhone,
        //@ts-ignore
        appointmentLink: meetLink,
        isDietician,
      }
    });

    await prisma.doctorAvailability.update({
      where: { id: data.doctorAvailabilityId },
      data: { status: "BOOKED" }
    });

    // Invalidate appointments cache for the patient
    try {
      await invalidateAppointmentsCache(data.patientId);
      console.log(`[ADMIN-OPTIMIZED-APPOINTMENT] Appointments cache invalidated for patient ${data.patientId} after appointment creation`);
    } catch (cacheError) {
      console.error('[ADMIN-OPTIMIZED-APPOINTMENT] Error invalidating appointments cache:', cacheError);
    }

    return NextResponse.json({ data: appointment, message: "Appointment created successfully" });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json({ error: "Failed to create appointment: " + error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // Handle both 'id' and 'appointmentId' for backward compatibility
    const appointmentId = body.id || body.appointmentId;
    const { link, ...data } = body;
    
    console.log("Updating appointment with ID:", appointmentId, " with data :", { ...data, hasLink: !!link });
    
    // Get existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        doctorAvailability: true,
        prescription: true,
        patient: true
      }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Handle prescription upload (when 'link' is provided)
    if (link) {
      console.log(`[ADMIN-PRESCRIPTION-UPLOAD] Updating prescription link for appointment ${appointmentId}`);
      
      // Update appointment with prescription link
      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          prescriptionLink: link,
          ...(data.status ? { status: normalizeStatus(data.status) } : {})
        }
      });

      // Trigger AI analysis if prescription exists
      if (existingAppointment.prescription?.id) {
        console.log(`[ADMIN-PRESCRIPTION-UPLOAD] Triggering AI processing for prescription ${existingAppointment.prescription.id}`);
        
        // Trigger background processing asynchronously
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        fetch(`${baseUrl}/api/prescription/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: appointmentId,
            pdfUrl: link,
            patientId: existingAppointment.patientId,
            prescriptionId: existingAppointment.prescription.id
          }),
        }).catch(error => {
          console.error(`[ADMIN-PRESCRIPTION-UPLOAD] Background processing trigger failed:`, error);
          // Don't fail the upload if background processing fails
        });
        
        console.log(`[ADMIN-PRESCRIPTION-UPLOAD] Background processing triggered for prescription ${existingAppointment.prescription.id}`);
      } else {
        console.log(`[ADMIN-PRESCRIPTION-UPLOAD] No prescription record found for appointment ${appointmentId}, skipping AI analysis`);
      }

      return NextResponse.json({ data: updated, message: "Prescription uploaded successfully" });
    }

    // Handle regular appointment updates (status, doctor, time slot, etc.)
    if (data.patientId) data.patientId = parseInt(data.patientId, 10);
    if (data.doctorId) {
      data.doctorId = typeof data.doctorId === 'string' ? Number(JSON.parse(data.doctorId).doctorId) : Number(data.doctorId);
    }
    if (data.doctorAvailabilityId) data.doctorAvailabilityId = parseInt(data.doctorAvailabilityId, 10);

    // Transaction for slot updates and appointment update
    const result = await prisma.$transaction(async (tx) => {
      // If changing time slot
      if (data.doctorAvailabilityId &&
        data.doctorAvailabilityId !== existingAppointment.doctorAvailabilityId) {
        // Mark old slot as available
        await tx.doctorAvailability.update({
          where: { id: existingAppointment.doctorAvailabilityId },
          data: { status: "AVAILABLE" }
        });

        // Check and update new slot
        const newAvailability = await tx.doctorAvailability.findUnique({
          where: { id: data.doctorAvailabilityId }
        });

        if (!newAvailability || newAvailability.status !== "AVAILABLE") {
          throw new Error("New slot is not available");
        }

        await tx.doctorAvailability.update({
          where: { id: data.doctorAvailabilityId },
          data: { status: "BOOKED" }
        });
      }

      // Update appointment
      const updateData: any = {};
      if (data.status) updateData.status = normalizeStatus(data.status);
      if (data.doctorId) updateData.userId = data.doctorId;
      if (data.doctorAvailabilityId) updateData.doctorAvailabilityId = data.doctorAvailabilityId;
      if (data.consultationType) updateData.consultationType = data.consultationType;
      if (data.patientId) updateData.patientId = data.patientId;

      return await tx.appointment.update({
        where: { id: appointmentId },
        data: updateData
      });
    });

    return NextResponse.json({ data: result, message: "Appointment updated successfully" });
  } catch (error: any) {
    console.error("Failed to update appointment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    
    if (!id) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 });
    }

    // Get appointment to find the slot to free up
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctorAvailability: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Transaction to delete appointment and free up slot
    await prisma.$transaction(async (tx) => {
      // Delete the appointment
      await tx.appointment.delete({
        where: { id }
      });

      // Mark the slot as available again
      await tx.doctorAvailability.update({
        where: { id: appointment.doctorAvailabilityId },
        data: { status: "AVAILABLE" }
      });
    });

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}
