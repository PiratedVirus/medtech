import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fetch all doctors along with their profile & availability
export async function GET() {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR", // Fetch only doctors
        status: "ACTIVE", // Ensure they are active
      },
      include: {
        doctorProfile: {
          include: {
            availability: true, // Fetch available slots
          },
        },
      },
    });

    return NextResponse.json({ success: true, doctors });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}