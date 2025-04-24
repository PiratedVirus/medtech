import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // 2) Fetch all plans including features
    const allPlans = await prisma.plan.findMany({
      include: {
        planFeatures: true,
      },
    });

    // 3) Build dynamic pricing structure
    const pricingData: Record<string, any> = {};

    for (const plan of allPlans) {
      const durationKey = plan.duration.toLowerCase(); // e.g., "6months"
      const planKey = plan.name.toLowerCase().replace("+", "Plus"); // "carePlus"

      if (!pricingData[durationKey]) {
        pricingData[durationKey] = {};
      }

      const featureMap: Record<string, any> = {};

      for (const feat of plan.planFeatures || []) {
        const rawKey = feat.featureName
          .replace(/\s+/g, "")
          .replace(/[^a-zA-Z0-9]/g, "")
          .replace(/^./, (c) => c.toLowerCase()); // e.g., doctorConsultation

        const isLab = rawKey.toLowerCase().includes("lab");
        const isMedicine = rawKey.toLowerCase().includes("medicine");

        if (isMedicine) {
          featureMap[rawKey] = {
            discount: plan.discountPercentage ?? 0,
          };
        } else if (isLab) {
          featureMap[rawKey] = {
            totalTests: feat.occurrencesPerInterval || 0,
            frequencyPerInterval: feat.occurrencesPerInterval || 0,
            intervalInMonths: feat.intervalInMonths || 0,
            parameters: feat.parameters || "",
          };
        } else {
          featureMap[rawKey] = {
            totalConsultations: feat.occurrencesPerInterval || 0,
            frequencyPerInterval: feat.occurrencesPerInterval || 0,
            intervalInMonths: feat.intervalInMonths || 0,
          };
        }
      }

      pricingData[durationKey][planKey] = {
        planId: plan.id,
        name: plan.name,
        price: plan.price ?? 0,
        ...featureMap,
      };
    }

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