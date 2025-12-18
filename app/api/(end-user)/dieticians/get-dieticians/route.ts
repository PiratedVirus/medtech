import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSubdomainClinicFromRequest } from "@/lib/clinic-auth";

// Fetch all dieticians along with their profile & availability
export async function GET(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic subdomain is required. Please access this page using your clinic URL." },
        { status: 400 }
      );
    }

    const clinicId = subdomainClinicId;



    // Build the where clause
    const where: any = {
      role: "DOCTOR",
      status: "ACTIVE",
      clinicId: clinicId,
      doctorProfile: {
        isDietician: true,
        deletedAt: null
      }
    };



    const dieticians = await prisma.user.findMany({
      where,
      include: {
        doctorProfile: true,
      },
    });

    return NextResponse.json({ success: true, dieticians });
  } catch (error) {
    console.error("Error fetching dieticians:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dieticians" },
      { status: 500 }
    );
  }
}