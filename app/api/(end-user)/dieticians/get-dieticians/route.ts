import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Fetch all doctors along with their profile & availability
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
    const dieticians = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
        status: "ACTIVE",
        clinicId: Number(clinicId),
        doctorProfile: {
          isDietician: true, // Filter by isDietician flag
          deletedAt: null
        },
      },
      include: {
        doctorProfile: true,
      },
    });



    return NextResponse.json({ success: true, dieticians });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors with error " + error },
      { status: 500 }
    );
  }
}