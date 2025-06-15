import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encryptData } from "@/lib/encryption";

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

    // Encrypt the doctor code
    const encryptedCode = encryptData({ doctorCode });

    // Generate referral link with encrypted code
    const baseUrl = new URL(request.url).origin;
    const referralLink = `${baseUrl}/login?code=${encodeURIComponent(encryptedCode)}`;

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