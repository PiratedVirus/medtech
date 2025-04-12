import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, duration, price, discountPercentage, planFeatures } = await request.json();

    const formattedPrice = Number(price);
    const formattedDiscount = discountPercentage ? Number(discountPercentage) : undefined;

    // Ensure that each feature object does NOT contain an id by destructuring it out.
    const formattedFeatures = planFeatures.map((feature: any) => {
      const { id, ...featureData } = feature;  // Strip out 'id' if present
      return {
        featureName: featureData.featureName,
        occurrencesPerInterval: featureData.occurrencesPerInterval ? Number(featureData.occurrencesPerInterval) : undefined,
        intervalInMonths: featureData.intervalInMonths ? Number(featureData.intervalInMonths) : undefined,
        parameters: featureData.parameters,  // parameters as string (if that's intended)
        notes: featureData.notes,
      };
    });

    // Use a transaction to insert the plan and then its associated features.
    const result = await prisma.$transaction(async (tx) => {
      // First, create the plan.
      const newPlan = await tx.plan.create({
        data: {
          name,
          duration: duration,
          price: formattedPrice,
          discountPercentage: formattedDiscount,
        },
      });

      // Next, create the associated planFeatures using the generated plan id.
      // If no features are provided, this step can be skipped.
      if (formattedFeatures.length > 0) {
        await tx.planFeature.createMany({
          data: formattedFeatures.map((feature: any) => ({
            ...feature,
            planId: newPlan.id,
          })),
        });
      }

      return newPlan;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const plans = await prisma.plan.findMany({
      include: {
        planFeatures: true,
      },
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Destructure and convert numeric fields appropriately
    const { id, name, duration, price, discountPercentage, planFeatures } = await request.json();
    
    const formattedPrice = Number(price);
    const formattedDiscount = discountPercentage ? Number(discountPercentage) : null;
    
    // Also convert any numeric fields inside planFeatures
    const formattedFeatures = planFeatures.map((feature: any) => ({
      featureName: feature.featureName,
      occurrencesPerInterval: feature.occurrencesPerInterval ? Number(feature.occurrencesPerInterval) : undefined,
      intervalInMonths: feature.intervalInMonths ? Number(feature.intervalInMonths) : undefined,
      parameters: feature.parameters,
      notes: feature.notes,
    }));
    
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        duration,
        price: formattedPrice,
        discountPercentage: formattedDiscount,
        planFeatures: {
          deleteMany: {},
          create: formattedFeatures,
        },
      },
    });
    
    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    await prisma.plan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Plan deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
