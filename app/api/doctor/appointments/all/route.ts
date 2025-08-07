import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const now = new Date();

    // Upcoming appointments
    const upcoming = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        appointmentDate: { gte: now },
        deletedAt: null,
      },
      include: {
        patient: { select: { name: true, id: true } },
        payment: { select: { paymentMethod: true } },
        doctorAvailability: { select: { date: true, startTime: true, endTime: true } },
      },
      orderBy: [
        { appointmentDate: "asc" },
        { doctorAvailability: { startTime: "asc" } },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Past appointments
    const past = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        appointmentDate: { lt: now },
        deletedAt: null,
      },
      include: {
        patient: { select: { name: true, id: true } },
        payment: { select: { paymentMethod: true } },
        doctorAvailability: { select: { date: true, startTime: true, endTime: true } },
      },
      orderBy: [
        { appointmentDate: "desc" },
        { doctorAvailability: { startTime: "desc" } },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Helper to check if this is the patient's first appointment with this doctor
    async function isFirstAppointment(patientId: number) {
      const count = await prisma.appointment.count({
        where: {
          userId: doctorId,
          patientId,
          deletedAt: null,
        },
      });
      console.log("count", count);
      return count === 1;
    }

    // Add extra info to each appointment
    async function enrichAppointments(list: any[], isPast: boolean) {
      return Promise.all(
        list.map(async (appt) => {
          const first = await isFirstAppointment(appt.patient.id);
          return {
            id: appt.id,
            patientName: appt.patient.name,
            patientId: appt.patient.id,
            doctorName: user?.name || "Unknown Doctor", // Add doctor name from the logged-in user
            doctorId: user?.id || 0, // Add doctor ID
            date: appt.doctorAvailability?.date,
            startTime: appt.doctorAvailability?.startTime,
            endTime: appt.doctorAvailability?.endTime,
            status: appt.status,
            paymentType: appt.payment?.paymentMethod || null,
            consultationType: appt.consultationType,
            isFirst: first,
            prescriptionLink: isPast ? appt.prescriptionLink : undefined,
            meetingRoomLink: user?.doctorProfile?.meetingRoomLink || null, // Add meetingRoomLink
            ownerToken1: user?.doctorProfile?.ownerToken1 || null, // Add ownerToken1
          };
        })
      );
    }

    const [upcomingEnriched, pastEnriched] = await Promise.all([
      enrichAppointments(upcoming, false),
      enrichAppointments(past, true),
    ]);

    return NextResponse.json({
      upcoming: upcomingEnriched,
      past: pastEnriched,
    });
  } catch (error) {
    console.error("Error fetching all doctor appointments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 