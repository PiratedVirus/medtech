import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCachedDietPlan } from "@/lib/data-cache";
import { cache } from 'react';

// Use Redis cache for diet plans (10-minute TTL)
const getDietPlan = cache(async (patientId: number) => {
  return await getCachedDietPlan(patientId);
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