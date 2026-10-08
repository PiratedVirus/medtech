import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSubdomainClinicFromRequest } from "@/lib/clinic-auth";
import { tokenUserWhere } from "@/lib/clinic-auth";

// Fetch all doctors along with their profile & availability
export async function GET(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Resolve user from token (needed for doctorCode filter + clinicId fallback)
    let userDoctorCode = null;
    let tokenClinicId: number | null = null;
    let tokenUserId: number | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          plusAddedPhoneNumber: string;
          userId?: number;
          clinicId?: number | null;
        };

        tokenClinicId = decoded.clinicId ?? null;
        tokenUserId = decoded.userId ?? null;

        // Resolve user: prefer userId, fallback to phone + clinic
        let user = null;
        if (decoded.userId || decoded.plusAddedPhoneNumber) {
          user = await prisma.user.findFirst({
            where: await tokenUserWhere(decoded),
            select: { doctorCode: true, clinicId: true },
          });
        }

        userDoctorCode = user?.doctorCode ?? null;
        // Use user's clinicId as another fallback
        if (!tokenClinicId && user?.clinicId) {
          tokenClinicId = user.clinicId;
        }
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    }

    // Determine effective clinicId: subdomain > token > user record
    const clinicId = subdomainClinicId || tokenClinicId;

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Could not determine clinic. Please access using your clinic URL or re-login." },
        { status: 400 }
      );
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