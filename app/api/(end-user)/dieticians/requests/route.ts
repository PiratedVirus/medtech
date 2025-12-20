import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSubdomainClinicFromRequest } from "@/lib/clinic-auth";

// Create diet plan request (patient -> dietician)
export async function POST(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy validation
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic subdomain is required. Please access this page using your clinic URL." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { patientId, dieticianId, complaint } = body;
    if (!patientId || !dieticianId || !complaint) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // Validate patient belongs to subdomain clinic
    const patient = await prisma.user.findFirst({
      where: {
        id: Number(patientId),
        role: 'PATIENT',
        clinicId: subdomainClinicId,
        deletedAt: null
      },
      select: { id: true, clinicId: true }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found or does not belong to this clinic" },
        { status: 404 }
      );
    }

    // Validate dietician belongs to same clinic
    const dietician = await prisma.user.findFirst({
      where: {
        id: Number(dieticianId),
        role: 'DOCTOR',
        clinicId: subdomainClinicId,
        deletedAt: null,
        doctorProfile: {
          isDietician: true,
          deletedAt: null
        }
      },
      select: { id: true, clinicId: true }
    });

    if (!dietician) {
      return NextResponse.json(
        { success: false, error: "Dietician not found or does not belong to this clinic" },
        { status: 404 }
      );
    }

    // Ensure patient and dietician are in the same clinic
    if (patient.clinicId !== dietician.clinicId) {
      return NextResponse.json(
        { success: false, error: "Patient and dietician must belong to the same clinic" },
        { status: 403 }
      );
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
export async function GET(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy validation
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic subdomain is required. Please access this page using your clinic URL." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = Number(searchParams.get("patientId"));
    if (!patientId) return NextResponse.json({ success: false, error: "patientId required" }, { status: 400 });
    
    // Validate patient belongs to subdomain clinic
    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: 'PATIENT',
        clinicId: subdomainClinicId,
        deletedAt: null
      },
      select: { id: true, clinicId: true }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found or does not belong to this clinic" },
        { status: 404 }
      );
    }
    
    const requests = await prisma.dietPlanRequest.findMany({
      where: { 
        patientId,
        deletedAt: null,
        // Ensure dietician belongs to same clinic
        dietician: {
          clinicId: subdomainClinicId,
          deletedAt: null
        }
      },
      orderBy: { id: "desc" },
      include: { 
        dietician: { select: { id: true, name: true, clinicId: true } }
      }
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
    console.error('Error in GET /api/dieticians/requests:', e);
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}


