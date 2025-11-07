import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCachedDietPlan } from "@/lib/data-cache";

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
        const appt = await getCachedDietPlan(patientId) as any;
        const dietLink = appt?.prescriptionLink;
        const dietPlan = appt?.dietPlan || null;
        return NextResponse.json({ success: true, dietLink, dietPlan });
    } catch (error: any) {
        console.error('Diet plan fetch error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || "Failed to fetch diet plan" },
            { status: 500 }
        );
    }
}