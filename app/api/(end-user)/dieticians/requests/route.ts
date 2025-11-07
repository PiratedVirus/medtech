import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Create diet plan request (patient -> dietician)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, dieticianId, complaint } = body;
    if (!patientId || !dieticianId || !complaint) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }
    const reqRec = await prisma.dietPlanRequest.create({
      data: { patientId: Number(patientId), dieticianId: Number(dieticianId), complaint },
    });
    return NextResponse.json({ success: true, request: reqRec });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

// List my requests (patient)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = Number(searchParams.get("patientId"));
    if (!patientId) return NextResponse.json({ success: false, error: "patientId required" }, { status: 400 });
    
    const requests = await prisma.dietPlanRequest.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { id: "desc" },
      include: { 
        dietician: { select: { id: true, name: true } }
      }
    });
    
    // Manually fetch diet plans for requests that have planId
    const requestsWithPlans = await Promise.all(
      requests.map(async (request) => {
        let dietPlan = null;
        if (request.planId) {
          try {
            dietPlan = await prisma.dietPlan.findFirst({
              where: { 
                id: request.planId, 
                deletedAt: null 
              }
            });
          } catch (error) {
            console.error(`Error fetching diet plan ${request.planId}:`, error);
          }
        }
        return {
          ...request,
          dietPlan
        };
      })
    );
    
    return NextResponse.json({ success: true, requests: requestsWithPlans });
  } catch (e: any) {
    console.error('Error in GET /api/dieticians/requests:', e);
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}


