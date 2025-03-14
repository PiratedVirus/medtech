import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { differenceInMonths } from "date-fns";

const prisma = new PrismaClient();

/**
 * GET /api/plan-usage?userId=123
 *
 * Returns:
 * {
 *   success: boolean,
 *   data?: {
 *     subscriptionTracker: { ... },
 *     planFeatures: [ { featureName, occurrencesPerInterval, intervalInMonths }, ... ]
 *   },
 *   error?: string
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    if (!userIdParam) {
      throw new Error("Missing userId");
    }
    const userId = parseInt(userIdParam);

    // 1) Find the user's active plan tracker (if any)
    const subscriptionTracker = await prisma.subscriptionTracker.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: {
          gt: new Date(), // endDate in the future
        },
      },
      include: {
        plan: true, // so we can see plan info if needed
      },
    });

    if (!subscriptionTracker) {
      return NextResponse.json({
        success: false,
        error: "No active plan found for this user",
      });
    }

    // 2) Get all PlanFeature rows for this plan
    const planFeatures = await prisma.planFeature.findMany({
      where: { planId: subscriptionTracker.planId },
      select: {
        id: true,
        featureName: true,
        occurrencesPerInterval: true,
        intervalInMonths: true,
        parameters: true,
      },
    });

    // 3) Return data
    return NextResponse.json({
      success: true,
      data: {
        subscriptionTracker,
        planFeatures,
      },
    });
  } catch (error: any) {
    console.error("Error fetching plan usage:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch usage" },
      { status: 500 }
    );
  }
}