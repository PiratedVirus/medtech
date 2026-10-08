import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { tokenUserWhere } from "@/lib/clinic-auth";

export async function PUT(request: Request) {
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
      where: await tokenUserWhere(decoded),
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return new NextResponse("Payment ID is required", { status: 400 });
    }

    // Verify the payment belongs to this doctor
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        appointment: {
          userId: user.id,
        },
        paymentStatus: "PENDING",
      },
    });

    if (!payment) {
      return new NextResponse("Payment not found or not pending", { status: 404 });
    }

    // Update payment status to PAID
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: "PAID" },
    });

    return NextResponse.json({
      success: true,
      message: "Payment collected successfully",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error collecting payment:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 