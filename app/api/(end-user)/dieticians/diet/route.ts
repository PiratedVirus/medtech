import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cache } from 'react';

// Cache the query for 5 minutes
const getDietPlan = cache(async (patientId: number) => {
  // Prefer new DietPlan records; fallback to old diet-appointment prescription links for backward compatibility
  const latestPlan = await prisma.dietPlan.findFirst({
    where: { patientId, deletedAt: null },
    orderBy: { id: 'desc' },
  });
  if (latestPlan) return { prescriptionLink: null, dietPlan: latestPlan } as any;

  const legacy = await prisma.appointment.findFirst({
    where: { patientId, isDietician: true, deletedAt: null },
    orderBy: { id: 'desc' },
    select: { prescriptionLink: true },
  });
  return legacy as any;
});

export const revalidate = 300; // Cache for 5 minutes

// Fetch all doctors along with their profile & availability
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = Number(searchParams.get('id'));
    
        if (!patientId) {
        return NextResponse.json(
            { success: false, error: "Patient ID is required" },
            { status: 400 }
        );
        }
        const appt = await getDietPlan(patientId) as any;
        const dietLink = appt?.prescriptionLink;
        const dietPlan = appt?.dietPlan || null;
        return NextResponse.json({ success: true, dietLink, dietPlan });
    } catch (error) {
        console.error('Diet plan fetch error:', error);
        return NextResponse.json(
        { success: false, error: "Failed to fetch diet plan" },
        { status: 500 }
        );
    }
    }