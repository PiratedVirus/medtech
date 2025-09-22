import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // 1) Parse userId from query string
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // 2) Convert userId to a number
    const userId = Number(userIdParam);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid userId" },
        { status: 400 }
      );
    }

    // 3) Find the patientProfile for this user
    const subscriptionDetails = await prisma.patientProfile.findUnique({
      where: { userId },
      select: {
        subscriptionId: true,
        planId: true,
      },
    });

    if (!subscriptionDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "No patientProfile found for this userId",
        },
        { status: 404 }
      );
    }

    // 4) Find the user's SubscriptionTracker record
    if (subscriptionDetails.subscriptionId === null) {
      return NextResponse.json(
        {
          success: true,
          data: {
            subscriptionId: null,
            planId: subscriptionDetails.planId,
            planName: null,
            doctorConsultationDates: [],
            dieticianConsultationDates: [],
            labTestDates: [],
            ophthalmologistConsultationDates: [],
            usedMedicines: [],
          },
        },
        { status: 200 }
      );
    }

    const subscribedPlan = await prisma.subscriptionTracker.findFirst({
      where: {
        subscriptionId: subscriptionDetails.subscriptionId,
      },
    });

    let planName = null;
    if (subscriptionDetails.planId !== null) {
      planName = await prisma.plan.findUnique({
        where: {
          id: subscriptionDetails.planId,
        },
        select: {
          name: true,
        },
      });
    }

    if (!subscribedPlan) {
      return NextResponse.json(
        {
          success: false,
          error: "No subscription found for this user",
        },
        { status: 404 }
      );
    }

    // 5) Extract the relevant usage data
    const doctorConsultationDates = subscribedPlan.doctorConsultationDates || [];
    const dieticianConsultationDates = subscribedPlan.dieticianConsultationDates || [];
    const labTestDates = subscribedPlan.labTestsDates || [];
    const ophthalmologistConsultationDates = subscribedPlan.ophthalmologistConsultationDates || [];
    const usedMedicines = subscribedPlan.usedMedicines || [];


    // 6) Return a successful response
    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscriptionDetails.subscriptionId,
        planId: subscriptionDetails.planId,
        planName: planName ? planName.name : null,
        doctorConsultationDates,
        dieticianConsultationDates,
        labTestDates,
        ophthalmologistConsultationDates,
        usedMedicines,
      },
    });
  } catch (error: any) {
    // 7) Catch unexpected errors
    console.error("Error fetching subscription tracker:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch subscription tracker" },
      { status: 500 }
    );
  }
}