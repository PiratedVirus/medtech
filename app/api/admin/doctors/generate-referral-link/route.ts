import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { doctorCode } = await request.json();

    if (!doctorCode) {
      return NextResponse.json(
        { success: false, error: "Doctor code is required" },
        { status: 400 }
      );
    }

    // Verify doctor exists and is active
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        doctorCode,
        deletedAt: null,
        user: {
          status: "ACTIVE"
        }
      },
      include: {
        user: true
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive doctor code" },
        { status: 404 }
      );
    }

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}/login?doctorCode=${doctorCode}`;

    return NextResponse.json({
      success: true,
      referralLink,
      doctorName: doctor.user.name
    });
  } catch (error) {
    console.error("Error generating referral link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate referral link" },
      { status: 500 }
    );
  }
} 