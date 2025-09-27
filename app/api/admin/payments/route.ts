import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

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

    // Create clinic filter for payments
    const userClinicFilter = createUserClinicFilter(clinicId);
    const paymentFilter = {
      OR: [
        { appointment: { doctor: userClinicFilter.user } },
        { subscription: { user: userClinicFilter.user } },
        { labBooking: { patient: userClinicFilter.user } }
      ]
    };

    const [payments, totalCount, labAgg, appointmentAgg, subscriptionAgg, totalAgg] = await prisma.$transaction([
      prisma.payment.findMany({
        where: paymentFilter,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where: paymentFilter }),
      prisma.payment.aggregate({ 
        where: { 
          ...paymentFilter,
          labBookingId: { not: null } 
        }, 
        _sum: { amount: true } 
      }),
      prisma.payment.aggregate({ 
        where: { 
          ...paymentFilter,
          appointmentId: { not: null } 
        }, 
        _sum: { amount: true } 
      }),
      prisma.payment.aggregate({ 
        where: { 
          ...paymentFilter,
          subscriptionId: { not: null } 
        }, 
        _sum: { amount: true } 
      }),
      prisma.payment.aggregate({ 
        where: paymentFilter,
        _sum: { amount: true } 
      }),
    ]);
    const earnings = {
      lab: labAgg._sum.amount ?? 0,
      appointment: appointmentAgg._sum.amount ?? 0,
      subscription: subscriptionAgg._sum.amount ?? 0,
      total: totalAgg._sum.amount ?? 0,
    };

    return NextResponse.json({
      data: payments,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      earnings,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      appointmentId,
      labBookingId,
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      currency,
      paymentStatus,
      paymentMethod
    } = data;
    const payment = await prisma.payment.create({
      data: {
        appointmentId,
        labBookingId,
        subscriptionId,
        razorpayOrderId,
        razorpayPaymentId,
        amount,
        currency,
        paymentStatus,
        paymentMethod,
      },
    });
    return NextResponse.json({ data: payment, message: "Payment created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const {
      appointmentId,
      labBookingId,
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      currency,
      paymentStatus,
      paymentMethod
    } = data;
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        appointmentId,
        labBookingId,
        subscriptionId,
        razorpayOrderId,
        razorpayPaymentId,
        amount,
        currency,
        paymentStatus,
        paymentMethod,
      },
    });
    return NextResponse.json({ data: payment, message: "Payment updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();
    await prisma.payment.deleteMany({
      where: { id: { in: ids } },
    });
    return NextResponse.json({ message: "Payment(s) deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete payment(s)" }, { status: 500 });
  }
}
