import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Example GET endpoint:
 *   GET /api/(end-user)/plans?userId=123
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 1) Check if user is already subscribed
    let alreadySubscribed = false;
    if (userId) {
      // Find any active plan in PlanTracker for this user
      const activePlan = await prisma.subscriptionTracker.findFirst({
        where: {
          patientId: Number(userId),
          isActive: true,
          endDate: {
            // plan is active if endDate is in the future
            gt: new Date(),
          },
        },
      });
      if (activePlan) {
        alreadySubscribed = true;
      }
    }

    // 2) Fetch all plans
    //    Assuming your Plan table has columns: id, name, duration, price
    //    and you might have a PlanFeature table with numeric fields
    const allPlans = await prisma.plan.findMany({
      include: {
        planFeatures: true, // if you want to gather feature data
      },
    });

    // 3) Transform the DB data into a structure like:
    //    {
    //      "6months": {
    //         basic: { planId, name, price, doctorConsultation: {...}, ... },
    //         care: {...},
    //         carePlus: {...}
    //      },
    //      "12months": { ... }
    //    }
    const pricingData: Record<string, any> = {};

    for (const plan of allPlans) {
      // e.g. plan.duration = "6months" or "12months"
      // e.g. plan.name = "Basic", "CARE", "CARE+"
      const durationKey = plan.duration.toLowerCase(); // "6months"
      const planKey = plan.name.toLowerCase().replace("+", "Plus"); // "basic" or "carePlus"

      // Initialize the object if needed
      if (!pricingData[durationKey]) {
        pricingData[durationKey] = {};
      }

      // Build a partial object
      // If you have numeric plan features, you'd map them here:
      // For simplicity, we'll show an example with "doctorConsultation" etc.
      let docConsult = { totalConsultations: 0, frequencyPerInterval: 0, intervalInMonths: 0 };
      let labTests = { totalTests: 0, frequencyPerInterval: 0, intervalInMonths: 0, parameters: "" };
      let dietConsult = { totalConsultations: 0, frequencyPerInterval: 0, intervalInMonths: 0 };
      let ophthConsult = { totalConsultations: 0, frequencyPerInterval: 0, intervalInMonths: 0 };
      let medicines = { discount: plan.discountPercentage ?? 0 };

      // If you have PlanFeature rows, fill them in from plan.planFeatures
      // For instance:
      //    planFeature.featureName = "Doctor Consultation" => docConsult = ...
      //    planFeature.featureName = "Lab Tests" => labTests = ...
      for (const feat of plan.planFeatures || []) {
        switch (feat.featureName.toLowerCase()) {
          case "doctor consultation":
            docConsult = {
              totalConsultations: feat.occurrencesPerInterval || 0,
              frequencyPerInterval: feat.occurrencesPerInterval || 0,
              intervalInMonths: feat.intervalInMonths || 0,
            };
            break;
          case "lab tests":
            labTests = {
              totalTests: feat.occurrencesPerInterval || 0,
              frequencyPerInterval: feat.occurrencesPerInterval || 0,
              intervalInMonths: feat.intervalInMonths || 0,
              parameters: feat.parameters || '',
            };
            break;
          case "dietician consultation":
            dietConsult = {
              totalConsultations: feat.occurrencesPerInterval || 0,
              frequencyPerInterval: feat.occurrencesPerInterval || 0,
              intervalInMonths: feat.intervalInMonths || 0,
            };
            break;
          case "ophthalmologist consultation":
            ophthConsult = {
              totalConsultations: feat.occurrencesPerInterval || 0,
              frequencyPerInterval: feat.occurrencesPerInterval || 0,
              intervalInMonths: feat.intervalInMonths || 0,
            };
            break;
          case "medicines":
            medicines = {
              discount: plan.discountPercentage ?? 0,
            };
            break;
          default:
            break;
        }
      }

      pricingData[durationKey][planKey] = {
        planId: plan.id,
        name: plan.name,
        price: plan.price ?? 0,
        doctorConsultation: docConsult,
        labTests: labTests,
        dieticianConsultation: dietConsult,
        ophthalmologistConsultation: ophthConsult,
        medicines: medicines,
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