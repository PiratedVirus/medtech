// app/api/plans/createOrder/route.ts
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
export async function POST(request: Request) {
  try {
    const { planId } = await request.json();
    if (!planId) {
      throw new Error("planId is required");
    }

    // 1) Fetch plan price from DB
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Convert plan price (e.g. 9999.00) to integer paisa (e.g. 999900)
    // Default to 0 if price is null
    const amountInPaisa = plan.price ? parseInt((+plan.price * 100).toFixed(0)) : 0;

    // 2) Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID as string,
      key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });

    // 3) Create order
    const order = await razorpay.orders.create({
      amount: amountInPaisa,
      currency: "INR",
      receipt: `plan_${planId}_${Date.now()}`,
    });

    return NextResponse.json({ success: true, orderId: order.id, amount: amountInPaisa });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}