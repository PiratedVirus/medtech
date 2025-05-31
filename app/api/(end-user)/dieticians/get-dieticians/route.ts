import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Fetch all dieticians along with their profile & availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    // Get the current user's doctor code if they have one
    let userDoctorCode = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          plusAddedPhoneNumber: string;
        };
        
        if (decoded.plusAddedPhoneNumber) {
          const user = await prisma.user.findUnique({
            where: { phoneNumber: decoded.plusAddedPhoneNumber },
            select: { doctorCode: true }
          });
          userDoctorCode = user?.doctorCode;
        }
      } catch (error) {
        console.error("Error verifying token:", error);
      }
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

    // If user has a doctor code, only show that doctor
    if (userDoctorCode) {
      where.doctorProfile = {
        ...where.doctorProfile,
        doctorCode: userDoctorCode
      };
    }

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