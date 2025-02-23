import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
        status: "ACTIVE",
        clinicId: Number(clinicId),
      },
      include: {
        doctorProfile: true,
      },
    });

    return NextResponse.json({ success: true, doctors });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors with error " + error },
      { status: 500 }
    );
  }
}