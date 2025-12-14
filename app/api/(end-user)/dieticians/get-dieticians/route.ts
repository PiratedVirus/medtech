import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// Fetch all dieticians along with their profile & availability
export async function GET(request: Request) {
  try {
    // Get clinic ID from headers (set by middleware) - priority
    const headersList = await headers();
    const clinicIdHeader = headersList.get('x-clinic-id');
    let clinicId: number | null = clinicIdHeader ? parseInt(clinicIdHeader, 10) : null;

    // Fallback to query param for backward compatibility
    if (!clinicId) {
      const { searchParams } = new URL(request.url);
      const clinicIdParam = searchParams.get('clinicId');
      clinicId = clinicIdParam ? parseInt(clinicIdParam, 10) : null;
    }

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic ID is required" },
        { status: 400 }
      );
    }



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