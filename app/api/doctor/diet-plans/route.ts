import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";

// Create a diet plan and mark request as CREATED
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, dieticianId, title, notes, startDate, endDate, meals, customMealTimings, requestId } = body;
    if (!patientId || !dieticianId || !meals) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }
    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.dietPlan.create({
        data: {
          patientId: Number(patientId),
          dieticianId: Number(dieticianId),
          title: title || null,
          notes: notes || null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          meals,
          customMealTimings: customMealTimings || null,
          requestId: requestId ? Number(requestId) : null,
        }
      });
      if (requestId) {
        await tx.dietPlanRequest.update({ 
          where: { id: Number(requestId) }, 
          data: { status: 'CREATED', planId: created.id } 
        });
      }
      return created;
    });
    return NextResponse.json({ success: true, plan });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

// Get latest plan for a patient (doctor view)
const getDietPlansHandler = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = Number(searchParams.get('patientId'));
    if (!patientId) return NextResponse.json({ success: false, error: 'patientId required' }, { status: 400 });
    const plan = await prisma.dietPlan.findFirst({ where: { patientId, deletedAt: null }, orderBy: { id: 'desc' } });
    return NextResponse.json({ success: true, plan });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Server error' }, { status: 500 });
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/doctor/diet-plans'))(getDietPlansHandler);


