import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encryptData } from "@/lib/encryption";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the token and get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      role: string;
    };

    if (!decoded || decoded.role !== "DOCTOR") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { doctorCode } = await req.json();

    if (!doctorCode) {
      return new NextResponse("Doctor code is required", { status: 400 });
    }

    // Verify that the doctor code belongs to the logged-in doctor
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        userId: decoded.id,
        doctorCode,
      },
    });

    if (!doctor) {
      return new NextResponse("Invalid doctor code", { status: 400 });
    }

    // Encrypt the doctor code
    const encryptedCode = encryptData({ doctorCode });

    // Generate referral link with encrypted code
    const baseUrl = new URL(req.url).origin;
    const referralLink = `${baseUrl}/signup?code=${encodeURIComponent(encryptedCode)}`;

    return NextResponse.json({ referralLink });
  } catch (error) {
    console.error("Error generating referral link:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 