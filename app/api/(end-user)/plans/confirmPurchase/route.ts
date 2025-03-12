import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addMonths } from "date-fns"; // date-fns is a handy library for date arithmetic

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const {
      planId,
      userId,
      razorpayOrderId,
      razorpayPaymentId,
      // Any other Razorpay fields you want to store or verify
    } = await request.json();

    // Basic validation
    if (!planId || !userId) {
      throw new Error("planId and userId are required");
    }

    // 1) (Optional) Verify Payment if you want to confirm signature, etc.
    //    In production, you should verify the signature from Razorpay.

    // 2) Fetch the plan from DB to determine how many months to add
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new Error("Plan not found");
    }

    // We'll parse the plan.duration to see if it's "6months" or "12months"
    // Adjust if your DB stores it differently
    let monthsToAdd = 0;
    if (plan.duration.toLowerCase().includes("6")) {
      monthsToAdd = 6;
    } else if (plan.duration.toLowerCase().includes("12")) {
      monthsToAdd = 12;
    }
    // Fallback: if no recognized duration, you can set a default or throw an error

    const startDate = new Date();
    const endDate = addMonths(startDate, monthsToAdd);

    // 3) Insert a record into PlanTracker
    const newTracker = await prisma.planTracker.create({
      data: {
        planId,
        userId,
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus: "PAID",

        usedDoctorConsultation: 0,
        usedLabTests: 0,
        usedDieticianConsultation: 0,
        usedOphthalmologistConsultation: 0,
        usedMedicines: 0,

        // Set the new fields
        isActive: true,
        startDate,
        endDate,
      },
    });

    // 4) Determine if plan is currently active
    //    (active if now < endDate AND isActive)
    const now = new Date();
    const isPlanActive = newTracker.isActive && now < newTracker.endDate;

    return NextResponse.json({
      success: true,
      planTracker: newTracker,
      isPlanActive,
    });
  } catch (error: any) {
    console.error("Error confirming plan purchase:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm purchase" },
      { status: 500 }
    );
  }
}