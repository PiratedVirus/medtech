import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { writeFile } from "fs/promises";
import { join } from "path";

// Local type definitions instead of importing from @prisma/client
const VALID_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
type AppointmentStatus = typeof VALID_STATUSES[number];

const VALID_CONSULTATION_TYPES = ["VIDEO", "IN_PERSON"] as const;
type ConsultationType = typeof VALID_CONSULTATION_TYPES[number];

type AppointmentListType = "upcoming" | "past";

// Helper function to verify doctor token and get profile
async function verifyDoctorToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      plusAddedPhoneNumber: string;
      role: string;
    };

    if (!decoded.plusAddedPhoneNumber || decoded.role !== "DOCTOR") {
      return null;
    }

    const doctor = await prisma.user.findFirst({
      where: {
        phoneNumber: decoded.plusAddedPhoneNumber,
        role: "DOCTOR",
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        doctorProfile: true,
      },
    });

    return doctor;
  } catch (error) {
    console.error("Error verifying doctor token:", error);
    return null;
  }
}

// GET /api/doctor/appointments/manage?type=upcoming|past
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token?.value) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await verifyDoctorToken(token.value);
    if (!doctor?.doctorProfile) {
      return new NextResponse("Doctor profile not found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as AppointmentListType;

    if (!type || !["upcoming", "past"].includes(type)) {
      return new NextResponse("Invalid appointment type", { status: 400 });
    }

    const now = new Date();
    const where = {
      doctorId: doctor.doctorProfile.id,
      deletedAt: null,
      ...(type === "upcoming"
        ? {
            appointmentDate: {
              gte: now,
            },
            status: {
              in: ["PENDING", "CONFIRMED"] as AppointmentStatus[],
            },
          }
        : {
            appointmentDate: {
              lt: now,
            },
            status: {
              in: ["COMPLETED", "CANCELLED"] as AppointmentStatus[],
            },
          }),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
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
          appointmentDate: type === "upcoming" ? "asc" : "desc",
        },
        {
          doctorAvailability: {
            startTime: type === "upcoming" ? "asc" : "desc",
          },
        },
      ],
    });

    return NextResponse.json(appointments.map((appointment) => ({
      id: appointment.id,
      patient: appointment.patient,
      date: appointment.doctorAvailability.date.toISOString(),
      startTime: appointment.doctorAvailability.startTime,
      endTime: appointment.doctorAvailability.endTime,
      status: appointment.status,
      consultationType: appointment.consultationType,
      meetingRoomLink: doctor.doctorProfile?.meetingRoomLink,
      prescriptionLink: appointment.prescriptionLink,
      payment: appointment.payment
        ? {
            amount: appointment.payment.amount,
            status: appointment.payment.paymentStatus,
          }
        : null,
    })));
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT /api/doctor/appointments/manage?action=status
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token?.value) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await verifyDoctorToken(token.value);
    if (!doctor?.doctorProfile) {
      return new NextResponse("Doctor profile not found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "status") {
      const { appointmentId, status } = await request.json();

      if (!appointmentId || typeof appointmentId !== "number") {
        return new NextResponse("Invalid appointment ID", { status: 400 });
      }

      if (!status || !VALID_STATUSES.includes(status as AppointmentStatus)) {
        return new NextResponse("Invalid status", { status: 400 });
      }

      // Verify that the appointment belongs to this doctor
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          doctorId: doctor.doctorProfile.id,
          deletedAt: null,
        },
      });

      if (!appointment) {
        return new NextResponse("Appointment not found", { status: 404 });
      }

      // Update the appointment status
      const updatedAppointment = await prisma.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: status as AppointmentStatus,
        },
      });

      return NextResponse.json(updatedAppointment);
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/doctor/appointments/manage?action=prescription
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token?.value) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await verifyDoctorToken(token.value);
    if (!doctor?.doctorProfile) {
      return new NextResponse("Doctor profile not found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "prescription") {
      const formData = await request.formData();
      const appointmentId = formData.get("appointmentId");
      const notes = formData.get("notes");
      const file = formData.get("file") as File | null;

      if (!appointmentId || !notes) {
        return new NextResponse("Missing required fields", { status: 400 });
      }

      // Verify that the appointment belongs to this doctor and is completed
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: Number(appointmentId),
          doctorId: doctor.doctorProfile.id,
          status: "COMPLETED",
          deletedAt: null,
        },
      });

      if (!appointment) {
        return new NextResponse("Appointment not found or not completed", { status: 404 });
      }

      let prescriptionLink: string | null = null;

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const timestamp = Date.now();
        const filename = `${appointmentId}_${timestamp}_${file.name}`;
        const uploadDir = join(process.cwd(), "public", "prescriptions");
        const filePath = join(uploadDir, filename);

        // Save the file
        await writeFile(filePath, buffer);
        prescriptionLink = `/prescriptions/${filename}`;
      }

      // Update the appointment with prescription details
      const updatedAppointment = await prisma.appointment.update({
        where: {
          id: Number(appointmentId),
        },
        data: {
          prescriptionLink: prescriptionLink || JSON.stringify({ notes }),
        },
      });

      return NextResponse.json(updatedAppointment);
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Error uploading prescription:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 