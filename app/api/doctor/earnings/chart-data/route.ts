import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { requireDoctorAuth } from "@/lib/clinic-auth";

export async function GET(request: Request) {
  try {
    // Use centralized authentication with multi-tenancy validation
    const auth = await requireDoctorAuth();
    
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.errorCode === 'CLINIC_MISMATCH' ? 403 : 401 }
      );
    }

    if (!auth.userId || !auth.clinicId) {
      return NextResponse.json(
        { error: "Invalid authentication context" },
        { status: 401 }
      );
    }

    const doctorId = auth.userId;
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
        whereClause.paymentMethod = { in: ["cash", "Cash", "CASH"] };
        break;
      case "online":
        whereClause.paymentStatus = "PAID";
        whereClause.paymentMethod = { in: ["online", "Online", "ONLINE", "upi", "UPI", "card", "Card", "CARD"] };
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