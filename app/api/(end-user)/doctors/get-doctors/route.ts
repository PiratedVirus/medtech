import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSubdomainClinicFromRequest } from "@/lib/clinic-auth";

// Fetch all doctors along with their profile & availability
export async function GET(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json(
        { success: false, error: "Clinic subdomain is required. Please access this page using your clinic URL." },
        { status: 400 }
      );
    }

    const clinicId = subdomainClinicId;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Get the current user's doctor code if they have one
    let userDoctorCode = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          plusAddedPhoneNumber: string;
        };

        if (decoded.plusAddedPhoneNumber) {
          const user = await prisma.user.findFirst({
            where: { 
              phoneNumber: decoded.plusAddedPhoneNumber,
              deletedAt: null
            },
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
      clinicId: clinicId,
      doctorProfile: {
        isDietician: false,
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

    const doctors = await prisma.user.findMany({
      where,
      include: {
        doctorProfile: true,
      },
    });

    return NextResponse.json({ success: true, doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}