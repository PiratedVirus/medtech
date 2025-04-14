import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { google } from "googleapis";

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
      // attendees: [{ email: "patient@example.com" }], // Optional
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          doctor: true,
          doctorAvailability: { select: { startTime: true, endTime: true } }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.count(),
    ]);
    
    // Extract unique doctor IDs for video consultations
    const videoDoctorIds = appointments
      .filter(app => app.consultationType === "Video")
      .map(app => app.doctorId);
    const uniqueDoctorIds = [...new Set(videoDoctorIds)];
    
    let doctorProfilesByUserId: { [key: number]: { meetingRoomLink: string; ownerToken1: string } } = {};
    if (uniqueDoctorIds.length) {
      const doctorProfiles = await prisma.doctorProfile.findMany({
        where: { userId: { in: uniqueDoctorIds } },
        select: { userId: true, meetingRoomLink: true, ownerToken1: true },
      });
      doctorProfilesByUserId = doctorProfiles.reduce((acc, profile) => {
        // @ts-ignore
        acc[profile.userId] = profile;
        return acc;
      }, {});
    }

    const transformedAppointments = appointments.map(appointment => {
      const { doctor, doctorAvailability, ...rest } = appointment;
      const additionalData =
        appointment.consultationType === "Video" && doctorProfilesByUserId[appointment.doctorId]
          ? {
              meetingRoomLink: doctorProfilesByUserId[appointment.doctorId].meetingRoomLink,
              ownerToken1: doctorProfilesByUserId[appointment.doctorId].ownerToken1,
            }
          : {};
      return {
        ...rest,
        doctorName: doctor.name,
        startTime: doctorAvailability.startTime,
        endTime: doctorAvailability.endTime,
        ...additionalData,
      };
    });

    return NextResponse.json({
      data: transformedAppointments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    data.doctorId = parseInt(data.doctorId, 10);
    data.patientId = parseInt(data.patientId, 10);
    data.doctorAvailabilityId = parseInt(data.doctorAvailabilityId, 10);
    const slot = {
      startTime: data.startTime,
      endTime: data.endTime,
      date: data.appointmentDate, // Changed to use correct field
    }


    // Ensure doctorAvailabilityId exists and is available
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: data.doctorAvailabilityId, status: "available" }
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
      status: "Scheduled",
      doctorId: data.doctorId,
      doctorAvailabilityId: data.doctorAvailabilityId,
      consultationType: data.consultationType, // Set consultationType from data
      patientId: data.patientId,
      appointmentDate: data.appointmentDate,
      fullName: data.patinetName,
      email: data.patientEmail,
      mobile: data.patientPhone,
      //@ts-ignore
      appointmentLink: meetLink,
    }
  });

  await prisma.doctorAvailability.update({
    where: { id: data.doctorAvailabilityId },
    data: { status: "booked" }
  });

    return NextResponse.json({ data: appointment, message: "Appointment created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create appointment: " + error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    console.log("Updating appointment with ID:", id, " with data :", data);
    data.patientId = parseInt(data.patientId, 10);
    data.doctorId = Number(JSON.parse(data.doctorId).doctorId);
    data.doctorAvailabilityId = parseInt(data.doctorAvailabilityId, 10);
    

    // Get existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { doctorAvailability: true }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Transaction for slot updates and appointment update
    const result = await prisma.$transaction(async (tx) => {
      // If changing time slot
      if (data.doctorAvailabilityId &&
        data.doctorAvailabilityId !== existingAppointment.doctorAvailabilityId) {
        // Mark old slot as available
        await tx.doctorAvailability.update({
          where: { id: existingAppointment.doctorAvailabilityId },
          data: { status: "available" }
        });

        // Check and update new slot
        const newAvailability = await tx.doctorAvailability.findUnique({
          where: { id: data.doctorAvailabilityId }
        });

        if (!newAvailability || newAvailability.status !== "available") {
          throw new Error("New slot is not available");
        }

        await tx.doctorAvailability.update({
          where: { id: data.doctorAvailabilityId },
          data: { status: "booked" }
        });
      }

      // Update appointment
      return await tx.appointment.update({
        where: { id },
        data: {
          status: data.status,
          doctorId: data.doctorId,
          doctorAvailabilityId: data.doctorAvailabilityId,
          consultationType: data.consultationType,
          patientId: data.patientId,
          
        }
      });
    });

    return NextResponse.json({ data: result, message: "Appointment updated successfully" });
  } catch (error: any) {
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
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}


