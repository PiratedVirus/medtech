import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, duration, price, discountPercentage, features } = await request.json();

    const plan = await prisma.plan.create({
      data: {
        name,
        duration,
        price,
        discountPercentage,
        planFeatures: {
          create: features.map((feature: any) => ({
            featureName: feature.featureName,
            occurrencesPerInterval: feature.occurrencesPerInterval,
            intervalInMonths: feature.intervalInMonths,
            parameters: feature.parameters,
            notes: feature.notes,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, duration, price, discountPercentage, features } = await request.json();

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        duration,
        price,
        discountPercentage,
        planFeatures: {
          deleteMany: {},
          create: features.map((feature: any) => ({
            featureName: feature.featureName,
            occurrencesPerInterval: feature.occurrencesPerInterval,
            intervalInMonths: feature.intervalInMonths,
            parameters: feature.parameters,
            notes: feature.notes,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
