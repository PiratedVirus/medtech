import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSubdomainClinicFromRequest } from "@/lib/clinic-auth";

// Fetch lab packages for the current clinic (multi-tenancy)
export async function GET(request: NextRequest) {
  try {
    // Get clinic ID from subdomain
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('packageId');

    // Build where clause with clinic filtering
    let where: any = {
      clinicId: subdomainClinicId,
      deletedAt: null,
    };
    
    if (packageId) {
      where.id = parseInt(packageId, 10);
    }

    const packages = await prisma.labPackage.findMany({
      where
    });

    return NextResponse.json({ success: true, packages });
  } catch (error) {
    console.error("[get-labs] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lab packages" },
      { status: 500 }
    );
  }
}