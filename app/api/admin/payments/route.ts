import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [payments, totalCount, labAgg, appointmentAgg, subscriptionAgg, totalAgg] = await prisma.$transaction([
      prisma.payment.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count(),
      prisma.payment.aggregate({ where: { labBookingId: { not: null } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { appointmentId: { not: null } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { subscriptionId: { not: null } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
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
