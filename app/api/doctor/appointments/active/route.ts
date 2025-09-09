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
    const dateStr = searchParams.get("date");

    if (dateStr) {
      const date = new Date(dateStr);
      const appointments = await prisma.appointment.findMany({
        where: {
          userId: doctorId,
          doctorAvailability: {
            date: date
          },
          deletedAt: null,
        },
        include: {
          patient: { select: { name: true } },
          doctorAvailability: { select: { startTime: true, endTime: true, date: true } },
        },
        orderBy: { doctorAvailability: { startTime: "asc" } },
      });
      return NextResponse.json({ appointments });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const [todayAppointments, tomorrowAppointments] = await prisma.$transaction([
      prisma.appointment.findMany({
        where: { 
          userId: doctorId, 
          doctorAvailability: { 
            date: { gte: today, lt: tomorrow } 
          }, 
          deletedAt: null 
        },
        include: {
          patient: { select: { name: true } },
          doctorAvailability: { select: { startTime: true, endTime: true, date: true } },
        },
        orderBy: { doctorAvailability: { startTime: "asc" } },
      }),
      prisma.appointment.findMany({
        where: { 
          userId: doctorId, 
          doctorAvailability: { 
            date: { gte: tomorrow, lt: dayAfter } 
          }, 
          deletedAt: null 
        },
        include: {
          patient: { select: { name: true } },
          doctorAvailability: { select: { startTime: true, endTime: true, date: true } },
        },
        orderBy: { doctorAvailability: { startTime: "asc" } },
      }),
    ]);

    return NextResponse.json({ today: todayAppointments, tomorrow: tomorrowAppointments });
  } catch (error) {
    console.error("Error fetching active appointments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
