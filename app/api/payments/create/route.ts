import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        const { amount, currency = "INR", receipt } = await req.json();

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID as string,
            key_secret: process.env.RAZORPAY_KEY_SECRET as string,
        });

        if (!razorpay) {
            throw new Error("Razorpay instance creation failed");
        }

        const order = await razorpay.orders.create({
            amount, // Amount in paisa (₹500 = 50000)
            currency,
            receipt,
        });

        return NextResponse.json({ success: true, orderId: order.id });
    } catch (error: any) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to create order" }, { status: 500 });
    }
}