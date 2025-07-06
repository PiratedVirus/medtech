import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

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
    const filter = searchParams.get("filter") || "paid"; // paid, pending, cash, online
    const slotsParam = searchParams.get("slots");
    const dateParam = searchParams.get("date");

    // If slots param is present, return { totalSlots, bookedSlots }
    if (slotsParam) {
      let where: any = { userId: doctorId, deletedAt: null };
      let appointmentWhere: any = { userId: doctorId, deletedAt: null };
      if (dateParam) {
        where.date = new Date(dateParam);
        appointmentWhere.appointmentDate = new Date(dateParam);
      }
      const [totalSlots, bookedSlots] = await prisma.$transaction([
        prisma.doctorAvailability.count({ where }),
        prisma.appointment.count({ where: appointmentWhere }),
      ]);
      return NextResponse.json({ totalSlots, bookedSlots });
    }

    // Generate last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, "MMM"),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
      });
    }

    // Build where clause based on filter
    let whereClause: any = {
      appointment: {
        userId: doctorId,
      },
    };

    switch (filter) {
      case "paid":
        whereClause.paymentStatus = "PAID";
        break;
      case "pending":
        whereClause.paymentStatus = "PENDING";
        break;
      case "cash":
        whereClause.paymentStatus = "PAID";
        whereClause.paymentMethod = "cash";
        break;
      case "online":
        whereClause.paymentStatus = "PAID";
        whereClause.paymentMethod = "online";
        break;
      default:
        whereClause.paymentStatus = "PAID";
    }

    // Fetch payments for each month
    const monthlyData = await Promise.all(
      months.map(async ({ month, startDate, endDate }) => {
        const payments = await prisma.payment.findMany({
          where: {
            ...whereClause,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        return {
          month,
          earnings: totalAmount,
        };
      })
    );

    return NextResponse.json({
      data: monthlyData,
      filter,
    });
  } catch (error) {
    console.error("Error fetching earnings chart data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 