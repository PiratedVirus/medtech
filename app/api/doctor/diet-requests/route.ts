import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserAuth, handleAuthError } from "@/lib/clinic-auth";

// List requests assigned to a dietician (doctor)
export async function GET(request: Request) {
  try {
    // Authenticate user and validate clinic access
    const auth = await requireUserAuth();
    if (!auth.success) {
      return handleAuthError(auth);
    }
    
    const clinicId = auth.clinicId;
    
    const { searchParams } = new URL(request.url);
    const dieticianId = Number(searchParams.get("dieticianId"));
    if (!dieticianId) return NextResponse.json({ success: false, error: "dieticianId required" }, { status: 400 });
    
    const requests = await prisma.dietPlanRequest.findMany({
      where: { 
        dieticianId, 
        deletedAt: null,
        // Multi-tenancy: Filter by clinic
        patient: clinicId ? { clinicId } : undefined
      },
      orderBy: { id: "desc" },
      include: { 
        patient: { select: { id: true, name: true } },
        dietician: { select: { id: true, name: true } }
      },
    });
    
    // Fetch diet plans for requests that have planId
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
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}


