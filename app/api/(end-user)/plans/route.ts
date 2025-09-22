import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCachedPlansData } from "@/lib/data-cache";

/**
 * GET /api/(end-user)/plans?userId=123
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 1) Check if user is already subscribed
    let alreadySubscribed = false;
    if (userId) {
      const activePlan = await prisma.subscriptionTracker.findFirst({
        where: {
          patientId: Number(userId),
          isActive: true,
          endDate: {
            gt: new Date(),
          },
        },
      });
      if (activePlan) {
        alreadySubscribed = true;
      }
    }

    // 2) Fetch all plans including features (with Redis caching)
    const { plans: allPlans, pricingData } = await getCachedPlansData();

    return NextResponse.json({
      success: true,
      pricingData,
      alreadySubscribed,
    });
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch plans" },
      { status: 500 }
    );
  }
}