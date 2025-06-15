import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Fetch all dieticians along with their profile & availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

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
      clinicId: Number(clinicId),
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