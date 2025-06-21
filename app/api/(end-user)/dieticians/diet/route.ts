import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cache } from 'react';

// Cache the query for 5 minutes
const getDietPlan = cache(async (patientId: number) => {
  return prisma.appointment.findFirst({
    where: {
      patientId,
      isDietician: true,
      deletedAt: null,
    },
    orderBy: {
      id: "desc",
    },
    select: {
      prescriptionLink: true,
    },
  });
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
        const appt = await getDietPlan(patientId);
        const dietLink = appt?.prescriptionLink;
    
        return NextResponse.json({ success: true, dietLink });
    } catch (error) {
        console.error('Diet plan fetch error:', error);
        return NextResponse.json(
        { success: false, error: "Failed to fetch diet plan" },
        { status: 500 }
        );
    }
    }