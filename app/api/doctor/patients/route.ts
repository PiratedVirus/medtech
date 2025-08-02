import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET() {
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
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = user.id;
    console.log("Doctor patients API called with doctorId:", doctorId);

    // First get the doctor's appointments to find their patients
    const doctorAppointments = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        // isDietician: false,
        deletedAt: null
      },
      select: {
        patientId: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            patientProfile: {
              select: {
                planTrackers: {
                  select: {
                    endDate: true,
                    isActive: true,
                    plan: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      },
      distinct: ['patientId']
    });

    // Extract unique patients from the appointments
    const patients = doctorAppointments.map(apt => apt.patient);

    console.log("Found patients:", patients.length);
    console.log("Patients data:", patients);

    return NextResponse.json(patients);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch patients data' }, { status: 500 });
  }
} 