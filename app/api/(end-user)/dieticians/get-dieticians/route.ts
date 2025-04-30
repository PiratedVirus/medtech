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
        role: "DIETICIAN",
        status: "ACTIVE",
        clinicId: Number(clinicId),
      },
      include: {
        dieticianProfile: true,
      },
    });

    const normalizedDoctors = doctors.map((doc) => ({
      ...doc,
      doctorProfile: doc.dieticianProfile,
    }));

    return NextResponse.json({ success: true, doctors: normalizedDoctors });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors with error " + error },
      { status: 500 }
    );
  }
}