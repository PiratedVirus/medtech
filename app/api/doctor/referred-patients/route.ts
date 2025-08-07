import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface ReferredPatient {
  id: number;
  name: string;
  phoneNumber: string;
  registeredAt: string;
  appointments: {
    id: number;
    date: string;
    status: string;
  }[];
}

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

export async function GET() {
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

    // Find all patients who registered using this doctor's code
    const referredPatients = await prisma.user.findMany({
      where: {
        doctorCode: doctor.doctorProfile.doctorCode,
        role: "PATIENT",
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        createdAt: true,
        patientProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get appointments for each patient
    const patientsWithAppointments = await Promise.all(
      referredPatients.map(async (patient) => {
        const appointments = await prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            deletedAt: null,
          },
          select: {
            id: true,
            appointmentDate: true,
            status: true,
          },
          orderBy: {
            appointmentDate: "desc",
          },
          take: 5,
        });

        return {
          id: patient.id,
          name: patient.name,
          phoneNumber: patient.phoneNumber,
          registeredAt: patient.createdAt.toISOString(),
          appointments: appointments.map((appointment) => ({
            id: appointment.id,
            date: appointment.appointmentDate!.toISOString(),
            status: appointment.status,
          })),
        } satisfies ReferredPatient;
      })
    );

    return NextResponse.json(patientsWithAppointments);
  } catch (error) {
    console.error("Error fetching referred patients:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 