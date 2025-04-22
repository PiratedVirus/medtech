import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addMonths } from "date-fns"; // date-fns is a handy library for date arithmetic

const prisma = new PrismaClient();

/**
 * Generates an array of upcoming appointment dates for a given feature.
 * 
 * @param featureName - e.g. "Doctor Consultation"
 * @param occurrencesPerInterval - e.g. 1 or 2
 * @param intervalInMonths - e.g. 3
 * @param totalPlanMonths - e.g. 6 or 12 (from plan.duration)
 */
function generateNextAppointmentDates(
  featureName: string,
  occurrencesPerInterval: number,
  intervalInMonths: number,
  totalPlanMonths: number
) {
  interface AppointmentDate {
    featureName: string;
    date: Date;
  }

  const nextAppointmentDates: AppointmentDate[] = [];
  const currentTime = new Date();

  // If either occurrencesPerInterval or intervalInMonths is missing, return empty
  if (!occurrencesPerInterval || !intervalInMonths) {
    console.log(
      `Skipping generation for ${featureName}. occurrencesPerInterval=`,
      occurrencesPerInterval,
      " intervalInMonths=",
      intervalInMonths
    );
    return nextAppointmentDates;
  }

  console.log(`Generating dates for feature="${featureName}", occurrences=${occurrencesPerInterval}, interval=${intervalInMonths}, planMonths=${totalPlanMonths}`);

  // e.g. if the plan is 6 months total, and intervalInMonths = 3 => total intervals = 2
  const totalIntervals = Math.floor(totalPlanMonths / intervalInMonths);
  const totalAppointments = totalIntervals * occurrencesPerInterval;

  // e.g. intervalInMonths=3, occurrences=1 => each booking is 3 months apart
  // if occurrences=2 => each booking is 1.5 months apart
  const monthsBetweenEachBooking = intervalInMonths / occurrencesPerInterval;

  console.log(
    `totalIntervals=${totalIntervals}, totalAppointments=${totalAppointments}, monthsBetweenEachBooking=${monthsBetweenEachBooking}`
  );

  for (let i = 0; i < totalAppointments; i++) {
    const nextDate = addMonths(currentTime, monthsBetweenEachBooking * i);
    nextAppointmentDates.push({
      featureName,
      date: nextDate,
    });
  }

  return nextAppointmentDates;
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/plans/confirmPurchase called.");

    const body = await request.json();
    console.log("Request body parsed:", body);

    const {
      planId,
      patientId, // pass patient ID instead
      razorpayOrderId,
      razorpayPaymentId,
      razorpayResponse,
      subscriptionPrice
    } = body || {};

    console.log("Received planId=", planId, " patientId=", patientId);

    if (!planId || !patientId) {
      console.log("Either planId or patientId is missing. Throwing error...");
      throw new Error("planId and patientId are required");
    }

    const newTracker = await prisma.$transaction(async (tx) => {
      // 1) Fetch the plan (e.g. "6 Months" or "12 Months")
      const plan = await tx.plan.findUnique({
        where: { id: planId },
      });
      console.log("Fetched plan:", plan);

      if (!plan) {
        console.log("Plan not found, throwing error...");
        throw new Error("Plan not found");
      }

      // 2) Convert plan.duration (e.g. "6 Months") to a numeric total
      let monthsToAdd = 0;
      const durationLower = plan.duration.toLowerCase();
      if (durationLower.includes("6")) {
        monthsToAdd = 6;
      } else if (durationLower.includes("12")) {
        monthsToAdd = 12;
      }

      // fallback if needed
      if (!monthsToAdd) {
        console.log("Unsupported plan duration:", plan.duration);
        throw new Error("Unsupported plan duration: " + plan.duration);
      }

      console.log("Plan is for", monthsToAdd, "months.");

      // 3) Fetch plan features
      const planFeatureDetails = await tx.planFeature.findMany({
        where: { planId },
      });
      console.log("Fetched planFeatureDetails:", planFeatureDetails);

      // We'll accumulate all next appointment items here:
      const allNextAppointmentItems: { featureName: string; date: Date }[] = [];

      // Generate next appointment dates for each feature
      for (const feature of planFeatureDetails) {
        const featureDates = generateNextAppointmentDates(
          feature.featureName,
          feature.occurrencesPerInterval || 0,
          feature.intervalInMonths || 0,
          monthsToAdd
        );
        console.log(
          `Generated ${featureDates.length} dates for feature="${feature.featureName}"`
        );
        // Merge into our master array
        allNextAppointmentItems.push(...featureDates);
      }

      // 4) Convert that array into a dictionary by featureName => array of dates
      const featureWiseDatesArray: Record<string, Date[]> = {};
      for (const item of allNextAppointmentItems) {
        const { featureName, date } = item;
        if (!featureWiseDatesArray[featureName]) {
          featureWiseDatesArray[featureName] = [];
        }
        featureWiseDatesArray[featureName].push(date);
      }

      console.log("featureWiseDatesArray:", featureWiseDatesArray);

      // 5) Prepare data for storing in subscriptionTracker
      const doctorConsultationDates = featureWiseDatesArray["Doctor Consultation"]?.map(d => d.toISOString()) || [];
      const labTestsDates = featureWiseDatesArray["Lab Tests"]?.map(d => d.toISOString()) || [];
      const dieticianConsultationDates = featureWiseDatesArray["Dietician Consultation"]?.map(d => d.toISOString()) || [];
      const ophthalmologistConsultationDates = featureWiseDatesArray["Ophthalmologist Consultation"]?.map(d => d.toISOString()) || [];
      const usedMedicines = featureWiseDatesArray["Medicines"]?.map(d => d.toISOString()) || [];

      console.log("doctorConsultationDates:", doctorConsultationDates);
      console.log("labTestsDates:", labTestsDates);
      console.log("dieticianConsultationDates:", dieticianConsultationDates);
      console.log("ophthalmologistConsultationDates:", ophthalmologistConsultationDates);
      console.log("usedMedicines:", usedMedicines);

      // 6) Compute plan validity
      const startDate = new Date();
      const endDate = addMonths(startDate, monthsToAdd);
      console.log("startDate=", startDate, " endDate=", endDate);

      // 7) Create the subscription (PlanTracker / subscriptionTracker)
      console.log("Creating subscriptionTracker record now...");
      const newTracker = await tx.subscriptionTracker.create({
        data: {
          planId,
          patientId: patientId, // patient ID
          razorpayOrderId,
          razorpayPaymentId,
          paymentStatus: "PAID",

          doctorConsultationDates,
          labTestsDates,
          dieticianConsultationDates,
          ophthalmologistConsultationDates,
          usedMedicines,

          isActive: true,
          startDate,
          endDate,
        },
      });
      if (razorpayResponse) {
        console.log("Creating payment record for subscriptionId:", newTracker.subscriptionId, "with razorpayResponse:", razorpayResponse);
        await tx.payment.create({
          data: {
            subscriptionId: newTracker.subscriptionId, // pass subscriptionId here
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            amount: subscriptionPrice,
            currency: razorpayResponse.currency || "INR",
            paymentStatus: "Paid",
            paymentMethod: razorpayResponse.method || "upi",
          },
        });
        console.log("Payment record created");
      }
      console.log("subscriptionTracker created successfully:", newTracker);

      const updatePatient = await tx.patientProfile.update({
        where: { id: patientId },
        data: {
          planId,
          subscriptionId: newTracker.subscriptionId,
        },
      });

      return newTracker;
    });

    return NextResponse.json({
      success: true,
      subscriptionTracker: newTracker,
    });
  } catch (error: any) {
    // Log the error object fully. If error is null or undefined,
    // we handle that gracefully.
    console.error("Error confirming plan purchase");

    // Sometimes Next.js can choke if `error` isn't a real object.
    // So let's ensure we pass an object literal to NextResponse.json.
    const errorMessage = error?.message || "Failed to confirm purchase";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        rawError: JSON.stringify(error, Object.getOwnPropertyNames(error)), // attempt to log full error
      },
      { status: 500 }
    );
  }
}